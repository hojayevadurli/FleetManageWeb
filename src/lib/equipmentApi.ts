import api from "@/lib/Api";
import { Equipment, EquipmentDto, EquipmentStatus, EquipmentLifecycleStatus, EquipmentOperationalStatus } from "@/lib/types";

export const mapDtoToEquipment = (dto: EquipmentDto): Equipment => ({
  id: dto.id,
  unitNumber: dto.unitNumber,
  type: dto.equipmentTypeName || 'truck', // Map DTO type name
  make: dto.make || 'Unknown',
  model: dto.model || 'Unknown',
  year: dto.year || new Date().getFullYear(),
  vin: dto.vin,
  serialNumber: dto.serialNumber,
  licensePlate: dto.plateNumber || '',
  status: dto.lifecycleStatus === EquipmentLifecycleStatus.Sold ? EquipmentStatus.SOLD :
    dto.lifecycleStatus === EquipmentLifecycleStatus.Retired ? EquipmentStatus.ARCHIVED :
      dto.operationalStatus === EquipmentOperationalStatus.InShop ? EquipmentStatus.IN_SHOP :
        dto.operationalStatus === EquipmentOperationalStatus.OutOfService ? EquipmentStatus.OUT_OF_SERVICE :
          EquipmentStatus.ACTIVE,
  lastServiceDate: new Date().toISOString(), // This might need a real field if available
  fleetCategoryId: dto.fleetCategoryId,
  fleetCategoryName: dto.fleetCategoryName,
  equipmentTypeId: dto.equipmentTypeId,
  equipmentTypeName: dto.equipmentTypeName,
});

export interface EquipmentCreatePayload extends Partial<Equipment> {
  unitNumber: string;
  equipmentTypeId: string;
  fleetCategoryId: number;
  initialOdometer: number;
  initialHours: number;
  operationalStatus: EquipmentOperationalStatus;
  lifecycleStatus: EquipmentLifecycleStatus;
}

export interface EquipmentUpdatePayload extends Partial<Equipment> { }

export const equipmentApi = {
  // GET /api/equipment
  async list(type?: string): Promise<EquipmentDto[]> {
    const url = type ? `/equipment?type=${encodeURIComponent(type)}` : '/equipment';
    const response = await api.get<EquipmentDto[]>(url);
    return response.data;
  },

  // GET /api/equipment/{id}
  async get(id: string): Promise<Equipment | null> {
    try {
      const response = await api.get<Equipment>(`/equipment/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching equipment ${id}:`, error);
      return null;
    }
  },

  // POST /api/equipment
  async create(payload: EquipmentCreatePayload): Promise<EquipmentDto> {
    const response = await api.post<EquipmentDto>("/equipment", payload);
    return response.data;
  },

  // PUT /api/equipment/{id}
  async update(id: string, payload: EquipmentUpdatePayload): Promise<Equipment> {
    const response = await api.put<Equipment>(`/equipment/${id}`, payload);
    return response.data;
  },

  // DELETE /api/equipment/{id}
  async delete(id: string): Promise<void> {
    await api.delete(`/equipment/${id}`);
  },

  // POST /api/equipment/bulk-delete
  async bulkDelete(ids: string[]): Promise<void> {
    if (!ids.length) return;
    await api.post("/equipment/bulk-delete", { ids });
  }
};

export default equipmentApi;
