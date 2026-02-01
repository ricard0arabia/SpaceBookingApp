import type { Request, Response } from "express";
import { createBooking, payApprovedBooking, cancelBooking } from "../services/bookingService.js";
import { bookingRepository } from "../repositories/bookingRepository.js";

export const createBookingHandler = async (req: Request, res: Response) => {
  const { startAt, endAt } = req.body as { startAt: string; endAt: string };
  const result = await createBooking({
    userId: (req.user as { UserId: number }).UserId,
    startAt,
    endAt,
    successUrl: process.env.PAYMENT_SUCCESS_URL ?? "http://localhost:5173/portal/active",
    cancelUrl: process.env.PAYMENT_CANCEL_URL ?? "http://localhost:5173/portal/active"
  });
  res.json(result);
};

export const payBookingHandler = async (req: Request, res: Response) => {
  const bookingId = Number(req.params.id);
  const checkoutUrl = await payApprovedBooking({
    bookingId,
    successUrl: process.env.PAYMENT_SUCCESS_URL ?? "http://localhost:5173/portal/active",
    cancelUrl: process.env.PAYMENT_CANCEL_URL ?? "http://localhost:5173/portal/active"
  });
  res.json({ checkoutUrl });
};

export const cancelBookingHandler = async (req: Request, res: Response) => {
  const bookingId = Number(req.params.id);
  await cancelBooking(bookingId, (req.user as { UserId: number }).UserId);
  res.json({ ok: true });
};

export const getActiveBookingHandler = async (req: Request, res: Response) => {
  const booking = await bookingRepository.getActiveByUser((req.user as { UserId: number }).UserId);
  res.json({ booking });
};

export const getHistoryHandler = async (req: Request, res: Response) => {
  const history = await bookingRepository.getHistoryByUser((req.user as { UserId: number }).UserId);
  res.json({ history });
};

export const getBookingHandler = async (req: Request, res: Response) => {
  const bookingId = Number(req.params.id);
  const booking = await bookingRepository.getById(bookingId);
  res.json({ booking });
};
