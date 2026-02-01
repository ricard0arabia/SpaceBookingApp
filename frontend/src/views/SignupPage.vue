<template>
  <div class="card">
    <h2>OTP Sign-up</h2>
    <label>Full Name</label>
    <input v-model="fullName" placeholder="Full name" />
    <label>Phone</label>
    <input v-model="phone" placeholder="+639..." />
    <div class="toolbar" style="margin-top: 12px">
      <button class="secondary" @click="requestOtp">Send OTP</button>
    </div>

    <div v-if="otpSent" style="margin-top: 12px">
      <label>OTP</label>
      <input v-model="otp" placeholder="Enter OTP" />
      <button class="primary" style="margin-top: 12px" @click="verifyOtp">Verify</button>
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
