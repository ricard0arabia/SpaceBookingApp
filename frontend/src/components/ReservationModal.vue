<template>
  <div class="modal">
    <div class="modal-content">
      <h3>Reservation Summary</h3>
      <p><strong>Start:</strong> {{ selection.start }}</p>
      <p><strong>End:</strong> {{ selection.end }}</p>
      <p><strong>Duration:</strong> {{ durationHours }} hours</p>
      <p><strong>Segment:</strong> {{ segment }}</p>
      <p v-if="requiresApproval" style="color: #b45309">
        Requires admin approval before payment.
      </p>
      <div class="toolbar" style="margin-top: 12px">
        <button class="primary" @click="submit">{{ actionLabel }}</button>
        <button class="secondary" @click="$emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useBookingStore } from "../stores/useBookingStore";
import { useSelectionStore, type PendingSelection } from "../stores/useSelectionStore";

const props = defineProps<{ selection: PendingSelection }>();
const bookingStore = useBookingStore();
const selectionStore = useSelectionStore();

const durationHours = computed(() => {
  const start = new Date(props.selection.start);
  const end = new Date(props.selection.end);
  return Math.round((end.getTime() - start.getTime()) / 3600000);
});

const segment = computed(() => {
  const startHour = new Date(props.selection.start).getHours();
  if (startHour >= 9 && startHour <= 17) {
    return "Daytime";
  }
  return "Evening";
});

const requiresApproval = computed(() => durationHours.value >= 3);

const actionLabel = computed(() => (requiresApproval.value ? "Submit for Approval" : "Proceed to Payment"));

const submit = async () => {
  const result = await bookingStore.createBooking(props.selection.start, props.selection.end);
  if (result.checkoutUrl) {
    window.location.href = result.checkoutUrl;
  }
  selectionStore.modalOpen = false;
};
</script>
