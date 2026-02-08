<template>
  <div class="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm">
    <h2 class="text-2xl font-semibold">Login</h2>
    <div class="mt-4 space-y-3">
      <div>
        <label class="text-sm font-medium text-slate-700">Username</label>
        <input v-model="username" class="mt-1 w-full rounded-lg border border-slate-200 p-2" />
      </div>
      <div>
        <label class="text-sm font-medium text-slate-700">Password</label>
        <input v-model="password" type="password" class="mt-1 w-full rounded-lg border border-slate-200 p-2" />
      </div>
      <button class="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white" @click="submitLocalLogin">Login</button>
      <button class="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm" @click="googleLogin">Continue with Google</button>
      <div class="flex items-center justify-between text-sm">
        <button class="text-brand-600" @click="router.push('/signup')">Create account</button>
        <button class="text-brand-600" @click="router.push('/forgot-password')">Forgot password?</button>
      </div>
    </div>
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
const username = ref("");
const password = ref("");

const submitLocalLogin = async () => {
  await repositories.auth.localLogin(username.value, password.value);
  await auth.hydrate();
  router.push("/");
};

const googleLogin = () => repositories.auth.startGoogleOAuth();
</script>
