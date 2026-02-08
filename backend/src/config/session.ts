import session from "express-session";
import RedisStore from "connect-redis";
import { redis } from "./redis.js";
import { logger } from "../utils/logger.js";

const redisReady = Boolean(redis && redis.status === "ready");

export const sessionMiddleware = session({
  store: redisReady
    ? new RedisStore({
        client: redis,
        prefix: process.env.REDIS_SESSION_PREFIX ?? "sess:"
      })
    : new session.MemoryStore(),
  secret: process.env.SESSION_SECRET ?? "dev-secret",
  name: process.env.SESSION_COOKIE_NAME ?? "space.sid",
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: (process.env.SAME_SITE as "lax" | "strict" | "none" | undefined) ?? "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: Number(process.env.SESSION_TTL_MS ?? 86_400_000)
  }
});

if (!redis) {
  logger.warn("Redis not configured. Using in-memory session store.");
} else if (!redisReady) {
  logger.warn({ status: redis.status }, "Redis not ready. Using in-memory session store.");
}
