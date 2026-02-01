import { httpClient } from "./httpClient";

export type User = {
  UserId: number;
  FullName: string;
  Email?: string | null;
  Phone?: string | null;
  Role: "Client" | "Admin";
};

export const AuthRepository = {
  async getMe() {
    const { data } = await httpClient.get<{ user: User | null }>("/api/me");
    return data.user;
  },
  async logout() {
    await httpClient.post("/api/logout");
  },
  startGoogleOAuth() {
    window.location.href = `${import.meta.env.VITE_API_URL ?? "http://localhost:4000"}/auth/google`;
  },
  async otpSignupRequest(fullName: string, phone: string) {
    const { data } = await httpClient.post("/auth/otp/signup/request", { fullName, phone });
    return data;
  },
  async otpSignupVerify(fullName: string, phone: string, otp: string) {
    const { data } = await httpClient.post("/auth/otp/signup/verify", { fullName, phone, otp });
    return data.user as User;
  },
  async otpLoginRequest(phone: string) {
    const { data } = await httpClient.post("/auth/otp/login/request", { phone });
    return data;
  },
  async otpLoginVerify(phone: string, otp: string) {
    const { data } = await httpClient.post("/auth/otp/login/verify", { phone, otp });
    return data.user as User;
  }
};
