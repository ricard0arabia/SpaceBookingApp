<template>
  <div class="mx-auto max-w-lg rounded-2xl bg-white p-6 shadow-sm">
    <h2 class="text-2xl font-semibold">Create account</h2>
    <div class="mt-4 space-y-3">
      <input v-model="username" class="w-full rounded-lg border border-slate-200 p-2" placeholder="Username" />
      <input v-model="password" type="password" class="w-full rounded-lg border border-slate-200 p-2" placeholder="Password" />
      <input v-model="phone" class="w-full rounded-lg border border-slate-200 p-2" placeholder="+63..." />
      <div :id="recaptchaId" class="rounded-lg border border-dashed border-slate-300 p-2 text-sm text-slate-500"></div>
      <button :disabled="isSendingOtp || cooldownSeconds > 0" class="rounded-lg border border-slate-200 px-4 py-2 text-sm disabled:opacity-60" @click="sendOtp">
        {{ cooldownSeconds > 0 ? `Retry in ${cooldownSeconds}s` : isSendingOtp ? 'Sending...' : 'Send OTP' }}
      </button>
      <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
      <input v-if="confirmation" v-model="otp" class="w-full rounded-lg border border-slate-200 p-2" placeholder="OTP" />
      <button v-if="confirmation" class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white" @click="completeSignup">Complete signup</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useRepositories } from "../di/useRepositories";
import { useAuthStore } from "../stores/useAuthStore";
import { clearPhoneVerifier, confirmPhoneOtpAndGetIdToken, sendPhoneOtp } from "../services/firebasePhoneAuth";

const repositories = useRepositories();
const auth = useAuthStore();
const router = useRouter();
const recaptchaId = "firebase-recaptcha-signup";

const username = ref("");
const password = ref("");
const phone = ref("");
const otp = ref("");
const confirmation = ref<Awaited<ReturnType<typeof sendPhoneOtp>> | null>(null);
const errorMessage = ref("");
const isSendingOtp = ref(false);
const cooldownSeconds = ref(0);
let cooldownInterval: ReturnType<typeof setInterval> | null = null;

const startCooldown = (seconds: number) => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval);
  }
  cooldownSeconds.value = seconds;
  cooldownInterval = setInterval(() => {
    cooldownSeconds.value = Math.max(0, cooldownSeconds.value - 1);
    if (cooldownSeconds.value === 0 && cooldownInterval) {
      clearInterval(cooldownInterval);
      cooldownInterval = null;
    }
  }, 1000);
};

const mapOtpError = (error: unknown) => {
  const message = String((error as { message?: string })?.message ?? "");
  if (message.includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
    return "Too many OTP attempts. Please wait 10-15 minutes before trying again.";
  }
  if (message.includes("OPERATION_NOT_ALLOWED")) {
    return "Phone OTP is not enabled for the current Firebase project. Check Phone provider + Authorized domains.";
  }
  return "Unable to send OTP right now. Please try again shortly.";
};

const sendOtp = async () => {
  if (isSendingOtp.value || cooldownSeconds.value > 0) {
    return;
  }
  errorMessage.value = "";
  isSendingOtp.value = true;
  try {
    confirmation.value = await sendPhoneOtp(phone.value, recaptchaId);
    startCooldown(60);
  } catch (error) {
    errorMessage.value = mapOtpError(error);
    if (String((error as { message?: string })?.message ?? "").includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
      startCooldown(300);
    }
  } finally {
    isSendingOtp.value = false;
  }
};

const completeSignup = async () => {
  if (!confirmation.value) return;
  const firebaseIdToken = await confirmPhoneOtpAndGetIdToken(otp.value, confirmation.value);
  await repositories.auth.localSignupComplete({ username: username.value, password: password.value, firebaseIdToken });
  await auth.hydrate();
  router.push("/");
};

onUnmounted(() => {
  clearPhoneVerifier();
  if (cooldownInterval) {
    clearInterval(cooldownInterval);
  }
});
</script>
