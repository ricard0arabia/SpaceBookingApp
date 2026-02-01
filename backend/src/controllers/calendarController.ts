import type { Request, Response } from "express";
import { bookingRepository } from "../repositories/bookingRepository.js";

export const getCalendarEvents = async (req: Request, res: Response) => {
  const { start, end } = req.query as { start: string; end: string };
  const bookings = await bookingRepository.listCalendarEvents(new Date(start), new Date(end));
  const blocks = await bookingRepository.listBlocks(new Date(start), new Date(end));
  res.json({ bookings, blocks });
};
