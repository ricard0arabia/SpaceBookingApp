import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const status = (err as { status?: number }).status ?? 500;
  logger.error({ err }, "Request failed");
  res.status(status).json({
    error: err.message
  });
};
