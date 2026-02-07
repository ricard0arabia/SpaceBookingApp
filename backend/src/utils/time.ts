import { DateTime } from "luxon";

export const TIME_ZONE = "Asia/Manila";

export const nowManila = () => DateTime.now().setZone(TIME_ZONE);

export const toManila = (value: string | Date) =>
  typeof value === "string"
    ? DateTime.fromISO(value, { zone: TIME_ZONE })
    : DateTime.fromJSDate(value, { zone: TIME_ZONE });

export const toUtcJs = (value: DateTime) => value.toUTC().toJSDate();

export const hoursBetween = (start: DateTime, end: DateTime) =>
  Math.round(end.diff(start, "hours").hours);
