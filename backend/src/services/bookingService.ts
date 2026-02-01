import { DateTime } from "luxon";
import { bookingRepository } from "../repositories/bookingRepository.js";
import { createCheckoutSession } from "./paymentService.js";
import {
  getSegment,
  needsApproval as needsApprovalRule,
  validateDuration,
  validateLeadTime,
  validateOperatingHours
} from "../utils/bookingRules.js";
import { TIME_ZONE, toManila, toUtcJs } from "../utils/time.js";

const HOLD_MINUTES = 15;
const PRICE_PER_HOUR = Number(process.env.PRICE_PER_HOUR ?? 500);

const buildSlots = (start: DateTime, end: DateTime) => {
  const slots: Date[] = [];
  let cursor = start;
  while (cursor < end) {
    slots.push(toUtcJs(cursor));
    cursor = cursor.plus({ hours: 1 });
  }
  return slots;
};

export const createBooking = async ({
  userId,
  startAt,
  endAt,
  successUrl,
  cancelUrl
}: {
  userId: number;
  startAt: string;
  endAt: string;
  successUrl: string;
  cancelUrl: string;
}) => {
  const active = await bookingRepository.getActiveByUser(userId);
  if (active) {
    throw new Error("User already has an active booking");
  }

  const start = toManila(startAt);
  const end = toManila(endAt);
  validateOperatingHours(start, end);
  validateLeadTime(start);
  const durationHours = validateDuration(start, end);
  const needsApproval = needsApprovalRule(durationHours, start, end);

  const conflicts = await bookingRepository.listCalendarEvents(toUtcJs(start), toUtcJs(end));
  const blocks = await bookingRepository.listBlocks(toUtcJs(start), toUtcJs(end));
  if (conflicts.length > 0 || blocks.length > 0) {
    throw new Error("Selected time conflicts with existing bookings or blocks");
  }

  const holdExpiresAt = DateTime.now().setZone(TIME_ZONE).plus({ minutes: HOLD_MINUTES });
  const status = needsApproval ? "PENDING_APPROVAL" : "HELD";

  const bookingId = await bookingRepository.createBooking({
    userId,
    startAt: toUtcJs(start),
    endAt: toUtcJs(end),
    durationHours,
    status,
    holdExpiresAt: needsApproval ? null : toUtcJs(holdExpiresAt),
    needsApproval,
    slotStarts: buildSlots(start, end)
  });

  if (needsApproval) {
    return { bookingId, status, needsApproval, segment: getSegment(start, end) };
  }

  const amount = durationHours * PRICE_PER_HOUR * 100;
  const checkoutUrl = await createCheckoutSession({
    bookingId,
    amount,
    successUrl,
    cancelUrl
  });
  await bookingRepository.updateStatus(bookingId, "PENDING_PAYMENT", toUtcJs(holdExpiresAt));
  await bookingRepository.updateSlotsStatus(bookingId, "PENDING_PAYMENT");

  return { bookingId, status: "PENDING_PAYMENT", checkoutUrl, needsApproval: false };
};

export const payApprovedBooking = async ({
  bookingId,
  successUrl,
  cancelUrl
}: {
  bookingId: number;
  successUrl: string;
  cancelUrl: string;
}) => {
  const booking = await bookingRepository.getById(bookingId);
  if (!booking || booking.Status !== "APPROVED_AWAITING_PAYMENT") {
    throw new Error("Booking not approved for payment");
  }
  const durationHours = booking.DurationHours;
  const amount = durationHours * PRICE_PER_HOUR * 100;
  const holdExpiresAt = DateTime.now().setZone(TIME_ZONE).plus({ minutes: HOLD_MINUTES });
  const checkoutUrl = await createCheckoutSession({
    bookingId,
    amount,
    successUrl,
    cancelUrl
  });
  await bookingRepository.updateStatus(bookingId, "PENDING_PAYMENT", toUtcJs(holdExpiresAt));
  await bookingRepository.updateSlotsStatus(bookingId, "PENDING_PAYMENT");
  return checkoutUrl;
};

export const cancelBooking = async (bookingId: number, userId: number) => {
  const booking = await bookingRepository.getById(bookingId);
  if (!booking || booking.UserId !== userId) {
    throw new Error("Booking not found");
  }
  if (booking.Status === "CONFIRMED") {
    const start = toManila(booking.StartAt);
    const diffHours = start.diff(DateTime.now().setZone(TIME_ZONE), "hours").hours;
    if (diffHours <= 24) {
      throw new Error("Cancellation not allowed within 24 hours");
    }
  }
  await bookingRepository.updateStatus(bookingId, "CANCELLED", null);
  await bookingRepository.releaseSlots(bookingId);
  return true;
};
