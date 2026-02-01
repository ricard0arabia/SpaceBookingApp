import { defineStore } from "pinia";
import { ref } from "vue";
import { useRepositories } from "../di/useRepositories";

export const useAdminStore = defineStore("admin", () => {
  const repositories = useRepositories();
  const blocks = ref<any[]>([]);

  const loadBlocks = async () => {
    blocks.value = await repositories.admin.listBlocks();
  };

  const createBlock = async (startAt: string, endAt: string, reason?: string) => {
    await repositories.admin.createBlock(startAt, endAt, reason);
    await loadBlocks();
  };

  const deleteBlock = async (blockId: number) => {
    await repositories.admin.deleteBlock(blockId);
    await loadBlocks();
  };

  return { blocks, loadBlocks, createBlock, deleteBlock };
});
