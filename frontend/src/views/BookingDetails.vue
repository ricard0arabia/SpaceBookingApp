<template>
  <div class="rounded-2xl bg-white p-6 shadow-sm">
    <h2 class="text-2xl font-semibold">Booking Details</h2>
    <div v-if="!booking" class="mt-4 text-slate-600">Loading...</div>
    <div v-else class="mt-4 space-y-2 text-sm text-slate-700">
      <p><strong>Status:</strong> {{ booking.Status }}</p>
      <p><strong>Start:</strong> {{ booking.StartAt }}</p>
      <p><strong>End:</strong> {{ booking.EndAt }}</p>
      <p><strong>Duration:</strong> {{ booking.DurationHours }} hours</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useRepositories } from "../di/useRepositories";

const repositories = useRepositories();
const booking = ref<any>(null);
const route = useRoute();

onMounted(async () => {
  booking.value = await repositories.booking.getDetails(Number(route.params.id));
});
</script>
