import { httpClient } from "./httpClient";

export const AdminRepository = {
  async listBlocks() {
    const { data } = await httpClient.get("/api/admin/blocks");
    return data.blocks;
  },
  async createBlock(startAt: string, endAt: string, reason?: string) {
    const { data } = await httpClient.post("/api/admin/blocks", { startAt, endAt, reason });
    return data;
  },
  async deleteBlock(blockId: number) {
    const { data } = await httpClient.delete(`/api/admin/blocks/${blockId}`);
    return data;
  }
};
