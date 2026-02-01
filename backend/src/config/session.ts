import session from "express-session";
import RedisStore from "connect-redis";
import { redis } from "./redis.js";

export const sessionMiddleware = session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET ?? "dev-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: process.env.SAME_SITE ?? "lax",
    secure: process.env.NODE_ENV === "production"
  }
});
