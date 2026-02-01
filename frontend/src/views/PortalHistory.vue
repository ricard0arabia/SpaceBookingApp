<template>
  <div class="card">
    <h2>Booking History</h2>
    <ul>
      <li v-for="item in history" :key="item.BookingId">
        <router-link :to="`/portal/bookings/${item.BookingId}`">
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
