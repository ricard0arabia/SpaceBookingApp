import { TYPES, type Connection } from "tedious";
import { execute, executeTransaction, execSql } from "./db.js";

export type BookingStatus =
  | "HELD"
  | "PENDING_PAYMENT"
  | "PENDING_APPROVAL"
  | "APPROVED_AWAITING_PAYMENT"
  | "CONFIRMED"
  | "DENIED"
  | "EXPIRED"
  | "CANCELLED"
  | "COMPLETED";

export type Booking = {
  BookingId: number;
  UserId: number;
  StartAt: Date;
  EndAt: Date;
  DurationHours: number;
  Status: BookingStatus;
  HoldExpiresAt: Date | null;
  NeedsApproval: boolean;
};

const insertBookingSlots = async (
  connection: Connection,
  bookingId: number,
  slotStarts: Date[],
  slotStatus: BookingStatus
) => {
  for (const slotStart of slotStarts) {
    await execSql(
      connection,
      `INSERT INTO BookingSlots (BookingId, SlotStartAt, SlotStatus)
       VALUES (@BookingId, @SlotStartAt, @SlotStatus)`,
      [
        { name: "BookingId", type: TYPES.Int, value: bookingId },
        { name: "SlotStartAt", type: TYPES.DateTime2, value: slotStart },
        { name: "SlotStatus", type: TYPES.NVarChar, value: slotStatus }
      ]
    );
  }
};

const createBooking = async ({
  userId,
  startAt,
  endAt,
  durationHours,
  status,
  holdExpiresAt,
  needsApproval,
  slotStarts
}: {
  userId: number;
  startAt: Date;
  endAt: Date;
  durationHours: number;
  status: BookingStatus;
  holdExpiresAt: Date | null;
  needsApproval: boolean;
  slotStarts: Date[];
}) =>
  executeTransaction(async (connection) => {
    const rows = await execSql<{ BookingId: number }>(
      connection,
      `INSERT INTO Bookings (UserId, StartAt, EndAt, DurationHours, Status, HoldExpiresAt, NeedsApproval)
       OUTPUT INSERTED.BookingId
       VALUES (@UserId, @StartAt, @EndAt, @DurationHours, @Status, @HoldExpiresAt, @NeedsApproval)`,
      [
        { name: "UserId", type: TYPES.Int, value: userId },
        { name: "StartAt", type: TYPES.DateTime2, value: startAt },
        { name: "EndAt", type: TYPES.DateTime2, value: endAt },
        { name: "DurationHours", type: TYPES.Int, value: durationHours },
        { name: "Status", type: TYPES.NVarChar, value: status },
        { name: "HoldExpiresAt", type: TYPES.DateTime2, value: holdExpiresAt },
        { name: "NeedsApproval", type: TYPES.Bit, value: needsApproval }
      ]
    );
    const bookingId = rows[0].BookingId;
    await insertBookingSlots(connection, bookingId, slotStarts, status);
    return bookingId;
  });

const getActiveByUser = async (userId: number) => {
  const rows = await execute<Booking>(
    `SELECT TOP 1 * FROM Bookings
     WHERE UserId = @UserId
     AND Status IN ('HELD','PENDING_PAYMENT','PENDING_APPROVAL','APPROVED_AWAITING_PAYMENT','CONFIRMED')
     ORDER BY CreatedAt DESC`,
    [{ name: "UserId", type: TYPES.Int, value: userId }]
  );
  return rows[0] ?? null;
};

const getHistoryByUser = async (userId: number) =>
  execute<Booking>(
    `SELECT * FROM Bookings WHERE UserId = @UserId ORDER BY CreatedAt DESC`,
    [{ name: "UserId", type: TYPES.Int, value: userId }]
  );

const listAll = async () =>
  execute<Booking>(`SELECT * FROM Bookings ORDER BY CreatedAt DESC`);

const getById = async (bookingId: number) => {
  const rows = await execute<Booking>(
    `SELECT * FROM Bookings WHERE BookingId = @BookingId`,
    [{ name: "BookingId", type: TYPES.Int, value: bookingId }]
  );
  return rows[0] ?? null;
};

const updateStatus = async (bookingId: number, status: BookingStatus, holdExpiresAt: Date | null) =>
  execute(
    `UPDATE Bookings
     SET Status = @Status, HoldExpiresAt = @HoldExpiresAt, UpdatedAt = SYSUTCDATETIME()
     WHERE BookingId = @BookingId`,
    [
      { name: "Status", type: TYPES.NVarChar, value: status },
      { name: "HoldExpiresAt", type: TYPES.DateTime2, value: holdExpiresAt },
      { name: "BookingId", type: TYPES.Int, value: bookingId }
    ]
  );

const releaseSlots = async (bookingId: number) =>
  execute(
    `DELETE FROM BookingSlots WHERE BookingId = @BookingId`,
    [{ name: "BookingId", type: TYPES.Int, value: bookingId }]
  );

const updateSlotsStatus = async (bookingId: number, status: BookingStatus) =>
  execute(
    `UPDATE BookingSlots
     SET SlotStatus = @Status
     WHERE BookingId = @BookingId`,
    [
      { name: "Status", type: TYPES.NVarChar, value: status },
      { name: "BookingId", type: TYPES.Int, value: bookingId }
    ]
  );

const updateBookingTimes = async ({
  bookingId,
  newStartAt,
  newEndAt,
  slotStarts,
  actorUserId,
  actorRole,
  reason
}: {
  bookingId: number;
  newStartAt: Date;
  newEndAt: Date;
  slotStarts: Date[];
  actorUserId: number;
  actorRole: "Admin" | "Client";
  reason: string | null;
}) =>
  executeTransaction(async (connection) => {
    const bookingRows = await execSql<Booking>(
      connection,
      `SELECT * FROM Bookings WHERE BookingId = @BookingId`,
      [{ name: "BookingId", type: TYPES.Int, value: bookingId }]
    );
    const booking = bookingRows[0];
    if (!booking) {
      throw new Error("Booking not found");
    }

    await execSql(
      connection,
      `INSERT INTO BookingEdits
       (BookingId, ActorUserId, ActorRole, Reason, OldStartAt, OldEndAt, NewStartAt, NewEndAt, OldStatus, NewStatus, RequiresApproval)
       VALUES (@BookingId, @ActorUserId, @ActorRole, @Reason, @OldStartAt, @OldEndAt, @NewStartAt, @NewEndAt, @OldStatus, @NewStatus, @RequiresApproval)`,
      [
        { name: "BookingId", type: TYPES.Int, value: bookingId },
        { name: "ActorUserId", type: TYPES.Int, value: actorUserId },
        { name: "ActorRole", type: TYPES.NVarChar, value: actorRole },
        { name: "Reason", type: TYPES.NVarChar, value: reason },
        { name: "OldStartAt", type: TYPES.DateTime2, value: booking.StartAt },
        { name: "OldEndAt", type: TYPES.DateTime2, value: booking.EndAt },
        { name: "NewStartAt", type: TYPES.DateTime2, value: newStartAt },
        { name: "NewEndAt", type: TYPES.DateTime2, value: newEndAt },
        { name: "OldStatus", type: TYPES.NVarChar, value: booking.Status },
        { name: "NewStatus", type: TYPES.NVarChar, value: booking.Status },
        { name: "RequiresApproval", type: TYPES.Bit, value: booking.NeedsApproval }
      ]
    );

    await execSql(
      connection,
      `UPDATE Bookings
       SET StartAt = @StartAt, EndAt = @EndAt, UpdatedAt = SYSUTCDATETIME()
       WHERE BookingId = @BookingId`,
      [
        { name: "StartAt", type: TYPES.DateTime2, value: newStartAt },
        { name: "EndAt", type: TYPES.DateTime2, value: newEndAt },
        { name: "BookingId", type: TYPES.Int, value: bookingId }
      ]
    );

    await execSql(
      connection,
      `DELETE FROM BookingSlots WHERE BookingId = @BookingId`,
      [{ name: "BookingId", type: TYPES.Int, value: bookingId }]
    );
    await insertBookingSlots(connection, bookingId, slotStarts, booking.Status);
  });

const listCalendarEvents = async (start: Date, end: Date) =>
  execute<{
    BookingId: number;
    StartAt: Date;
    EndAt: Date;
    Status: BookingStatus;
  }>(
    `SELECT BookingId, StartAt, EndAt, Status
     FROM Bookings
     WHERE StartAt < @End AND EndAt > @Start
     AND Status IN ('HELD','PENDING_APPROVAL','CONFIRMED')`,
    [
      { name: "Start", type: TYPES.DateTime2, value: start },
      { name: "End", type: TYPES.DateTime2, value: end }
    ]
  );

const listBlocks = async (start: Date, end: Date) =>
  execute<{
    BlockId: number;
    StartAt: Date;
    EndAt: Date;
    Reason: string | null;
  }>(
    `SELECT BlockId, StartAt, EndAt, Reason
     FROM Blocks
     WHERE StartAt < @End AND EndAt > @Start`,
    [
      { name: "Start", type: TYPES.DateTime2, value: start },
      { name: "End", type: TYPES.DateTime2, value: end }
    ]
  );

export const bookingRepository = {
  createBooking,
  getActiveByUser,
  getHistoryByUser,
  listAll,
  getById,
  updateStatus,
  releaseSlots,
  updateSlotsStatus,
  updateBookingTimes,
  listCalendarEvents,
  listBlocks
};
