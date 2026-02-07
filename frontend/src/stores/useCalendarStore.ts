import { defineStore } from "pinia";
import { ref } from "vue";
import { useRepositories } from "../di/useRepositories";
import type { CalendarBooking, CalendarBlock } from "../repositories/CalendarRepository";

export const useCalendarStore = defineStore("calendar", () => {
  const repositories = useRepositories();
  const loadedBookings = ref<CalendarBooking[]>([]);
  const loadedBlocks = ref<CalendarBlock[]>([]);

  const fetchEvents = async (start: string, end: string) => {
    const data = await repositories.calendar.getCalendarEvents(start, end);
    loadedBookings.value = data.bookings;
    loadedBlocks.value = data.blocks;
  };

  return { loadedBookings, loadedBlocks, fetchEvents };
});
