import { Router, raw } from "express";
import { paymongoWebhook } from "../controllers/webhookController.js";

export const webhookRoutes = Router();

webhookRoutes.post("/webhooks/paymongo", raw({ type: "application/json" }), paymongoWebhook);
