<template>
  <div class="min-h-screen bg-slate-50">
    <header class="bg-brand-900 text-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div class="text-lg font-semibold">Hoops Court Booking</div>
        <div class="flex items-center gap-3">
          <button
            v-if="!auth.isAuthenticated"
            class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white"
            @click="openLogin"
          >
            Login
          </button>
          <template v-else>
            <button
              class="rounded-lg border border-white/20 px-3 py-2 text-sm"
              @click="router.push('/portal/active')"
            >
              Bookings
            </button>
            <button
              class="rounded-lg border border-white/20 px-3 py-2 text-sm"
              @click="router.push('/portal/history')"
            >
              History
            </button>
            <button
              class="rounded-lg border border-white/20 px-3 py-2 text-sm"
              @click="router.push('/portal/transactions')"
            >
              Transactions
            </button>
            <button class="rounded-lg bg-white/10 px-3 py-2 text-sm" @click="logout">
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
