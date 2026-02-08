import type { Request, Response, NextFunction } from "express";
import { firebaseAdmin, isFirebaseAdminReady } from "../config/firebaseAdmin.js";

const APP_CHECK_HEADER = "x-firebase-appcheck";

export const requireAppCheck = async (req: Request, _res: Response, next: NextFunction) => {
  if (!isFirebaseAdminReady()) {
    const error = new Error("App Check is not available");
    (error as { status?: number }).status = 503;
    throw error;
  }

  const token = req.header(APP_CHECK_HEADER);
  if (!token) {
    const error = new Error("Missing App Check token");
    (error as { status?: number }).status = 401;
    throw error;
  }

  await firebaseAdmin.appCheck().verifyToken(token);
  next();
};
