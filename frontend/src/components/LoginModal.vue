<template>
  <div class="modal">
    <div class="modal-content">
      <h3>Login</h3>
      <p>Select a login method to continue your reservation.</p>
      <div class="toolbar">
        <button class="primary" @click="googleLogin">Login with Google</button>
        <button class="secondary" @click="mode = 'otp'">Login via OTP</button>
      </div>

      <div v-if="mode === 'otp'" style="margin-top: 16px">
        <label>Phone Number</label>
        <input v-model="phone" placeholder="+639..." />
        <div class="toolbar" style="margin-top: 12px">
          <button class="secondary" @click="requestOtp">Request OTP</button>
        </div>
        <div v-if="otpSent" style="margin-top: 12px">
          <label>OTP</label>
          <input v-model="otp" placeholder="Enter OTP" />
          <button class="primary" style="margin-top: 12px" @click="verifyOtp">Verify</button>
        </div>
      </div>

      <p style="margin-top: 16px">
        Don't have an account? <a @click="goSignup">Sign up</a>
      </p>

      <button class="secondary" style="margin-top: 12px" @click="$emit('close')">Close</button>
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
