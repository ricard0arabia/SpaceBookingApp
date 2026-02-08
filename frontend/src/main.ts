import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { router } from "./router/index.ts";
import { createRepositoryContainer } from "./di/RepositoryContainer.ts";
import { initFirebaseAppCheck } from "./config/appCheck";
import "./assets/main.css";

initFirebaseAppCheck();

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

const repositories = createRepositoryContainer();
app.provide("repositories", repositories);

app.mount("#app");
