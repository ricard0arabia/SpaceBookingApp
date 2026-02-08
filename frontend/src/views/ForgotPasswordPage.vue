<template>
  <div class="mx-auto max-w-lg rounded-2xl bg-white p-6 shadow-sm">
    <h2 class="text-2xl font-semibold">Forgot password</h2>
    <div class="mt-4 space-y-3">
      <input v-model="phone" class="w-full rounded-lg border border-slate-200 p-2" placeholder="+63..." />
      <div :id="recaptchaId" class="rounded-lg border border-dashed border-slate-300 p-2 text-sm text-slate-500"></div>
      <button class="rounded-lg border border-slate-200 px-4 py-2 text-sm" @click="sendOtp">Send OTP</button>
      <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>
      <input v-if="confirmation" v-model="otp" class="w-full rounded-lg border border-slate-200 p-2" placeholder="OTP" />
      <button v-if="confirmation" class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white" @click="startRecovery">Verify and continue</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from "vue";
import { AxiosError } from "axios";
import { useRouter } from "vue-router";
import { useRepositories } from "../di/useRepositories";
import { useAuthStore } from "../stores/useAuthStore";
import { clearPhoneVerifier, confirmPhoneOtpAndGetIdToken, sendPhoneOtp } from "../services/firebasePhoneAuth";

const repositories = useRepositories();
const auth = useAuthStore();
const router = useRouter();
const recaptchaId = "firebase-recaptcha-forgot";

const phone = ref("");
const otp = ref("");
const confirmation = ref<Awaited<ReturnType<typeof sendPhoneOtp>> | null>(null);
const errorMessage = ref("");

const sendOtp = async () => {
  errorMessage.value = "";
  try {
    confirmation.value = await sendPhoneOtp(phone.value, recaptchaId);
  } catch (error) {
    if (error instanceof AxiosError || error instanceof Error) {
      errorMessage.value = "Phone OTP is not enabled. Enable Firebase Phone Auth and verify localhost in Authorized domains.";
      return;
    }
    errorMessage.value = "Unable to send OTP right now.";
  }
};

const startRecovery = async () => {
  if (!confirmation.value) return;
  const firebaseIdToken = await confirmPhoneOtpAndGetIdToken(otp.value, confirmation.value);
  await repositories.auth.recoveryStart(firebaseIdToken);
  await auth.hydrate();
  router.push("/force-password-reset");
};

onUnmounted(() => {
  clearPhoneVerifier();
});
</script>
