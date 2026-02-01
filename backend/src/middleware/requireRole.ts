import type { Request, Response, NextFunction } from "express";
import type { User } from "../repositories/userRepository.js";

export const requireRole = (role: "Admin" | "Client") =>
  (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user as User | undefined;
    if (!user || user.Role !== role) {
      const error = new Error("Forbidden");
      (error as { status?: number }).status = 403;
      throw error;
    }
    next();
  };
