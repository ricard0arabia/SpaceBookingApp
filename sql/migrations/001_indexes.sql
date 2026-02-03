-- Ensure unique active slots and active booking per user
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = 'UX_BookingSlots_SlotStartAt_Active'
)
BEGIN
  CREATE UNIQUE INDEX UX_BookingSlots_SlotStartAt_Active
    ON BookingSlots(SlotStartAt)
    WHERE SlotStatus IN (
      'HELD',
      'PENDING_PAYMENT',
      'PENDING_APPROVAL',
      'APPROVED_AWAITING_PAYMENT',
      'CONFIRMED'
    );
END

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = 'UX_Bookings_User_Active'
)
BEGIN
  CREATE UNIQUE INDEX UX_Bookings_User_Active
    ON Bookings(UserId)
    WHERE Status IN (
      'HELD',
      'PENDING_PAYMENT',
      'PENDING_APPROVAL',
      'APPROVED_AWAITING_PAYMENT',
      'CONFIRMED'
    );
END

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = 'PK_WebhookEvents'
)
BEGIN
  ALTER TABLE WebhookEvents
    ADD CONSTRAINT PK_WebhookEvents PRIMARY KEY (EventId);
END
