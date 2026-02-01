<template>
  <div class="rounded-2xl bg-white p-6 shadow-sm">
    <h2 class="text-2xl font-semibold">My Active Booking</h2>
    <div v-if="!booking" class="mt-4 text-slate-600">No active booking.</div>
    <div v-else class="mt-4 space-y-2 text-sm text-slate-700">
      <p><strong>Status:</strong> {{ booking.Status }}</p>
      <p><strong>Start:</strong> {{ booking.StartAt }}</p>
      <p><strong>End:</strong> {{ booking.EndAt }}</p>
      <div class="mt-4 flex gap-3">
        <button
          v-if="booking.Status === 'APPROVED_AWAITING_PAYMENT'"
          class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
          @click="pay"
        >
          Pay Now
        </button>
        <button
          v-if="canCancel"
          class="rounded-lg border border-slate-200 px-4 py-2 text-sm"
          @click="cancel"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useBookingStore } from "../stores/useBookingStore";

const bookingStore = useBookingStore();

onMounted(async () => {
  await bookingStore.loadActive();
});

const booking = computed(() => bookingStore.activeBooking);

const canCancel = computed(
  () => booking.value && ["HELD", "PENDING_APPROVAL", "CONFIRMED"].includes(booking.value.Status)
);

const cancel = async () => {
  if (!booking.value) return;
  await bookingStore.cancelBooking(booking.value.BookingId);
  await bookingStore.loadActive();
};

const pay = async () => {
  if (!booking.value) return;
  const result = await bookingStore.payBooking(booking.value.BookingId);
  if (result.checkoutUrl) {
    window.location.href = result.checkoutUrl;
  }
};
</script>
