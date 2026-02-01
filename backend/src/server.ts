import "dotenv/config";
import "express-async-errors";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./config/passport.js";
import { sessionMiddleware } from "./config/session.js";
import { corsOptions } from "./config/cors.js";
import { authRoutes } from "./routes/authRoutes.js";
import { bookingRoutes } from "./routes/bookingRoutes.js";
import { adminRoutes } from "./routes/adminRoutes.js";
import { calendarRoutes } from "./routes/calendarRoutes.js";
import { webhookRoutes } from "./routes/webhookRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./utils/logger.js";
import pinoHttp from "pino-http";

const app = express();

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.use((req, _res, next) => {
  if (req.path.startsWith("/webhooks")) {
    next();
    return;
  }
  express.json()(req, _res, next);
});

app.use(calendarRoutes);
app.use(authRoutes);
app.use(bookingRoutes);
app.use(adminRoutes);
app.use(webhookRoutes);

app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  logger.info(`API listening on ${port}`);
});
