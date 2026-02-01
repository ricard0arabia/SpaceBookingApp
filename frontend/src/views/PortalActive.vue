<template>
  <div class="card">
    <h2>My Active Booking</h2>
    <div v-if="!booking">No active booking.</div>
    <div v-else>
      <p><strong>Status:</strong> {{ booking.Status }}</p>
      <p><strong>Start:</strong> {{ booking.StartAt }}</p>
      <p><strong>End:</strong> {{ booking.EndAt }}</p>
      <button v-if="booking.Status === 'APPROVED_AWAITING_PAYMENT'" class="primary" @click="pay">
        Pay Now
      </button>
      <button v-if="canCancel" class="secondary" @click="cancel">Cancel</button>
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
