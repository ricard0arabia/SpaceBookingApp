import { httpClient } from "./httpClient";

export type User = {
  UserId: number;
  Username: string | null;
  Phone: string | null;
  Email: string | null;
  Role: "Client" | "Admin";
  MustChangePassword: boolean;
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
  async localLogin(username: string, password: string) {
    const { data } = await httpClient.post("/auth/local/login", { username, password });
    return data.user as User;
  },
  async localSignupComplete(payload: { username: string; password: string; firebaseIdToken: string }) {
    const { data } = await httpClient.post("/auth/local/signup/complete", payload);
    return data.user as User;
  },
  async recoveryStart(firebaseIdToken: string) {
    const { data } = await httpClient.post("/auth/local/recovery/start", { firebaseIdToken });
    return data as { ok: boolean; message: string };
  },
  async recoveryComplete(newPassword: string) {
    const { data } = await httpClient.post("/auth/local/recovery/complete", { newPassword });
    return data.user as User;
  },
  async changePassword(currentPassword: string, newPassword: string) {
    await httpClient.post("/api/settings/password/change", { currentPassword, newPassword });
  },
  async changePhone(currentPassword: string, firebaseIdToken: string) {
    const { data } = await httpClient.post("/api/settings/phone/change", { currentPassword, firebaseIdToken });
    return data.user as User;
  }
};
