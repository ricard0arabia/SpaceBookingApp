import { createRouter, createWebHistory } from "vue-router";
import CalendarPage from "../components/CalendarPage.vue";
import SignupPage from "../views/SignupPage.vue";
import PortalActive from "../views/PortalActive.vue";
import PortalHistory from "../views/PortalHistory.vue";
import PortalTransactions from "../views/PortalTransactions.vue";
import BookingDetails from "../views/BookingDetails.vue";
import AdminBlocks from "../views/AdminBlocks.vue";
import LoginPage from "../views/LoginPage.vue";
import ForgotPasswordPage from "../views/ForgotPasswordPage.vue";
import ForcePasswordResetPage from "../views/ForcePasswordResetPage.vue";
import PortalSettings from "../views/PortalSettings.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: CalendarPage },
    { path: "/login", component: LoginPage },
    { path: "/signup", component: SignupPage },
    { path: "/forgot-password", component: ForgotPasswordPage },
    { path: "/force-password-reset", component: ForcePasswordResetPage },
    { path: "/portal/settings", component: PortalSettings },
    { path: "/portal/active", component: PortalActive },
    { path: "/portal/history", component: PortalHistory },
    { path: "/portal/transactions", component: PortalTransactions },
    { path: "/portal/bookings/:id", component: BookingDetails },
    { path: "/admin/blocks", component: AdminBlocks }
  ]
});
