import Redis from "ioredis";
import { logger } from "../utils/logger.js";

const redisUrl = process.env.REDIS_URL;

export const createRedisConnection = (label: string) => {
  if (!redisUrl) {
    return null;
  }
  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    retryStrategy: () => null
  });
  connection.on("error", (error) => {
    logger.warn({ error, label }, "Redis connection error");
  });
  connection.connect().catch((error) => {
    logger.warn({ error, label }, "Redis initial connection failed");
  });
  return connection;
};

export const redis = createRedisConnection("app");
