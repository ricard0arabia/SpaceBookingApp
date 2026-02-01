<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60">
    <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
      <h3 class="text-xl font-semibold">Login</h3>
      <p class="mt-2 text-sm text-slate-600">Select a login method to continue your reservation.</p>
      <div class="mt-4 flex gap-3">
        <button class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white" @click="googleLogin">
          Login with Google
        </button>
        <button class="rounded-lg border border-slate-200 px-4 py-2 text-sm" @click="mode = 'otp'">
          Login via OTP
        </button>
      </div>

      <div v-if="mode === 'otp'" class="mt-6 space-y-3">
        <div>
          <label class="text-sm font-medium text-slate-700">Phone Number</label>
          <input v-model="phone" class="mt-1 w-full rounded-lg border border-slate-200 p-2" placeholder="+639..." />
        </div>
        <button class="rounded-lg border border-slate-200 px-4 py-2 text-sm" @click="requestOtp">Request OTP</button>
        <div v-if="otpSent" class="space-y-3">
          <div>
            <label class="text-sm font-medium text-slate-700">OTP</label>
            <input v-model="otp" class="mt-1 w-full rounded-lg border border-slate-200 p-2" placeholder="Enter OTP" />
          </div>
          <button class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white" @click="verifyOtp">
            Verify
          </button>
        </div>
      </div>

      <p class="mt-6 text-sm text-slate-600">
        Don't have an account?
        <button class="font-semibold text-brand-500" @click="goSignup">Sign up</button>
      </p>

      <button class="mt-4 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm" @click="$emit('close')">
        Close
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

const mode = ref<"none" | "otp">("none");
const phone = ref("");
const otp = ref("");
const otpSent = ref(false);

const googleLogin = () => {
  repositories.auth.startGoogleOAuth();
};

const requestOtp = async () => {
  await repositories.auth.otpLoginRequest(phone.value);
  otpSent.value = true;
};

const verifyOtp = async () => {
  await repositories.auth.otpLoginVerify(phone.value, otp.value);
  await authStore.hydrate();
};

const goSignup = () => {
  router.push("/signup");
};
</script>
