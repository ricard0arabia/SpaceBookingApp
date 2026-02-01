import { TYPES } from "tedious";
import { execute } from "./db.js";

export type User = {
  UserId: number;
  FullName: string;
  Email: string | null;
  Phone: string | null;
  Role: "Client" | "Admin";
};

const toUser = (row?: User | null) => (row ? row : null);

const findById = async (userId: number) => {
  const rows = await execute<User>(
    "SELECT UserId, FullName, Email, Phone, Role FROM Users WHERE UserId = @UserId",
    [{ name: "UserId", type: TYPES.Int, value: userId }]
  );
  return toUser(rows[0]);
};

const findByPhone = async (phone: string) => {
  const rows = await execute<User>(
    "SELECT UserId, FullName, Email, Phone, Role FROM Users WHERE Phone = @Phone",
    [{ name: "Phone", type: TYPES.NVarChar, value: phone }]
  );
  return toUser(rows[0]);
};

const findOrCreateGoogleUser = async ({
  googleId,
  email,
  name
}: {
  googleId: string;
  email: string | null;
  name: string;
}) => {
  const existing = await execute<User>(
    `SELECT U.UserId, U.FullName, U.Email, U.Phone, U.Role
     FROM AuthProviders A
     JOIN Users U ON U.UserId = A.UserId
     WHERE A.ProviderType = 'google' AND A.ProviderSubject = @GoogleId`,
    [{ name: "GoogleId", type: TYPES.NVarChar, value: googleId }]
  );
  if (existing[0]) {
    return existing[0];
  }

  const rows = await execute<{ UserId: number }>(
    `INSERT INTO Users (FullName, Email, Role)
     OUTPUT INSERTED.UserId
     VALUES (@FullName, @Email, 'Client')`,
    [
      { name: "FullName", type: TYPES.NVarChar, value: name },
      { name: "Email", type: TYPES.NVarChar, value: email }
    ]
  );
  const userId = rows[0].UserId;
  await execute(
    `INSERT INTO AuthProviders (UserId, ProviderType, ProviderSubject)
     VALUES (@UserId, 'google', @GoogleId)`,
    [
      { name: "UserId", type: TYPES.Int, value: userId },
      { name: "GoogleId", type: TYPES.NVarChar, value: googleId }
    ]
  );
  return findById(userId);
};

const createPhoneUser = async (fullName: string, phone: string) => {
  const rows = await execute<{ UserId: number }>(
    `INSERT INTO Users (FullName, Phone, Role)
     OUTPUT INSERTED.UserId
     VALUES (@FullName, @Phone, 'Client')`,
    [
      { name: "FullName", type: TYPES.NVarChar, value: fullName },
      { name: "Phone", type: TYPES.NVarChar, value: phone }
    ]
  );
  const userId = rows[0].UserId;
  await execute(
    `INSERT INTO AuthProviders (UserId, ProviderType, ProviderSubject)
     VALUES (@UserId, 'phone', @Phone)`,
    [
      { name: "UserId", type: TYPES.Int, value: userId },
      { name: "Phone", type: TYPES.NVarChar, value: phone }
    ]
  );
  return findById(userId);
};

export const userRepository = {
  findById,
  findByPhone,
  findOrCreateGoogleUser,
  createPhoneUser
};
