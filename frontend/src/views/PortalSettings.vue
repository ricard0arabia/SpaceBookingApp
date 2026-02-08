<template>
  <div class="mx-auto max-w-lg space-y-6 rounded-2xl bg-white p-6 shadow-sm">
    <section>
      <h3 class="text-lg font-semibold">Change password</h3>
      <input v-model="currentPassword" type="password" class="mt-2 w-full rounded-lg border border-slate-200 p-2" placeholder="Current password" />
      <input v-model="newPassword" type="password" class="mt-2 w-full rounded-lg border border-slate-200 p-2" placeholder="New password" />
      <button class="mt-3 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white" @click="updatePassword">Save password</button>
    </section>

    <section>
      <h3 class="text-lg font-semibold">Change phone</h3>
      <input v-model="newPhone" class="mt-2 w-full rounded-lg border border-slate-200 p-2" placeholder="New phone" />
      <input v-model="phonePassword" type="password" class="mt-2 w-full rounded-lg border border-slate-200 p-2" placeholder="Current password" />
      <div id="firebase-recaptcha" class="mt-2 rounded-lg border border-dashed border-slate-300 p-2 text-sm text-slate-500">reCAPTCHA</div>
      <button class="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-sm" @click="sendOtp">Verify new phone</button>
      <input v-if="confirmation" v-model="otp" class="mt-2 w-full rounded-lg border border-slate-200 p-2" placeholder="OTP" />
      <button v-if="confirmation" class="mt-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white" @click="updatePhone">Save phone</button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRepositories } from "../di/useRepositories";
import { useAuthStore } from "../stores/useAuthStore";
import { confirmPhoneOtpAndGetIdToken, sendPhoneOtp } from "../services/firebasePhoneAuth";

const repositories = useRepositories();
const auth = useAuthStore();

const currentPassword = ref("");
const newPassword = ref("");
const phonePassword = ref("");
const newPhone = ref("");
const otp = ref("");
const confirmation = ref<Awaited<ReturnType<typeof sendPhoneOtp>> | null>(null);

const updatePassword = async () => {
  await repositories.auth.changePassword(currentPassword.value, newPassword.value);
};

const sendOtp = async () => {
  confirmation.value = await sendPhoneOtp(newPhone.value);
};

const updatePhone = async () => {
  if (!confirmation.value) return;
  const firebaseIdToken = await confirmPhoneOtpAndGetIdToken(otp.value, confirmation.value);
  await repositories.auth.changePhone(phonePassword.value, firebaseIdToken);
  await auth.hydrate();
};
</script>
