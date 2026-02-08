import { redis } from "../config/redis.js";
import { logger } from "./logger.js";

const memoryCache = new Map<string, string>();

export const idempotencyKey = (key: string) => `idempotency:${key}`;

export const getCachedResponse = async (key: string) => {
  if (redis) {
    const value = await redis.get(idempotencyKey(key));
    return value ? JSON.parse(value) : null;
  }
  return memoryCache.has(key) ? JSON.parse(memoryCache.get(key) as string) : null;
};

export const setCachedResponse = async (key: string, payload: unknown, ttlSeconds: number) => {
  const serialized = JSON.stringify(payload);
  if (redis) {
    await redis.set(idempotencyKey(key), serialized, "EX", ttlSeconds);
  } else {
    memoryCache.set(key, serialized);
    setTimeout(() => memoryCache.delete(key), ttlSeconds * 1000).unref();
    logger.warn("Idempotency cache in-memory. Configure REDIS_URL for durability.");
  }
};
