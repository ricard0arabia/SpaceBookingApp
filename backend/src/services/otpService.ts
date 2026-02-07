import { redis } from "../config/redis.js";

const OTP_TTL_SECONDS = 300;
const OTP_COOLDOWN_SECONDS = 30;
const OTP_MAX_ATTEMPTS = 5;

const otpKey = (phone: string) => `otp:${phone}`;
const cooldownKey = (phone: string) => `otp:cooldown:${phone}`;

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const requestOtp = async (phone: string) => {
  const cooldown = await redis.get(cooldownKey(phone));
  if (cooldown) {
    throw new Error("OTP cooldown active. Please wait.");
  }
  const otp = generateOtp();
  await redis.set(
    otpKey(phone),
    JSON.stringify({ otp, attempts: 0 }),
    "EX",
    OTP_TTL_SECONDS
  );
  await redis.set(cooldownKey(phone), "1", "EX", OTP_COOLDOWN_SECONDS);
  return otp;
};

export const verifyOtp = async (phone: string, otp: string) => {
  const value = await redis.get(otpKey(phone));
  if (!value) {
    throw new Error("OTP expired or not found.");
  }
  const data = JSON.parse(value) as { otp: string; attempts: number };
  if (data.attempts >= OTP_MAX_ATTEMPTS) {
    throw new Error("Too many attempts. Please request a new OTP.");
  }
  if (data.otp !== otp) {
    data.attempts += 1;
    await redis.set(otpKey(phone), JSON.stringify(data), "EX", OTP_TTL_SECONDS);
    throw new Error("Invalid OTP.");
  }
  await redis.del(otpKey(phone));
  return true;
};
