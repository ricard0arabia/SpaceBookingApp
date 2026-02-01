<template>
  <div class="card">
    <h2>Booking Details</h2>
    <div v-if="!booking">Loading...</div>
    <div v-else>
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
