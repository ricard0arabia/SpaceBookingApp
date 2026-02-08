import { TYPES } from "tedious";
import { execute } from "./db.js";

const isProcessed = async (eventId: string) => {
  const rows = await execute<{ EventId: string }>(
    "SELECT EventId FROM WebhookEvents WHERE EventId = @EventId",
    [{ name: "EventId", type: TYPES.NVarChar, value: eventId }]
  );
  return Boolean(rows[0]);
};

const recordEvent = async (eventId: string, provider: string, rawJson: string) =>
  execute(
    `INSERT INTO WebhookEvents (EventId, Provider, RawJson, ProcessingStatus)
     VALUES (@EventId, @Provider, @RawJson, 'received')`,
    [
      { name: "EventId", type: TYPES.NVarChar, value: eventId },
      { name: "Provider", type: TYPES.NVarChar, value: provider },
      { name: "RawJson", type: TYPES.NVarChar, value: rawJson }
    ]
  );

const markProcessed = async (eventId: string, status: string) =>
  execute(
    `UPDATE WebhookEvents
     SET ProcessingStatus = @Status, ProcessedAt = SYSUTCDATETIME()
     WHERE EventId = @EventId`,
    [
      { name: "Status", type: TYPES.NVarChar, value: status },
      { name: "EventId", type: TYPES.NVarChar, value: eventId }
    ]
  );

export const webhookRepository = {
  isProcessed,
  recordEvent,
  markProcessed
};
