import { TYPES } from "tedious";
import { execute, executeTransaction, execSql } from "./db.js";

export type User = {
  UserId: number;
  Username: string | null;
  PasswordHash: string | null;
  Phone: string | null;
  PhoneVerifiedAt: Date | null;
  Email: string | null;
  Role: "Client" | "Admin";
  MustChangePassword: boolean;
};

const mapUser = (user?: User | null) => (user ? { ...user, MustChangePassword: Boolean(user.MustChangePassword) } : null);

const baseSelect = "SELECT UserId, Username, PasswordHash, Phone, PhoneVerifiedAt, Email, Role, MustChangePassword FROM Users";

const findById = async (userId: number) => {
  const rows = await execute<User>(`${baseSelect} WHERE UserId = @UserId`, [{ name: "UserId", type: TYPES.Int, value: userId }]);
  return mapUser(rows[0]);
};

const findByUsername = async (username: string) => {
  const rows = await execute<User>(`${baseSelect} WHERE Username = @Username`, [{ name: "Username", type: TYPES.NVarChar, value: username }]);
  return mapUser(rows[0]);
};

const findByPhone = async (phone: string) => {
  const rows = await execute<User>(`${baseSelect} WHERE Phone = @Phone`, [{ name: "Phone", type: TYPES.NVarChar, value: phone }]);
  return mapUser(rows[0]);
};

const findByProvider = async (providerType: "google" | "local", providerSubject: string) => {
  const rows = await execute<User>(
    `${baseSelect} U JOIN AuthProviders A ON A.UserId = U.UserId WHERE A.ProviderType = @ProviderType AND A.ProviderSubject = @ProviderSubject`,
    [
      { name: "ProviderType", type: TYPES.NVarChar, value: providerType },
      { name: "ProviderSubject", type: TYPES.NVarChar, value: providerSubject }
    ]
  );
  return mapUser(rows[0]);
};

const createLocalUser = async ({ username, passwordHash, phone, email }: { username: string; passwordHash: string; phone: string; email: string | null }) =>
  executeTransaction(async (connection) => {
    const inserted = await execSql<{ UserId: number }>(
      connection,
      `IF COL_LENGTH('dbo.Users', 'FullName') IS NOT NULL
         BEGIN
           INSERT INTO Users (FullName, Username, PasswordHash, Phone, PhoneVerifiedAt, Email, Role, MustChangePassword)
           OUTPUT INSERTED.UserId
           VALUES (@FullName, @Username, @PasswordHash, @Phone, SYSUTCDATETIME(), @Email, 'Client', 0)
         END
       ELSE
         BEGIN
           INSERT INTO Users (Username, PasswordHash, Phone, PhoneVerifiedAt, Email, Role, MustChangePassword)
           OUTPUT INSERTED.UserId
           VALUES (@Username, @PasswordHash, @Phone, SYSUTCDATETIME(), @Email, 'Client', 0)
         END`,
      [
        { name: "FullName", type: TYPES.NVarChar, value: username },
        { name: "Username", type: TYPES.NVarChar, value: username },
        { name: "PasswordHash", type: TYPES.NVarChar, value: passwordHash },
        { name: "Phone", type: TYPES.NVarChar, value: phone },
        { name: "Email", type: TYPES.NVarChar, value: email }
      ]
    );
    const userId = inserted[0].UserId;

    await execSql(connection, `INSERT INTO AuthProviders (UserId, ProviderType, ProviderSubject) VALUES (@UserId, 'local', @Subject)`, [
      { name: "UserId", type: TYPES.Int, value: userId },
      { name: "Subject", type: TYPES.NVarChar, value: username }
    ]);

    return findById(userId);
  });

const findOrCreateGoogleUser = async ({ googleSubject, email }: { googleSubject: string; email: string | null }) => {
  const existing = await findByProvider("google", googleSubject);
  if (existing) {
    return existing;
  }

  const rows = await execute<{ UserId: number }>(
    `IF COL_LENGTH('dbo.Users', 'FullName') IS NOT NULL
       BEGIN
         INSERT INTO Users (FullName, Username, PasswordHash, Phone, PhoneVerifiedAt, Email, Role, MustChangePassword)
         OUTPUT INSERTED.UserId
         VALUES (@FullName, NULL, NULL, NULL, NULL, @Email, 'Client', 0)
       END
     ELSE
       BEGIN
         INSERT INTO Users (Username, PasswordHash, Phone, PhoneVerifiedAt, Email, Role, MustChangePassword)
         OUTPUT INSERTED.UserId
         VALUES (NULL, NULL, NULL, NULL, @Email, 'Client', 0)
       END`,
    [
      { name: "FullName", type: TYPES.NVarChar, value: email ?? `google_user_${Date.now()}` },
      { name: "Email", type: TYPES.NVarChar, value: email }
    ]
  );

  await execute(`INSERT INTO AuthProviders (UserId, ProviderType, ProviderSubject) VALUES (@UserId, 'google', @Subject)`, [
    { name: "UserId", type: TYPES.Int, value: rows[0].UserId },
    { name: "Subject", type: TYPES.NVarChar, value: googleSubject }
  ]);

  return findById(rows[0].UserId);
};

const setMustChangePassword = async (userId: number, mustChangePassword: boolean) => {
  await execute(`UPDATE Users SET MustChangePassword = @Flag, UpdatedAt = SYSUTCDATETIME() WHERE UserId = @UserId`, [
    { name: "Flag", type: TYPES.Bit, value: mustChangePassword },
    { name: "UserId", type: TYPES.Int, value: userId }
  ]);
};

const updatePassword = async (userId: number, passwordHash: string) => {
  await execute(`UPDATE Users SET PasswordHash = @PasswordHash, MustChangePassword = 0, UpdatedAt = SYSUTCDATETIME() WHERE UserId = @UserId`, [
    { name: "PasswordHash", type: TYPES.NVarChar, value: passwordHash },
    { name: "UserId", type: TYPES.Int, value: userId }
  ]);
};

const updatePhone = async (userId: number, phone: string) => {
  await execute(`UPDATE Users SET Phone = @Phone, PhoneVerifiedAt = SYSUTCDATETIME(), UpdatedAt = SYSUTCDATETIME() WHERE UserId = @UserId`, [
    { name: "Phone", type: TYPES.NVarChar, value: phone },
    { name: "UserId", type: TYPES.Int, value: userId }
  ]);
};

const addEvent = async (userId: number, type: string, metadataJson: string | null) => {
  await execute(`INSERT INTO AccountEvents (UserId, Type, MetadataJson) VALUES (@UserId, @Type, @MetadataJson)`, [
    { name: "UserId", type: TYPES.Int, value: userId },
    { name: "Type", type: TYPES.NVarChar, value: type },
    { name: "MetadataJson", type: TYPES.NVarChar, value: metadataJson }
  ]);
};

const linkGoogleProvider = async (userId: number, googleSubject: string) => {
  await execute(`INSERT INTO AuthProviders (UserId, ProviderType, ProviderSubject) VALUES (@UserId, 'google', @Subject)`, [
    { name: "UserId", type: TYPES.Int, value: userId },
    { name: "Subject", type: TYPES.NVarChar, value: googleSubject }
  ]);
  await addEvent(userId, "GOOGLE_LINKED", JSON.stringify({ googleSubject }));
};

export const userRepository = {
  findById,
  findByUsername,
  findByPhone,
  findByProvider,
  createLocalUser,
  findOrCreateGoogleUser,
  setMustChangePassword,
  updatePassword,
  updatePhone,
  addEvent,
  linkGoogleProvider
};
