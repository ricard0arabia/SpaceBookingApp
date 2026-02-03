import { httpClient } from "./httpClient";

export const BookingRepository = {
  async createBooking(startAt: string, endAt: string) {
    const { data } = await httpClient.post("/api/bookings", { startAt, endAt });
    return data;
  },
  async payBooking(bookingId: number) {
    const { data } = await httpClient.post(`/api/bookings/${bookingId}/pay`);
    return data;
  },
  async getActive() {
    const { data } = await httpClient.get("/api/bookings/active");
    return data.booking;
  },
  async getHistory() {
    const { data } = await httpClient.get("/api/bookings/history");
    return data.history;
  },
  async getDetails(bookingId: number) {
    const { data } = await httpClient.get(`/api/bookings/${bookingId}`);
    return data.booking;
  },
  async cancel(bookingId: number) {
    const { data } = await httpClient.post(`/api/bookings/${bookingId}/cancel`);
    return data;
  }
};
