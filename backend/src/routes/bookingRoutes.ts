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

export const bookingRoutes = Router();

bookingRoutes.use(requireAuth);

bookingRoutes.post("/bookings", requireCsrf, createBookingHandler);
bookingRoutes.post("/bookings/:id/pay", requireCsrf, payBookingHandler);
bookingRoutes.post("/bookings/:id/cancel", requireCsrf, cancelBookingHandler);
bookingRoutes.get("/bookings/active", getActiveBookingHandler);
bookingRoutes.get("/bookings/history", getHistoryHandler);
bookingRoutes.get("/bookings/:id", getBookingHandler);
