import { redis } from "../config/redis.js";
import crypto from "crypto";

const unlockScript = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0
`;

export const acquireLock = async (key: string, ttlSeconds: number) => {
  if (!redis) return { ok: true, token: null };
  const token = crypto.randomUUID();
  const result = await redis.set(key, token, "NX", "EX", ttlSeconds);
  return { ok: result === "OK", token };
};

export const releaseLock = async (key: string, token: string | null) => {
  if (!redis || !token) return;
  await redis.eval(unlockScript, 1, key, token);
};
