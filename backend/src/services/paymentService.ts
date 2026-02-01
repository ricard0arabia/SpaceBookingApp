import crypto from "crypto";
import fetch from "node-fetch";
import { paymentRepository } from "../repositories/paymentRepository.js";

const PAYMONGO_BASE = "https://api.paymongo.com/v1";

const getAuthHeader = () => {
  const secret = process.env.PAYMONGO_SECRET_KEY ?? "";
  const token = Buffer.from(secret + ":").toString("base64");
  return `Basic ${token}`;
};

export const createCheckoutSession = async ({
  bookingId,
  amount,
  successUrl,
  cancelUrl
}: {
  bookingId: number;
  amount: number;
  successUrl: string;
  cancelUrl: string;
}) => {
  const response = await fetch(`${PAYMONGO_BASE}/checkout_sessions`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      data: {
        attributes: {
          send_email_receipt: false,
          line_items: [
            {
              name: "Basketball Court Reservation",
              amount,
              currency: "PHP",
              quantity: 1
            }
          ],
          payment_method_types: ["gcash"],
          success_url: successUrl,
          cancel_url: cancelUrl
        }
      }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayMongo error: ${text}`);
  }
  const payload = (await response.json()) as {
    data: { id: string; attributes: { checkout_url: string } };
  };
  const checkoutSessionId = payload.data.id;
  await paymentRepository.createPayment({
    bookingId,
    provider: "paymongo",
    checkoutSessionId,
    status: "pending",
    amount,
    currency: "PHP"
  });

  return payload.data.attributes.checkout_url;
};

export const verifyWebhookSignature = (rawBody: string, signatureHeader: string | undefined) => {
  if (!signatureHeader) {
    throw new Error("Missing PayMongo signature header");
  }
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET ?? "";
  const parts = signatureHeader.split(",").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=");
    acc[key] = value;
    return acc;
  }, {});
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) {
    throw new Error("Invalid PayMongo signature header");
  }
  const payload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error("Signature mismatch");
  }
  return true;
};
