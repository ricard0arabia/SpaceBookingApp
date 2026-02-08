<template>
  <div class="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm">
    <h2 class="text-2xl font-semibold">Set a new password</h2>
    <input v-model="newPassword" type="password" class="mt-4 w-full rounded-lg border border-slate-200 p-2" placeholder="New password" />
    <button class="mt-4 w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white" @click="submit">Update password</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useRepositories } from "../di/useRepositories";
import { useAuthStore } from "../stores/useAuthStore";

const repositories = useRepositories();
const auth = useAuthStore();
const router = useRouter();
const newPassword = ref("");

const submit = async () => {
  await repositories.auth.recoveryComplete(newPassword.value);
  await auth.hydrate();
  router.push("/");
};
</script>
