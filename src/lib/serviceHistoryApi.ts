import api from "@/lib/Api";
import { ServiceHistory, ServiceHistoryUpsertDto } from "@/lib/types";

export const serviceHistoryApi = {
  // GET /api/service-history
  async list(equipmentId?: string): Promise<ServiceHistory[]> {
    const params = equipmentId ? { equipmentId } : {};
    const response = await api.get<ServiceHistory[]>("/service-history", { params });
    return response.data;
  },

  // POST /api/service-history
  async create(dto: ServiceHistoryUpsertDto): Promise<string> {
    const response = await api.post<string>("/service-history", dto);
    return response.data; // Returns Guid Id
  },

  // PUT /api/service-history/{id}
  async update(id: string, dto: ServiceHistoryUpsertDto): Promise<void> {
    await api.put(`/service-history/${id}`, dto);
  },

  // DELETE /api/service-history/{id}
  async delete(id: string): Promise<void> {
    await api.delete(`/service-history/${id}`);
  }
};

export default serviceHistoryApi;
