import { TYPES } from "tedious";
import { execute } from "./db.js";

export type PaymentStatus =
  | "created"
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "refunded";

const createPayment = async ({
  bookingId,
  provider,
  checkoutSessionId,
  status,
  amount,
  currency
}: {
  bookingId: number;
  provider: string;
  checkoutSessionId: string | null;
  status: PaymentStatus;
  amount: number;
  currency: string;
}) => {
  const rows = await execute<{ PaymentId: number }>(
    `INSERT INTO Payments (BookingId, Provider, CheckoutSessionId, PaymentStatus, Amount, Currency)
     OUTPUT INSERTED.PaymentId
     VALUES (@BookingId, @Provider, @CheckoutSessionId, @PaymentStatus, @Amount, @Currency)`,
    [
      { name: "BookingId", type: TYPES.Int, value: bookingId },
      { name: "Provider", type: TYPES.NVarChar, value: provider },
      { name: "CheckoutSessionId", type: TYPES.NVarChar, value: checkoutSessionId },
      { name: "PaymentStatus", type: TYPES.NVarChar, value: status },
      { name: "Amount", type: TYPES.Int, value: amount },
      { name: "Currency", type: TYPES.NVarChar, value: currency }
    ]
  );
  return rows[0].PaymentId;
};

const updatePaymentStatus = async (paymentId: number, status: PaymentStatus) =>
  execute(
    `UPDATE Payments
     SET PaymentStatus = @Status, UpdatedAt = SYSUTCDATETIME()
     WHERE PaymentId = @PaymentId`,
    [
      { name: "Status", type: TYPES.NVarChar, value: status },
      { name: "PaymentId", type: TYPES.Int, value: paymentId }
    ]
  );

const findByCheckoutSession = async (checkoutSessionId: string) => {
  const rows = await execute<{
    PaymentId: number;
    BookingId: number;
    PaymentStatus: PaymentStatus;
  }>(
    `SELECT PaymentId, BookingId, PaymentStatus
     FROM Payments
     WHERE CheckoutSessionId = @CheckoutSessionId`,
    [{ name: "CheckoutSessionId", type: TYPES.NVarChar, value: checkoutSessionId }]
  );
  return rows[0] ?? null;
};

export const paymentRepository = {
  createPayment,
  updatePaymentStatus,
  findByCheckoutSession
};
