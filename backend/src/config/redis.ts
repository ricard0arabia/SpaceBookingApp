import Redis from "ioredis";
import { logger } from "../utils/logger.js";

const redisUrl = process.env.REDIS_URL;

export const redis = redisUrl
  ? new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      retryStrategy: () => null
    })
  : null;

if (redis) {
  redis.on("error", (error) => {
    logger.warn({ error }, "Redis connection error");
  });
  redis.connect().catch((error) => {
    logger.warn({ error }, "Redis initial connection failed");
  });
}
