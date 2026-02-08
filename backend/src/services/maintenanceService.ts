import { bookingRepository } from "../repositories/bookingRepository.js";
import { emitBookingEvent } from "../socket/emitter.js";

export const expireHolds = async (_requestId?: string) => {
  const expired = await bookingRepository.expireHolds();
  expired.forEach((bookingId) => emitBookingEvent("booking:expired", { bookingId }));
};

export const completeBookings = async (_requestId?: string) => {
  const completed = await bookingRepository.completeBookings();
  completed.forEach((bookingId) => emitBookingEvent("booking:updated", { bookingId, status: "COMPLETED" }));
};

export const cleanupStale = async (_requestId?: string) => {
  await bookingRepository.cleanupStaleRequests();
};
