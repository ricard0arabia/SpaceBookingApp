import { Router } from "express";
import passport from "../config/passport.js";
import { getMe, logout, otpLoginRequest, otpLoginVerify, otpSignupRequest, otpSignupVerify } from "../controllers/authController.js";
import { ensureCsrfToken, requireCsrf } from "../middleware/csrf.js";

export const authRoutes = Router();

authRoutes.get("/api/me", ensureCsrfToken, getMe);

authRoutes.post("/api/logout", requireCsrf, logout);

authRoutes.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

authRoutes.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (_req, res) => {
    res.redirect(process.env.OAUTH_SUCCESS_REDIRECT ?? "http://localhost:5173/");
  }
);

authRoutes.post("/auth/otp/signup/request", requireCsrf, otpSignupRequest);

authRoutes.post("/auth/otp/signup/verify", requireCsrf, otpSignupVerify);

authRoutes.post("/auth/otp/login/request", requireCsrf, otpLoginRequest);

authRoutes.post("/auth/otp/login/verify", requireCsrf, otpLoginVerify);
