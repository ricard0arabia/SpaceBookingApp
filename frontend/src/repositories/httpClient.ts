import axios from "axios";
import { getFirebaseAppCheckToken } from "../config/appCheck";

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
  withCredentials: true
});

const csrfBootstrapClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
  withCredentials: true
});

const CSRF_HEADER = "x-csrf-token";
const APP_CHECK_HEADER = "x-firebase-appcheck";

const setCsrfToken = (token: string) => {
  httpClient.defaults.headers.common[CSRF_HEADER] = token;
  sessionStorage.setItem("csrfToken", token);
};

const bootstrapCsrf = () => {
  const token = sessionStorage.getItem("csrfToken");
  if (token) {
    httpClient.defaults.headers.common[CSRF_HEADER] = token;
  }
};

let csrfBootstrapPromise: Promise<void> | null = null;

const ensureCsrfToken = async () => {
  const token = httpClient.defaults.headers.common[CSRF_HEADER] as string | undefined;
  if (token) {
    return;
  }

  if (!csrfBootstrapPromise) {
    csrfBootstrapPromise = csrfBootstrapClient.get("/api/me").then((response) => {
      const newToken = response.headers[CSRF_HEADER] as string | undefined;
      if (newToken) {
        setCsrfToken(newToken);
      }
    }).finally(() => {
      csrfBootstrapPromise = null;
    });
  }

  await csrfBootstrapPromise;
};

bootstrapCsrf();

httpClient.interceptors.request.use(async (config) => {
  const method = (config.method ?? "get").toLowerCase();
  if (["post", "put", "patch", "delete"].includes(method)) {
    await ensureCsrfToken();
  }

  const appCheckToken = await getFirebaseAppCheckToken();
  if (appCheckToken) {
    config.headers[APP_CHECK_HEADER] = appCheckToken;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => {
    const token = response.headers[CSRF_HEADER];
    if (token) {
      setCsrfToken(token as string);
    }
    return response;
  },
  (error) => Promise.reject(error)
);
