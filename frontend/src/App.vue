<template>
  <div
    class="min-h-screen bg-cover bg-center bg-no-repeat"
    :style="{ backgroundImage: `linear-gradient(rgba(10,12,16,0.45), rgba(10,12,16,0.6)), url(${courtBackground})` }"
  >
    <header class="sticky top-0 z-30 border-b border-white/20 bg-black/30 text-white backdrop-blur-md">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div class="text-lg font-semibold tracking-wide">Hoops Court Booking</div>
        <div class="flex items-center gap-3">
          <button
            v-if="!auth.isAuthenticated"
            class="rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/30"
            @click="openLogin"
          >
            Login
          </button>
          <template v-else>
            <button
              class="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/20"
              @click="router.push('/portal/active')"
            >
              Bookings
            </button>
            <button
              class="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/20"
              @click="router.push('/portal/history')"
            >
              History
            </button>
            <button
              class="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/20"
              @click="router.push('/portal/transactions')"
            >
              Transactions
            </button>
            <button
              class="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/20"
              @click="logout"
            >
              Logout
            </button>
          </template>
        </div>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-6 py-8">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "./stores/useAuthStore";
import courtBackground from "./assets/court.svg";

const router = useRouter();
const auth = useAuthStore();

const openLogin = () => {
  router.push({ path: "/", query: { login: "1" } });
};

const logout = async () => {
  await auth.logout();
  router.push("/");
};

onMounted(async () => {
  await auth.hydrate();
});

watch(
  () => auth.me,
  (value) => {
    if (value?.Role === "Admin") {
      router.push("/admin/blocks");
    }
  }
);
</script>
