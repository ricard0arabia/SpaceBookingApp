<template>
  <div class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70">
    <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
      <h3 class="text-xl font-semibold">Login with OTP</h3>
      <p class="mt-2 text-sm text-slate-600">Enter your name and phone number to receive a one-time passcode.</p>

      <div class="mt-5 space-y-3">
        <div>
          <label class="text-sm font-medium text-slate-700">Name</label>
          <input v-model="fullName" class="mt-1 w-full rounded-lg border border-slate-200 p-2" placeholder="Juan Dela Cruz" />
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700">Phone Number</label>
          <input v-model="phone" class="mt-1 w-full rounded-lg border border-slate-200 p-2" placeholder="+639xxxxxxxxx" />
        </div>

        <button
          v-if="!otpSent"
          class="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
          @click="requestOtp"
        >
          Send OTP
        </button>

        <div v-if="otpSent" class="space-y-3">
          <div>
            <label class="text-sm font-medium text-slate-700">OTP</label>
            <input v-model="otp" class="mt-1 w-full rounded-lg border border-slate-200 p-2" placeholder="Enter 6-digit code" />
          </div>
          <button class="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white" @click="verifyOtp">
            Verify OTP
          </button>
        </div>
      </div>

      <button class="mt-4 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm" @click="$emit('close')">
        Back
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRepositories } from "../di/useRepositories";
import { useAuthStore } from "../stores/useAuthStore";

const emit = defineEmits<{ (e: "close"): void }>();
const repositories = useRepositories();
const authStore = useAuthStore();

const fullName = ref("");
const phone = ref("");
const otp = ref("");
const otpSent = ref(false);

const requestOtp = async () => {
  try {
    await repositories.auth.otpLoginRequest(phone.value);
  } catch {
    await repositories.auth.otpSignupRequest(fullName.value, phone.value);
  }
  otpSent.value = true;
};

const verifyOtp = async () => {
  try {
    await repositories.auth.otpLoginVerify(phone.value, otp.value);
  } catch {
    await repositories.auth.otpSignupVerify(fullName.value, phone.value, otp.value);
  }
  await authStore.hydrate();
  emit("close");
};
</script>
