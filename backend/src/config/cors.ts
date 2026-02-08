import type { CorsOptions } from "cors";

const origins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export const corsOptions: CorsOptions = {
  origin: origins,
  credentials: true,
  allowedHeaders: ["Content-Type", "X-CSRF-Token", "X-Firebase-AppCheck"],
  exposedHeaders: ["X-CSRF-Token"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
};
