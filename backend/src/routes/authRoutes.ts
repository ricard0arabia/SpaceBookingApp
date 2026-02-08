import { Router } from "express";
import {
  beginGoogleAuth,
  getMe,
  googleCallback,
  localLogin,
  localRecoveryComplete,
  localRecoveryStart,
  localSignupComplete,
  logout,
  settingsPasswordChange,
  settingsPhoneChange
} from "../controllers/authController.js";
import { requireAppCheck } from "../middleware/appCheck.js";
import { ensureCsrfToken, requireCsrf } from "../middleware/csrf.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  localLoginRateLimiter,
  recoveryRateLimiter,
  settingsRateLimiter,
  signupRateLimiter
} from "../middleware/rateLimiters.js";

export const authRoutes = Router();

authRoutes.get("/api/me", ensureCsrfToken, getMe);
authRoutes.post("/api/logout", requireCsrf, logout);

authRoutes.get("/auth/google", beginGoogleAuth);
authRoutes.get("/auth/google/callback", googleCallback);

authRoutes.post("/auth/local/login", requireCsrf, localLoginRateLimiter, localLogin);
authRoutes.post("/auth/local/signup/complete", requireCsrf, signupRateLimiter, requireAppCheck, localSignupComplete);

authRoutes.post("/auth/local/recovery/start", requireCsrf, recoveryRateLimiter, requireAppCheck, localRecoveryStart);
authRoutes.post("/auth/local/recovery/complete", requireCsrf, requireAuth, recoveryRateLimiter, localRecoveryComplete);

authRoutes.post("/api/settings/password/change", requireCsrf, requireAuth, settingsRateLimiter, settingsPasswordChange);
authRoutes.post("/api/settings/phone/change", requireCsrf, requireAuth, settingsRateLimiter, requireAppCheck, settingsPhoneChange);
