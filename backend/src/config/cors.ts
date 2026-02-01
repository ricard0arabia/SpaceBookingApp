import type { CorsOptions } from "cors";

export const corsOptions: CorsOptions = {
  origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173"],
  credentials: true
};
