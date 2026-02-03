import { Router, raw } from "express";
import { paymongoWebhook } from "../controllers/webhookController.js";
import rateLimit from "express-rate-limit";

export const webhookRoutes = Router();

const webhookLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});

webhookRoutes.post(
  "/webhooks/paymongo",
  webhookLimiter,
  raw({ type: "application/json" }),
  paymongoWebhook
);
