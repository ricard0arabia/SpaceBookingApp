import { createRouter, createWebHistory } from "vue-router";
import CalendarPage from "../components/CalendarPage.vue";
import SignupPage from "../views/SignupPage.vue";
import PortalActive from "../views/PortalActive.vue";
import PortalHistory from "../views/PortalHistory.vue";
import BookingDetails from "../views/BookingDetails.vue";
import AdminBlocks from "../views/AdminBlocks.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: CalendarPage },
    { path: "/signup", component: SignupPage },
    { path: "/portal/active", component: PortalActive },
    { path: "/portal/history", component: PortalHistory },
    { path: "/portal/bookings/:id", component: BookingDetails },
    { path: "/admin/blocks", component: AdminBlocks }
  ]
});
