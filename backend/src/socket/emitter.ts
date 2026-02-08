import { getIo } from "./server.js";

export const emitBookingEvent = (event: string, payload: Record<string, unknown>) => {
  const io = getIo();
  if (!io) return;
  io.to("room:court:1").emit(event, payload);
};

export const emitBlockEvent = (event: string, payload: Record<string, unknown>) => {
  const io = getIo();
  if (!io) return;
  io.to("room:court:1").emit(event, payload);
};
