import axios from "axios";

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
  withCredentials: true
});

const CSRF_HEADER = "x-csrf-token";

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

bootstrapCsrf();

httpClient.interceptors.response.use(
  (response) => {
    const token = response.headers[CSRF_HEADER];
    if (token) {
      setCsrfToken(token as string);
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);
