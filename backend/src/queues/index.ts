import { Queue, QueueScheduler } from "bullmq";
import { createRedisConnection } from "../config/redis.js";
import { logger } from "../utils/logger.js";

export type WebhookJob = { rawBody: string; signature: string | undefined; requestId?: string };
export type ExpiryJob = { requestId?: string };
export type ReconciliationJob = { requestId?: string };
export type CleanupJob = { requestId?: string };
export type NotificationJob = { requestId?: string; type: string; payload?: Record<string, unknown> };

const connection = createRedisConnection("bullmq");

const createQueue = (name: string) => {
  if (!connection) {
    logger.warn({ name }, "BullMQ disabled; Redis not configured.");
    return null;
  }
  return new Queue(name, { connection });
};

export const queues = {
  webhooks: createQueue("webhooks"),
  expiry: createQueue("expiry"),
  notifications: createQueue("notifications"),
  reconciliation: createQueue("reconciliation"),
  cleanup: createQueue("cleanup")
};

export const schedulers = connection
  ? [
      new QueueScheduler("webhooks", { connection }),
      new QueueScheduler("expiry", { connection }),
      new QueueScheduler("notifications", { connection }),
      new QueueScheduler("reconciliation", { connection }),
      new QueueScheduler("cleanup", { connection })
    ]
  : [];

export const registerRepeatableJobs = async () => {
  if (!queues.expiry || !queues.reconciliation || !queues.cleanup) {
    return;
  }
  await queues.expiry.add(
    "expire-holds",
    {},
    { repeat: { every: 60_000 }, removeOnComplete: true }
  );
  await queues.reconciliation.add(
    "complete-bookings",
    {},
    { repeat: { every: 300_000 }, removeOnComplete: true }
  );
  await queues.cleanup.add(
    "cleanup-stale",
    {},
    { repeat: { every: 900_000 }, removeOnComplete: true }
  );
};
