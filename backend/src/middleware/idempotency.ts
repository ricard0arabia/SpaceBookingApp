import type { Request, Response, NextFunction } from "express";
import { getCachedResponse, setCachedResponse } from "../utils/idempotency.js";

const TTL_SECONDS = 60 * 5;

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const key = req.header("Idempotency-Key");
  if (!key) {
    next();
    return;
  }

  const cached = await getCachedResponse(key);
  if (cached) {
    res.setHeader("Idempotency-Cache", "HIT");
    res.status(cached.status).json(cached.body);
    return;
  }

  const originalJson = res.json.bind(res);
  res.json = (body: unknown) => {
    void setCachedResponse(key, { status: res.statusCode, body }, TTL_SECONDS);
    return originalJson(body);
  };
  next();
};
