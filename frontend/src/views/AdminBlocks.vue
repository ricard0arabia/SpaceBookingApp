<template>
  <div class="rounded-2xl bg-white p-6 shadow-sm">
    <h2 class="text-2xl font-semibold">Admin Blocks</h2>
    <div class="mt-4 grid gap-3 md:grid-cols-3">
      <div>
        <label class="text-sm font-medium text-slate-700">Start</label>
        <input v-model="startAt" class="mt-1 w-full rounded-lg border border-slate-200 p-2" placeholder="YYYY-MM-DDTHH:00" />
      </div>
      <div>
        <label class="text-sm font-medium text-slate-700">End</label>
        <input v-model="endAt" class="mt-1 w-full rounded-lg border border-slate-200 p-2" placeholder="YYYY-MM-DDTHH:00" />
      </div>
      <div>
        <label class="text-sm font-medium text-slate-700">Reason</label>
        <input v-model="reason" class="mt-1 w-full rounded-lg border border-slate-200 p-2" placeholder="Maintenance" />
      </div>
    </div>
    <button class="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white" @click="create">
      Create Block
    </button>
    <ul class="mt-6 space-y-2 text-sm text-slate-700">
      <li v-for="block in blocks" :key="block.BlockId" class="flex items-center justify-between">
        <span>{{ block.StartAt }} - {{ block.EndAt }} ({{ block.Reason || 'Blocked' }})</span>
        <button class="rounded-lg border border-slate-200 px-3 py-1 text-xs" @click="remove(block.BlockId)">
          Delete
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref } from "vue";
import { useAdminStore } from "../stores/useAdminStore";

const adminStore = useAdminStore();

const startAt = ref("");
const endAt = ref("");
const reason = ref("");

onMounted(async () => {
  await adminStore.loadBlocks();
});

const blocks = computed(() => adminStore.blocks);

const create = async () => {
  await adminStore.createBlock(startAt.value, endAt.value, reason.value);
  startAt.value = "";
  endAt.value = "";
  reason.value = "";
};

const remove = async (blockId: number) => {
  await adminStore.deleteBlock(blockId);
};
</script>
