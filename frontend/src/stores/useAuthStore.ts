import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useRepositories } from "../di/useRepositories";
import type { User } from "../repositories/AuthRepository";

export const useAuthStore = defineStore("auth", () => {
  const repositories = useRepositories();
  const me = ref<User | null>(null);
  const isHydrated = ref(false);

  const isAuthenticated = computed(() => Boolean(me.value));
  const mustChangePassword = computed(() => Boolean(me.value?.MustChangePassword));

  const hydrate = async () => {
    me.value = await repositories.auth.getMe();
    isHydrated.value = true;
  };

  const logout = async () => {
    await repositories.auth.logout();
    me.value = null;
  };

  return { me, isAuthenticated, mustChangePassword, isHydrated, hydrate, logout };
});
