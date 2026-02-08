import type { Request, Response } from "express";
import { verifyWebhookSignature } from "../services/paymentService.js";
import { queues } from "../queues/index.js";

export const paymongoWebhook = async (req: Request, res: Response) => {
  const rawBody = req.body as string;
  const signature = req.headers["paymongo-signature"] as string | undefined;
  verifyWebhookSignature(rawBody, signature);
  if (!queues.webhooks) {
    res.status(503).json({ error: "Webhook queue unavailable" });
    return;
  }
  await queues.webhooks.add(
    "paymongo",
    { rawBody, signature, requestId: req.id },
    { attempts: 5, backoff: { type: "exponential", delay: 1000 }, removeOnComplete: true }
  );
  res.json({ ok: true });
};
