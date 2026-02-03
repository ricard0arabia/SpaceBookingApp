import { Router } from "express";
import {
  cancelBookingHandler,
  createBookingHandler,
  getActiveBookingHandler,
  getBookingHandler,
  getHistoryHandler,
  payBookingHandler
} from "../controllers/bookingController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { idempotencyMiddleware } from "../middleware/idempotency.js";
import { bookingRateLimiter } from "../middleware/rateLimiters.js";

export const bookingRoutes = Router();

bookingRoutes.use(requireAuth);

bookingRoutes.post("/bookings", requireCsrf, bookingRateLimiter, idempotencyMiddleware, createBookingHandler);
bookingRoutes.post("/bookings/:id/pay", requireCsrf, idempotencyMiddleware, payBookingHandler);
bookingRoutes.post("/bookings/:id/cancel", requireCsrf, idempotencyMiddleware, cancelBookingHandler);
bookingRoutes.get("/bookings/active", getActiveBookingHandler);
bookingRoutes.get("/bookings/history", getHistoryHandler);
bookingRoutes.get("/bookings/:id", getBookingHandler);
