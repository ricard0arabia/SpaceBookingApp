<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60">
    <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <h3 class="text-xl font-semibold">Login</h3>
      <div class="mt-4 space-y-3">
        <input v-model="username" class="w-full rounded-lg border border-slate-200 p-2" placeholder="Username" />
        <input v-model="password" type="password" class="w-full rounded-lg border border-slate-200 p-2" placeholder="Password" />
        <button class="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white" @click="submitLocalLogin">Login</button>
        <button class="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm" @click="googleLogin">Continue with Google</button>
      </div>
      <div class="mt-4 flex justify-between text-sm">
        <button class="text-brand-500" @click="router.push('/signup')">Sign up</button>
        <button class="text-brand-500" @click="router.push('/forgot-password')">Forgot password</button>
      </div>
      <button class="mt-4 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm" @click="$emit('close')">Close</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useRepositories } from "../di/useRepositories";
import { useAuthStore } from "../stores/useAuthStore";

const repositories = useRepositories();
const authStore = useAuthStore();
const router = useRouter();

const username = ref("");
const password = ref("");

const googleLogin = () => repositories.auth.startGoogleOAuth();

const submitLocalLogin = async () => {
  await repositories.auth.localLogin(username.value, password.value);
  await authStore.hydrate();
};
</script>
