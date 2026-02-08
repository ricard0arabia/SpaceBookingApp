import { verifyWebhookSignature } from "./paymentService.js";
import { webhookRepository } from "../repositories/webhookRepository.js";
import { paymentRepository } from "../repositories/paymentRepository.js";
import { bookingRepository } from "../repositories/bookingRepository.js";
import { logger } from "../utils/logger.js";
import { emitBookingEvent } from "../socket/emitter.js";

export const processWebhookJob = async ({
  rawBody,
  signature
}: {
  rawBody: string;
  signature?: string;
}) => {
  verifyWebhookSignature(rawBody, signature);
  const payload = JSON.parse(rawBody) as {
    data: { id: string; attributes: { type: string; data: { attributes: { checkout_session_id?: string } } } };
  };
  const eventId = payload.data.id;
  if (await webhookRepository.isProcessed(eventId)) {
    logger.info({ eventId }, "Webhook already processed");
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
        emitBookingEvent("booking:confirmed", { bookingId: payment.BookingId });
      } else if (eventType === "checkout_session.payment.failed") {
        await paymentRepository.updatePaymentStatus(payment.PaymentId, "failed");
        await bookingRepository.updateStatus(payment.BookingId, "EXPIRED", null);
        await bookingRepository.releaseSlots(payment.BookingId);
        emitBookingEvent("booking:expired", { bookingId: payment.BookingId });
      }
    }
  }
  await webhookRepository.markProcessed(eventId, "processed");
};
