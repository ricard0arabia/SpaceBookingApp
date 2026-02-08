import { Router } from "express";
import { redis } from "../config/redis.js";
import { execute } from "../repositories/db.js";

export const healthRoutes = Router();

healthRoutes.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

healthRoutes.get("/ready", async (_req, res) => {
  const readiness = { db: false, redis: false };
  try {
    await execute("SELECT 1");
    readiness.db = true;
  } catch {
    readiness.db = false;
  }

  try {
    if (redis) {
      await redis.ping();
      readiness.redis = true;
    }
  } catch {
    readiness.redis = false;
  }

  const ready = readiness.db;
  res.status(ready ? 200 : 503).json({ ready, ...readiness });
});
