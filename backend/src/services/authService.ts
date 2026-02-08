import { firebaseAdmin, isFirebaseAdminReady } from "../config/firebaseAdmin.js";
import { userRepository } from "../repositories/userRepository.js";
import { hashPassword, needsRehash, verifyPassword } from "../utils/password.js";

const PHONE_FRESHNESS_SECONDS = Number(process.env.PHONE_OTP_FRESHNESS_SECONDS ?? 300);

const assertFirebaseReady = () => {
  if (!isFirebaseAdminReady()) {
    const error = new Error("Firebase Admin not configured");
    (error as { status?: number }).status = 503;
    throw error;
  }
};

const verifyPhoneToken = async (firebaseIdToken: string) => {
  assertFirebaseReady();
  const decoded = await firebaseAdmin.auth().verifyIdToken(firebaseIdToken, true);
  if (!decoded.phone_number) {
    const error = new Error("Phone verification required");
    (error as { status?: number }).status = 400;
    throw error;
  }

  const authTime = Number(decoded.auth_time ?? 0);
  const now = Math.floor(Date.now() / 1000);
  if (!authTime || now - authTime > PHONE_FRESHNESS_SECONDS) {
    const error = new Error("Phone verification is stale");
    (error as { status?: number }).status = 401;
    throw error;
  }

  return { phone: decoded.phone_number, decoded };
};

export const completeLocalSignup = async ({ username, password, firebaseIdToken }: { username: string; password: string; firebaseIdToken: string }) => {
  const existingUsername = await userRepository.findByUsername(username);
  if (existingUsername) {
    const error = new Error("Username unavailable");
    (error as { status?: number }).status = 409;
    throw error;
  }

  const { phone } = await verifyPhoneToken(firebaseIdToken);
  const existingPhone = await userRepository.findByPhone(phone);
  if (existingPhone) {
    const error = new Error("Phone is already in use");
    (error as { status?: number }).status = 409;
    throw error;
  }

  const passwordHash = await hashPassword(password);
  const user = await userRepository.createLocalUser({ username, passwordHash, phone, email: null });
  if (!user) {
    throw new Error("Could not create user");
  }
  return user;
};

export const loginLocal = async (username: string, password: string) => {
  const user = await userRepository.findByUsername(username);
  if (!user?.PasswordHash) {
    const error = new Error("Invalid credentials");
    (error as { status?: number }).status = 401;
    throw error;
  }

  const valid = await verifyPassword(password, user.PasswordHash);
  if (!valid) {
    const error = new Error("Invalid credentials");
    (error as { status?: number }).status = 401;
    throw error;
  }

  if (needsRehash(user.PasswordHash)) {
    const newHash = await hashPassword(password);
    await userRepository.updatePassword(user.UserId, newHash);
  }

  return (await userRepository.findById(user.UserId))!;
};

export const startRecovery = async (firebaseIdToken: string) => {
  const { phone } = await verifyPhoneToken(firebaseIdToken);
  const user = await userRepository.findByPhone(phone);
  if (!user) {
    return null;
  }
  await userRepository.setMustChangePassword(user.UserId, true);
  await userRepository.addEvent(user.UserId, "RECOVERY_STARTED", JSON.stringify({ phone }));
  return (await userRepository.findById(user.UserId))!;
};

export const completeRecovery = async (userId: number, newPassword: string) => {
  const user = await userRepository.findById(userId);
  if (!user || !user.MustChangePassword) {
    const error = new Error("Recovery session required");
    (error as { status?: number }).status = 403;
    throw error;
  }

  const passwordHash = await hashPassword(newPassword);
  await userRepository.updatePassword(user.UserId, passwordHash);
  await userRepository.addEvent(user.UserId, "RECOVERY_COMPLETED", null);

  return (await userRepository.findById(user.UserId))!;
};

export const changePassword = async (userId: number, currentPassword: string, newPassword: string) => {
  const user = await userRepository.findById(userId);
  if (!user?.PasswordHash) {
    const error = new Error("Password login is not enabled");
    (error as { status?: number }).status = 400;
    throw error;
  }

  const valid = await verifyPassword(currentPassword, user.PasswordHash);
  if (!valid) {
    const error = new Error("Current password is incorrect");
    (error as { status?: number }).status = 401;
    throw error;
  }

  const newHash = await hashPassword(newPassword);
  await userRepository.updatePassword(userId, newHash);
  await userRepository.addEvent(userId, "PASSWORD_CHANGED", null);
};

export const changePhone = async (userId: number, currentPassword: string, firebaseIdToken: string) => {
  const user = await userRepository.findById(userId);
  if (!user?.PasswordHash) {
    const error = new Error("Password verification unavailable");
    (error as { status?: number }).status = 400;
    throw error;
  }

  const valid = await verifyPassword(currentPassword, user.PasswordHash);
  if (!valid) {
    const error = new Error("Current password is incorrect");
    (error as { status?: number }).status = 401;
    throw error;
  }

  const { phone } = await verifyPhoneToken(firebaseIdToken);
  const existingPhone = await userRepository.findByPhone(phone);
  if (existingPhone && existingPhone.UserId !== userId) {
    const error = new Error("Phone is already in use");
    (error as { status?: number }).status = 409;
    throw error;
  }

  await userRepository.updatePhone(userId, phone);
  await userRepository.addEvent(userId, "PHONE_CHANGED", JSON.stringify({ phone }));
};
