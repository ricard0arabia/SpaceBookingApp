import { Worker } from "bullmq";
import { createRedisConnection } from "../config/redis.js";
import { logger } from "../utils/logger.js";
import { processWebhookJob } from "../services/webhookProcessor.js";
import { expireHolds, completeBookings, cleanupStale } from "../services/maintenanceService.js";

const connection = createRedisConnection("bullmq-worker");

if (!connection) {
  logger.warn("BullMQ worker disabled; Redis not configured.");
  process.exit(0);
}

const withLogging = async <T>(name: string, handler: () => Promise<T>, requestId?: string) => {
  logger.info({ job: name, requestId }, "Job started");
  const result = await handler();
  logger.info({ job: name, requestId }, "Job completed");
  return result;
};

new Worker(
  "webhooks",
  async (job) => withLogging("webhooks", () => processWebhookJob(job.data), job.data.requestId),
  {
    connection,
    concurrency: 5
  }
);

new Worker(
  "expiry",
  async (job) => withLogging("expiry", () => expireHolds(job.data.requestId), job.data.requestId),
  {
    connection,
    concurrency: 2
  }
);

new Worker(
  "reconciliation",
  async (job) =>
    withLogging("reconciliation", () => completeBookings(job.data.requestId), job.data.requestId),
  {
    connection,
    concurrency: 2
  }
);

new Worker(
  "cleanup",
  async (job) => withLogging("cleanup", () => cleanupStale(job.data.requestId), job.data.requestId),
  {
    connection,
    concurrency: 1
  }
);
