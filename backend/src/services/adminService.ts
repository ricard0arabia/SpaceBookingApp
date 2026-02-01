import { bookingRepository } from "../repositories/bookingRepository.js";
import { blockRepository } from "../repositories/blockRepository.js";
import { toUtcJs, toManila } from "../utils/time.js";
import { validateOperatingHours, validateDuration } from "../utils/bookingRules.js";

export const approveBooking = async (bookingId: number) => {
  await bookingRepository.updateStatus(bookingId, "APPROVED_AWAITING_PAYMENT", null);
  await bookingRepository.updateSlotsStatus(bookingId, "APPROVED_AWAITING_PAYMENT");
};

export const denyBooking = async (bookingId: number) => {
  await bookingRepository.updateStatus(bookingId, "DENIED", null);
  await bookingRepository.releaseSlots(bookingId);
};

export const createBlock = async ({
  startAt,
  endAt,
  reason,
  adminId
}: {
  startAt: string;
  endAt: string;
  reason: string | null;
  adminId: number;
}) => {
  const start = toManila(startAt);
  const end = toManila(endAt);
  validateOperatingHours(start, end);
  validateDuration(start, end);
  return blockRepository.createBlock({
    startAt: toUtcJs(start),
    endAt: toUtcJs(end),
    reason,
    adminId
  });
};

export const listBlocks = () => blockRepository.listBlocks();

export const deleteBlock = (blockId: number) => blockRepository.deleteBlock(blockId);

export const editBookingTime = async ({
  bookingId,
  newStartAt,
  newEndAt,
  adminId,
  reason
}: {
  bookingId: number;
  newStartAt: string;
  newEndAt: string;
  adminId: number;
  reason: string | null;
}) => {
  const booking = await bookingRepository.getById(bookingId);
  if (!booking) {
    throw new Error("Booking not found");
  }
  if (booking.Status !== "CONFIRMED") {
    throw new Error("Only confirmed bookings can be edited");
  }
  const start = toManila(newStartAt);
  const end = toManila(newEndAt);
  validateOperatingHours(start, end);
  const newDuration = validateDuration(start, end);
  if (newDuration !== booking.DurationHours) {
    throw new Error("Duration changes are not allowed for admin edits");
  }
  const conflicts = await bookingRepository.listCalendarEvents(toUtcJs(start), toUtcJs(end));
  const blocks = await bookingRepository.listBlocks(toUtcJs(start), toUtcJs(end));
  const hasConflicts = conflicts.some((item) => item.BookingId !== bookingId);
  if (hasConflicts || blocks.length > 0) {
    throw new Error("Selected time conflicts with existing bookings or blocks");
  }
  await bookingRepository.updateBookingTimes({
    bookingId,
    newStartAt: toUtcJs(start),
    newEndAt: toUtcJs(end),
    slotStarts: Array.from({ length: newDuration }, (_, index) =>
      toUtcJs(start.plus({ hours: index }))
    ),
    actorUserId: adminId,
    actorRole: "Admin",
    reason
  });
  return { bookingId };
};
