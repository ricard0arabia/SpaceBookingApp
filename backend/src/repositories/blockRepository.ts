import { TYPES } from "tedious";
import { execute } from "./db.js";

const listBlocks = async () =>
  execute(
    `SELECT BlockId, StartAt, EndAt, Reason, CreatedByAdminId
     FROM Blocks ORDER BY StartAt DESC`
  );

const createBlock = async ({
  startAt,
  endAt,
  reason,
  adminId
}: {
  startAt: Date;
  endAt: Date;
  reason: string | null;
  adminId: number;
}) =>
  execute(
    `INSERT INTO Blocks (StartAt, EndAt, Reason, CreatedByAdminId)
     VALUES (@StartAt, @EndAt, @Reason, @AdminId)`,
    [
      { name: "StartAt", type: TYPES.DateTime2, value: startAt },
      { name: "EndAt", type: TYPES.DateTime2, value: endAt },
      { name: "Reason", type: TYPES.NVarChar, value: reason },
      { name: "AdminId", type: TYPES.Int, value: adminId }
    ]
  );

const deleteBlock = async (blockId: number) =>
  execute(
    `DELETE FROM Blocks WHERE BlockId = @BlockId`,
    [{ name: "BlockId", type: TYPES.Int, value: blockId }]
  );

export const blockRepository = {
  listBlocks,
  createBlock,
  deleteBlock
};
