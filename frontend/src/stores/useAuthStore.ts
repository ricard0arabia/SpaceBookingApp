import { defineStore } from "pinia";
import { ref } from "vue";
import { useRepositories } from "../di/useRepositories";
import type { User } from "../repositories/AuthRepository";

export const useAuthStore = defineStore("auth", () => {
  const repositories = useRepositories();
  const me = ref<User | null>(null);
  const isAuthenticated = ref(false);

  const hydrate = async () => {
    me.value = await repositories.auth.getMe();
    isAuthenticated.value = Boolean(me.value);
  };

  const logout = async () => {
    await repositories.auth.logout();
    me.value = null;
    isAuthenticated.value = false;
  };

  return { me, isAuthenticated, hydrate, logout };
});
