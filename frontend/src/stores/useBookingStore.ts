import { defineStore } from "pinia";
import { ref } from "vue";
import { useRepositories } from "../di/useRepositories";

export const useBookingStore = defineStore("booking", () => {
  const repositories = useRepositories();
  const activeBooking = ref<any>(null);
  const history = ref<any[]>([]);

  const loadActive = async () => {
    activeBooking.value = await repositories.booking.getActive();
  };

  const loadHistory = async () => {
    history.value = await repositories.booking.getHistory();
  };

  const createBooking = async (startAt: string, endAt: string) =>
    repositories.booking.createBooking(startAt, endAt);

  const payBooking = async (bookingId: number) => repositories.booking.payBooking(bookingId);

  const cancelBooking = async (bookingId: number) => repositories.booking.cancel(bookingId);

  return {
    activeBooking,
    history,
    loadActive,
    loadHistory,
    createBooking,
    payBooking,
    cancelBooking
  };
});
