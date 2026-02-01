<template>
  <div class="mx-auto max-w-lg rounded-2xl bg-white p-6 shadow-sm">
    <h2 class="text-2xl font-semibold">OTP Sign-up</h2>
    <div class="mt-4 space-y-3">
      <div>
        <label class="text-sm font-medium text-slate-700">Full Name</label>
        <input v-model="fullName" class="mt-1 w-full rounded-lg border border-slate-200 p-2" placeholder="Full name" />
      </div>
      <div>
        <label class="text-sm font-medium text-slate-700">Phone</label>
        <input v-model="phone" class="mt-1 w-full rounded-lg border border-slate-200 p-2" placeholder="+639..." />
      </div>
      <button class="rounded-lg border border-slate-200 px-4 py-2 text-sm" @click="requestOtp">Send OTP</button>
    </div>

    <div v-if="otpSent" class="mt-6 space-y-3">
      <div>
        <label class="text-sm font-medium text-slate-700">OTP</label>
        <input v-model="otp" class="mt-1 w-full rounded-lg border border-slate-200 p-2" placeholder="Enter OTP" />
      </div>
      <button class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white" @click="verifyOtp">
        Verify
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRepositories } from "../di/useRepositories";
import { useAuthStore } from "../stores/useAuthStore";
import { useRouter } from "vue-router";

const repositories = useRepositories();
const authStore = useAuthStore();
const router = useRouter();

const fullName = ref("");
const phone = ref("");
const otp = ref("");
const otpSent = ref(false);

const requestOtp = async () => {
  await repositories.auth.otpSignupRequest(fullName.value, phone.value);
  otpSent.value = true;
};

const verifyOtp = async () => {
  await repositories.auth.otpSignupVerify(fullName.value, phone.value, otp.value);
  await authStore.hydrate();
  router.push("/");
};
</script>
