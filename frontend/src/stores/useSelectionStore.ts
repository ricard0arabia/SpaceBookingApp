import { defineStore } from "pinia";
import { ref, watch } from "vue";

export type PendingSelection = {
  start: string;
  end: string;
  viewType: string;
};

const STORAGE_KEY = "pendingSelection";

export const useSelectionStore = defineStore("selection", () => {
  const pendingSelection = ref<PendingSelection | null>(null);
  const modalOpen = ref(false);

  const setSelection = (selection: PendingSelection) => {
    pendingSelection.value = selection;
  };

  const clearSelection = () => {
    pendingSelection.value = null;
    modalOpen.value = false;
  };

  const hydrate = () => {
    const value = sessionStorage.getItem(STORAGE_KEY);
    if (value) {
      pendingSelection.value = JSON.parse(value) as PendingSelection;
    }
  };

  watch(pendingSelection, (value) => {
    if (value) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  });

  return { pendingSelection, modalOpen, setSelection, clearSelection, hydrate };
});
