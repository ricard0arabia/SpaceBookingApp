import { Router } from "express";
import {
  approveBookingHandler,
  createBlockHandler,
  deleteBlockHandler,
  denyBookingHandler,
  editBookingHandler,
  listBlocksHandler,
  listBookings
} from "../controllers/adminController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { requireCsrf } from "../middleware/csrf.js";
import { idempotencyMiddleware } from "../middleware/idempotency.js";

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireRole("Admin"));

adminRoutes.get("/admin/bookings", listBookings);
adminRoutes.post("/admin/bookings/:id/approve", requireCsrf, idempotencyMiddleware, approveBookingHandler);
adminRoutes.post("/admin/bookings/:id/deny", requireCsrf, idempotencyMiddleware, denyBookingHandler);
adminRoutes.post("/admin/bookings/:id/edit", requireCsrf, idempotencyMiddleware, editBookingHandler);
adminRoutes.get("/admin/blocks", listBlocksHandler);
adminRoutes.post("/admin/blocks", requireCsrf, createBlockHandler);
adminRoutes.delete("/admin/blocks/:id", requireCsrf, deleteBlockHandler);
