<template>
  <div class="grid gap-8 lg:grid-cols-2">
    <section class="space-y-6">
      <div class="rounded-2xl bg-white p-6 shadow-sm">
        <h2 class="text-2xl font-semibold text-slate-900">Reserve the Basketball Court</h2>
        <p class="mt-2 text-slate-600">
          Book your preferred slot at our premium indoor basketball court. Enjoy professional flooring, LED
          lighting, and full amenities for teams or casual games.
        </p>
        <div class="mt-6 overflow-hidden rounded-xl">
          <img :src="courtImage" alt="Basketball court" class="h-56 w-full object-cover" />
        </div>
      </div>

      <div class="rounded-2xl bg-white p-6 shadow-sm">
        <h3 class="text-lg font-semibold">Court Rules</h3>
        <ul class="mt-3 space-y-2 text-sm text-slate-600">
          <li>Operating hours: 9:00 AM – 10:00 PM (Asia/Manila).</li>
          <li>1-hour increments only. Whole-day bookings are 9 AM – 10 PM.</li>
          <li>Evening bookings can be same-day with 3-hour lead time.</li>
          <li>Long bookings (≥3 hours) require admin approval.</li>
          <li>One active booking per user at a time.</li>
        </ul>
      </div>
    </section>

    <section class="rounded-2xl bg-white p-4 shadow-sm">
      <FullCalendar ref="calendarRef" :options="calendarOptions" />
    </section>
  </div>
  <LoginModal v-if="showLogin" @close="showLogin = false" />
  <ReservationModal
    v-if="selectionStore.modalOpen && selectionStore.pendingSelection"
    :selection="selectionStore.pendingSelection"
    @close="selectionStore.modalOpen = false"
  />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "@fullcalendar/core/index.css";
import "@fullcalendar/daygrid/index.css";
import "@fullcalendar/timegrid/index.css";
import LoginModal from "./LoginModal.vue";
import ReservationModal from "./ReservationModal.vue";
import { useCalendarStore } from "../stores/useCalendarStore";
import { useSelectionStore } from "../stores/useSelectionStore";
import { useAuthStore } from "../stores/useAuthStore";
import courtImage from "../assets/court.svg";

const calendarStore = useCalendarStore();
const selectionStore = useSelectionStore();
const authStore = useAuthStore();
const calendarRef = ref();
const showLogin = ref(false);
const route = useRoute();

const applySelection = () => {
  if (!selectionStore.pendingSelection) {
    return;
  }
  const api = calendarRef.value?.getApi?.();
  if (!api) {
    return;
  }
  api.select(selectionStore.pendingSelection.start, selectionStore.pendingSelection.end);
};

const handleSelect = (info: any) => {
  selectionStore.setSelection({
    start: info.startStr,
    end: info.endStr,
    viewType: info.view.type
  });
  if (!authStore.isAuthenticated) {
    showLogin.value = true;
    return;
  }
  selectionStore.modalOpen = true;
};

const calendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: "dayGridMonth",
  selectable: true,
  selectMirror: true,
  timeZone: "Asia/Manila",
  slotMinTime: "09:00:00",
  slotMaxTime: "22:00:00",
  slotDuration: "01:00:00",
  snapDuration: "01:00:00",
  headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "dayGridMonth,timeGridWeek,timeGridDay"
  },
  select: handleSelect,
  dateClick: (info: any) => {
    if (info.view.type === "dayGridMonth") {
      const start = `${info.dateStr}T09:00:00`;
      const end = `${info.dateStr}T10:00:00`;
      handleSelect({ startStr: start, endStr: end, view: info.view });
    }
  },
  events: async (info: any, successCallback: any) => {
    await calendarStore.fetchEvents(info.startStr, info.endStr);
    const events = [
      ...calendarStore.loadedBookings.map((booking) => ({
        id: `booking-${booking.BookingId}`,
        start: booking.StartAt,
        end: booking.EndAt,
        title: booking.Status,
        className: booking.Status === "CONFIRMED" ? "event-confirmed" : "event-tentative"
      })),
      ...calendarStore.loadedBlocks.map((block) => ({
        id: `block-${block.BlockId}`,
        start: block.StartAt,
        end: block.EndAt,
        title: block.Reason ?? "Blocked",
        display: "background",
        className: "event-block"
      }))
    ];
    successCallback(events);
  }
};

onMounted(async () => {
  selectionStore.hydrate();
  await authStore.hydrate();
  applySelection();
  if (authStore.isAuthenticated && selectionStore.pendingSelection) {
    selectionStore.modalOpen = true;
  }
  if (route.query.login === "1") {
    showLogin.value = true;
  }
});

watch(
  () => authStore.isAuthenticated,
  (value) => {
    if (value && selectionStore.pendingSelection) {
      applySelection();
      selectionStore.modalOpen = true;
      showLogin.value = false;
    }
  }
);

watch(
  () => route.query.login,
  (value) => {
    if (value === "1") {
      showLogin.value = true;
    }
  }
);
</script>
