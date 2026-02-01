<template>
  <div class="card">
    <FullCalendar ref="calendarRef" :options="calendarOptions" />
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
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "../assets/fullcalendar.css";
import LoginModal from "./LoginModal.vue";
import ReservationModal from "./ReservationModal.vue";
import { useCalendarStore } from "../stores/useCalendarStore";
import { useSelectionStore } from "../stores/useSelectionStore";
import { useAuthStore } from "../stores/useAuthStore";

const calendarStore = useCalendarStore();
const selectionStore = useSelectionStore();
const authStore = useAuthStore();
const calendarRef = ref();
const showLogin = ref(false);

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
</script>
