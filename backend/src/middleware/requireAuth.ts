import type { Request, Response, NextFunction } from "express";

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    const error = new Error("Unauthorized");
    (error as { status?: number }).status = 401;
    throw error;
  }
  next();
};
