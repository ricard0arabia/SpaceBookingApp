import type { Request, Response } from "express";
import { approveBooking, denyBooking, createBlock, listBlocks, deleteBlock, editBookingTime } from "../services/adminService.js";
import { bookingRepository } from "../repositories/bookingRepository.js";

export const listBookings = async (_req: Request, res: Response) => {
  const bookings = await bookingRepository.listAll();
  res.json({ bookings });
};

export const approveBookingHandler = async (req: Request, res: Response) => {
  await approveBooking(Number(req.params.id));
  res.json({ ok: true });
};

export const denyBookingHandler = async (req: Request, res: Response) => {
  await denyBooking(Number(req.params.id));
  res.json({ ok: true });
};

export const createBlockHandler = async (req: Request, res: Response) => {
  const { startAt, endAt, reason } = req.body as { startAt: string; endAt: string; reason?: string };
  await createBlock({
    startAt,
    endAt,
    reason: reason ?? null,
    adminId: (req.user as { UserId: number }).UserId
  });
  res.json({ ok: true });
};

export const listBlocksHandler = async (_req: Request, res: Response) => {
  const blocks = await listBlocks();
  res.json({ blocks });
};

export const deleteBlockHandler = async (req: Request, res: Response) => {
  await deleteBlock(Number(req.params.id));
  res.json({ ok: true });
};

export const editBookingHandler = async (req: Request, res: Response) => {
  const { newStartAt, newEndAt, reason } = req.body as {
    newStartAt: string;
    newEndAt: string;
    reason?: string;
  };
  const result = await editBookingTime({
    bookingId: Number(req.params.id),
    newStartAt,
    newEndAt,
    adminId: (req.user as { UserId: number }).UserId,
    reason: reason ?? null
  });
  res.json(result);
};
