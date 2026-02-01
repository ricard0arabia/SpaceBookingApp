<template>
  <div class="rounded-2xl bg-white p-6 shadow-sm">
    <h2 class="text-2xl font-semibold">Booking History</h2>
    <ul class="mt-4 space-y-2 text-sm text-slate-700">
      <li v-for="item in history" :key="item.BookingId">
        <router-link class="text-brand-500 hover:underline" :to="`/portal/bookings/${item.BookingId}`">
          {{ item.StartAt }} - {{ item.EndAt }} ({{ item.Status }})
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from "vue";
import { useBookingStore } from "../stores/useBookingStore";

const bookingStore = useBookingStore();

onMounted(async () => {
  await bookingStore.loadHistory();
});

const history = computed(() => bookingStore.history);
</script>
