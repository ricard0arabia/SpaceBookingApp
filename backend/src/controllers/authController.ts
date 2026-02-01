import type { Request, Response } from "express";
import { requestLoginOtp, requestSignupOtp, verifyLoginOtp, verifySignupOtp } from "../services/authService.js";

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

export const otpSignupRequest = async (req: Request, res: Response) => {
  const { fullName, phone } = req.body as { fullName: string; phone: string };
  const result = await requestSignupOtp(fullName, phone);
  res.json({ sent: true, debugOtp: result.otp });
};

export const otpSignupVerify = async (req: Request, res: Response) => {
  const { fullName, phone, otp } = req.body as { fullName: string; phone: string; otp: string };
  const user = await verifySignupOtp(fullName, phone, otp);
  req.login(user, (err) => {
    if (err) {
      throw err;
    }
    res.json({ user });
  });
};

export const otpLoginRequest = async (req: Request, res: Response) => {
  const { phone } = req.body as { phone: string };
  const result = await requestLoginOtp(phone);
  res.json({ sent: true, debugOtp: result.otp });
};

export const otpLoginVerify = async (req: Request, res: Response) => {
  const { phone, otp } = req.body as { phone: string; otp: string };
  const user = await verifyLoginOtp(phone, otp);
  req.login(user, (err) => {
    if (err) {
      throw err;
    }
    res.json({ user });
  });
};
