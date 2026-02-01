<template>
  <div class="app-shell">
    <header>
      <div>Hoops Court Booking</div>
      <div class="toolbar">
        <button class="secondary" @click="router.push('/')">Calendar</button>
        <button class="secondary" @click="router.push('/portal/active')">My Booking</button>
        <button class="secondary" @click="router.push('/portal/history')">History</button>
        <button v-if="auth.isAuthenticated" class="secondary" @click="logout">Logout</button>
      </div>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "./stores/useAuthStore";

const router = useRouter();
const auth = useAuthStore();

onMounted(async () => {
  await auth.hydrate();
});

const logout = async () => {
  await auth.logout();
  router.push("/");
};
</script>
