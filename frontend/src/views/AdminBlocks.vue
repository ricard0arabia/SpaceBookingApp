<template>
  <div class="card">
    <h2>Admin Blocks</h2>
    <div>
      <label>Start</label>
      <input v-model="startAt" placeholder="YYYY-MM-DDTHH:00" />
      <label>End</label>
      <input v-model="endAt" placeholder="YYYY-MM-DDTHH:00" />
      <label>Reason</label>
      <input v-model="reason" placeholder="Maintenance" />
      <button class="primary" @click="create">Create Block</button>
    </div>
    <ul style="margin-top: 12px">
      <li v-for="block in blocks" :key="block.BlockId">
        {{ block.StartAt }} - {{ block.EndAt }} ({{ block.Reason || 'Blocked' }})
        <button class="secondary" @click="remove(block.BlockId)">Delete</button>
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
