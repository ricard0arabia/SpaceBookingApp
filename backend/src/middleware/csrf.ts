import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

const CSRF_HEADER = "x-csrf-token";

export const ensureCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString("hex");
  }
  res.setHeader("X-CSRF-Token", req.session.csrfToken);
  next();
};

export const requireCsrf = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.headers[CSRF_HEADER] as string | undefined;
  if (!token || token !== req.session.csrfToken) {
    const error = new Error("Invalid CSRF token");
    (error as { status?: number }).status = 403;
    throw error;
  }
  next();
};
