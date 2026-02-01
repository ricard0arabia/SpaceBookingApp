import { Router } from "express";
import { getCalendarEvents } from "../controllers/calendarController.js";

export const calendarRoutes = Router();

calendarRoutes.get("/calendar/events", getCalendarEvents);
