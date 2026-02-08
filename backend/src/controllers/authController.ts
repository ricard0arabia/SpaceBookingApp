import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import passport from "passport";
import { z } from "zod";
import {
  changePassword,
  changePhone,
  completeLocalSignup,
  completeRecovery,
  loginLocal,
  startRecovery
} from "../services/authService.js";
import { userRepository } from "../repositories/userRepository.js";

const loginSchema = z.object({ username: z.string().min(3).max(64), password: z.string().min(8).max(128) });
const signupSchema = z.object({ username: z.string().min(3).max(64), password: z.string().min(8).max(128), firebaseIdToken: z.string().min(10) });
const recoveryStartSchema = z.object({ firebaseIdToken: z.string().min(10) });
const recoveryCompleteSchema = z.object({ newPassword: z.string().min(8).max(128) });
const changePasswordSchema = z.object({ currentPassword: z.string().min(8).max(128), newPassword: z.string().min(8).max(128) });
const changePhoneSchema = z.object({ currentPassword: z.string().min(8).max(128), firebaseIdToken: z.string().min(10) });

export const getMe = (req: Request, res: Response) => {
  res.json({ user: req.user ?? null });
};

export const logout = (req: Request, res: Response) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ ok: true });
    });
  });
};

export const localLogin = async (req: Request, res: Response) => {
  const payload = loginSchema.parse(req.body);
  const user = await loginLocal(payload.username, payload.password);
  req.login(user, (error) => {
    if (error) throw error;
    res.json({ user });
  });
};

export const localSignupComplete = async (req: Request, res: Response) => {
  const payload = signupSchema.parse(req.body);
  const user = await completeLocalSignup(payload);
  req.login(user, (error) => {
    if (error) throw error;
    res.status(201).json({ user });
  });
};

export const localRecoveryStart = async (req: Request, res: Response) => {
  const payload = recoveryStartSchema.parse(req.body);
  const user = await startRecovery(payload.firebaseIdToken);

  if (user) {
    req.login(user, (error) => {
      if (error) throw error;
      res.json({ ok: true, message: "If an account exists, recovery has started." });
    });
    return;
  }

  res.json({ ok: true, message: "If an account exists, recovery has started." });
};

export const localRecoveryComplete = async (req: Request, res: Response) => {
  const payload = recoveryCompleteSchema.parse(req.body);
  const userId = (req.user as { UserId: number } | undefined)?.UserId;
  if (!userId) {
    const error = new Error("Unauthorized");
    (error as { status?: number }).status = 401;
    throw error;
  }

  const user = await completeRecovery(userId, payload.newPassword);
  req.login(user, (error) => {
    if (error) throw error;
    res.json({ ok: true, user });
  });
};

export const settingsPasswordChange = async (req: Request, res: Response) => {
  const payload = changePasswordSchema.parse(req.body);
  const userId = (req.user as { UserId: number } | undefined)?.UserId;
  if (!userId) {
    const error = new Error("Unauthorized");
    (error as { status?: number }).status = 401;
    throw error;
  }

  await changePassword(userId, payload.currentPassword, payload.newPassword);
  res.json({ ok: true });
};

export const settingsPhoneChange = async (req: Request, res: Response) => {
  const payload = changePhoneSchema.parse(req.body);
  const userId = (req.user as { UserId: number } | undefined)?.UserId;
  if (!userId) {
    const error = new Error("Unauthorized");
    (error as { status?: number }).status = 401;
    throw error;
  }

  await changePhone(userId, payload.currentPassword, payload.firebaseIdToken);
  const user = await userRepository.findById(userId);
  req.login(user!, (error) => {
    if (error) throw error;
    res.json({ ok: true, user });
  });
};

export const beginGoogleAuth = (req: Request, res: Response, next: NextFunction) => {
  req.session.oauthState = crypto.randomBytes(24).toString("hex");
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: req.session.oauthState
  })(req, res, next);
};

export const googleCallback = (req: Request, res: Response, next: NextFunction) => {
  const state = req.query.state?.toString();
  if (!state || state !== req.session.oauthState) {
    const error = new Error("Invalid OAuth state");
    (error as { status?: number }).status = 403;
    next(error as never);
    return;
  }

  passport.authenticate("google", { failureRedirect: "/login" })(req, res, () => {
    req.session.oauthState = undefined;
    const target = new URL(process.env.OAUTH_SUCCESS_REDIRECT ?? "http://localhost:5173/");
    target.searchParams.set("oauth", "1");
    res.redirect(target.toString());
  });
};
