import { httpClient } from "./httpClient";

export type CalendarBooking = {
  BookingId: number;
  StartAt: string;
  EndAt: string;
  Status: string;
};

export type CalendarBlock = {
  BlockId: number;
  StartAt: string;
  EndAt: string;
  Reason?: string | null;
};

export const CalendarRepository = {
  async getCalendarEvents(start: string, end: string) {
    const { data } = await httpClient.get<{ bookings: CalendarBooking[]; blocks: CalendarBlock[] }>(
      "/api/calendar/events",
      { params: { start, end } }
    );
    return data;
  }
};
