-- Ensure auth indexes
IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = 'UX_Users_Username'
)
BEGIN
  CREATE UNIQUE INDEX UX_Users_Username
    ON Users(Username)
    WHERE Username IS NOT NULL;
END

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = 'UX_Users_Phone'
)
BEGIN
  CREATE UNIQUE INDEX UX_Users_Phone
    ON Users(Phone)
    WHERE Phone IS NOT NULL;
END

IF NOT EXISTS (
  SELECT 1 FROM sys.indexes WHERE name = 'UX_AuthProviders_Provider'
)
BEGIN
  CREATE UNIQUE INDEX UX_AuthProviders_Provider
    ON AuthProviders(ProviderType, ProviderSubject);
END

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
  SELECT 1
  FROM sys.key_constraints
  WHERE [type] = 'PK'
    AND parent_object_id = OBJECT_ID('WebhookEvents')
)
BEGIN
  ALTER TABLE WebhookEvents
    ADD CONSTRAINT PK_WebhookEvents PRIMARY KEY (EventId);
END
