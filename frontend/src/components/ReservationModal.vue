<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60">
    <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
      <h3 class="text-xl font-semibold">Reservation Summary</h3>
      <div class="mt-4 space-y-2 text-sm text-slate-700">
        <p><strong>Start:</strong> {{ selection.start }}</p>
        <p><strong>End:</strong> {{ selection.end }}</p>
        <p><strong>Duration:</strong> {{ durationHours }} hours</p>
        <p><strong>Segment:</strong> {{ segment }}</p>
      </div>
      <p v-if="requiresApproval" class="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
        Requires admin approval before payment.
      </p>
      <div class="mt-6 flex gap-3">
        <button class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white" @click="submit">
          {{ actionLabel }}
        </button>
        <button class="rounded-lg border border-slate-200 px-4 py-2 text-sm" @click="$emit('close')">Close</button>
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
