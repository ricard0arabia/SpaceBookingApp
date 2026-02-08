import { Router } from "express";

export const metricsRoutes = Router();

metricsRoutes.get("/metrics", (_req, res) => {
  res.json({ note: "Use logs for counters or wire OpenTelemetry if needed." });
});
