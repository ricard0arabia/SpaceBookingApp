import session from "express-session";
import RedisStore from "connect-redis";
import { redis } from "./redis.js";
import { logger } from "../utils/logger.js";

const redisReady = Boolean(redis && redis.status === "ready");

export const sessionMiddleware = session({
  store: redisReady ? new RedisStore({ client: redis }) : new session.MemoryStore(),
  secret: process.env.SESSION_SECRET ?? "dev-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: process.env.SAME_SITE ?? "lax",
    secure: process.env.NODE_ENV === "production"
  }
});

if (!redis) {
  logger.warn("Redis not configured. Using in-memory session store.");
} else if (!redisReady) {
  logger.warn({ status: redis.status }, "Redis not ready. Using in-memory session store.");
}
