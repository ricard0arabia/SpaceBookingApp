import type { Request, Response } from "express";
import { verifyWebhookSignature } from "../services/paymentService.js";
import { webhookRepository } from "../repositories/webhookRepository.js";
import { paymentRepository } from "../repositories/paymentRepository.js";
import { bookingRepository } from "../repositories/bookingRepository.js";

export const paymongoWebhook = async (req: Request, res: Response) => {
  const rawBody = req.body as string;
  verifyWebhookSignature(rawBody, req.headers["paymongo-signature"] as string | undefined);
  const payload = JSON.parse(rawBody) as {
    data: { id: string; attributes: { type: string; data: { attributes: { checkout_session_id?: string } } } };
  };
  const eventId = payload.data.id;
  if (await webhookRepository.isProcessed(eventId)) {
    res.json({ ok: true });
    return;
  }
  await webhookRepository.recordEvent(eventId, "paymongo", rawBody);

  const eventType = payload.data.attributes.type;
  const checkoutSessionId = payload.data.attributes.data.attributes.checkout_session_id;
  if (checkoutSessionId) {
    const payment = await paymentRepository.findByCheckoutSession(checkoutSessionId);
    if (payment) {
      if (eventType === "checkout_session.payment.paid") {
        await paymentRepository.updatePaymentStatus(payment.PaymentId, "paid");
        await bookingRepository.updateStatus(payment.BookingId, "CONFIRMED", null);
        await bookingRepository.updateSlotsStatus(payment.BookingId, "CONFIRMED");
        await webhookRepository.markProcessed(eventId, "processed");
      } else if (eventType === "checkout_session.payment.failed") {
        await paymentRepository.updatePaymentStatus(payment.PaymentId, "failed");
        await bookingRepository.updateStatus(payment.BookingId, "EXPIRED", null);
        await bookingRepository.releaseSlots(payment.BookingId);
        await webhookRepository.markProcessed(eventId, "processed");
      }
    }
  }

  res.json({ ok: true });
};
