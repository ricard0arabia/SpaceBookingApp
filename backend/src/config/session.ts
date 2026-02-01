import session from "express-session";
import RedisStore from "connect-redis";
import { redis } from "./redis.js";
import { logger } from "../utils/logger.js";

export const sessionMiddleware = session({
  store: redis ? new RedisStore({ client: redis }) : new session.MemoryStore(),
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
}
