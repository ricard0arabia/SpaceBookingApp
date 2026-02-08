import { DateTime } from "luxon";
import { TIME_ZONE, hoursBetween, nowManila } from "./time.js";

const OPEN_HOUR = 9;
const CLOSE_HOUR = 22;

export type BookingSegment = "DAYTIME" | "EVENING" | "WHOLE_DAY";

export const isWholeDay = (start: DateTime, end: DateTime) =>
  start.hour === OPEN_HOUR && end.hour === CLOSE_HOUR && end.diff(start, "hours").hours === 13;

export const getSegment = (start: DateTime, end: DateTime): BookingSegment => {
  if (isWholeDay(start, end)) {
    return "WHOLE_DAY";
  }
  if (start.hour >= 9 && start.hour <= 17) {
    return "DAYTIME";
  }
  return "EVENING";
};

export const validateOperatingHours = (start: DateTime, end: DateTime) => {
  if (start.zoneName !== TIME_ZONE || end.zoneName !== TIME_ZONE) {
    throw new Error("Invalid timezone");
  }
  if (start.minute !== 0 || end.minute !== 0) {
    throw new Error("Bookings must align to the hour");
  }
  if (start.hour < OPEN_HOUR || end.hour > CLOSE_HOUR) {
    throw new Error("Booking time outside operating hours");
  }
  if (end <= start) {
    throw new Error("End time must be after start time");
  }
};

export const validateDuration = (start: DateTime, end: DateTime) => {
  const duration = hoursBetween(start, end);
  if (duration < 1) {
    throw new Error("Minimum booking is 1 hour");
  }
  if (!Number.isInteger(duration)) {
    throw new Error("Duration must be in 1-hour increments");
  }
  if (duration > 13) {
    throw new Error("Maximum booking is 1 day");
  }
  return duration;
};

export const needsApproval = (durationHours: number, start: DateTime, end: DateTime) =>
  durationHours >= 3 || isWholeDay(start, end);

export const validateLeadTime = (start: DateTime) => {
  const now = nowManila();
  const startDate = start.startOf("day");
  const today = now.startOf("day");
  const diffDays = startDate.diff(today, "days").days;

  if (start.hour >= 9 && start.hour <= 17) {
    if (diffDays < 1 || diffDays > 7) {
      throw new Error("Daytime bookings must be 1-7 days ahead");
    }
    return;
  }

  if (diffDays < 0 || diffDays > 7) {
    throw new Error("Evening bookings must be within 0-7 days ahead");
  }
  if (diffDays === 0) {
    const cutoff = now.plus({ hours: 3 });
    if (start < cutoff) {
      throw new Error("Evening same-day bookings require 3-hour lead time");
    }
  }
};
