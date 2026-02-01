import { userRepository } from "../repositories/userRepository.js";
import { requestOtp, verifyOtp } from "./otpService.js";

export const requestSignupOtp = async (fullName: string, phone: string) => {
  const existing = await userRepository.findByPhone(phone);
  if (existing) {
    throw new Error("Phone already registered");
  }
  const otp = await requestOtp(phone);
  return { otp, fullName, phone };
};

export const verifySignupOtp = async (fullName: string, phone: string, otp: string) => {
  await verifyOtp(phone, otp);
  const user = await userRepository.createPhoneUser(fullName, phone);
  return user;
};

export const requestLoginOtp = async (phone: string) => {
  const existing = await userRepository.findByPhone(phone);
  if (!existing) {
    throw new Error("Phone not registered");
  }
  const otp = await requestOtp(phone);
  return { otp };
};

export const verifyLoginOtp = async (phone: string, otp: string) => {
  await verifyOtp(phone, otp);
  const user = await userRepository.findByPhone(phone);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};
