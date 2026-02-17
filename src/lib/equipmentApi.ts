import api from "@/lib/Api";
import { Equipment, EquipmentDto, EquipmentOperationalStatus, EquipmentDocument, DocumentRole } from "@/lib/types";
import { uploadsApi } from "@/lib/uploadsApi";

export const mapDtoToEquipment = (dto: EquipmentDto): Equipment => {
  return {
    id: dto.id,
    unitNumber: dto.unitNumber,
    type: dto.equipmentTypeName || 'Asset', // Map DTO type name
    make: dto.make || 'Unknown',
    model: dto.model || 'Unknown',
    year: dto.year || new Date().getFullYear(),
    vin: dto.vin,
    serialNumber: dto.serialNumber,
    licensePlate: dto.plateNumber || '',
    status: dto.operationalStatus,
    lastServiceDate: dto.lastServiceDate || undefined,
    fleetCategoryId: dto.fleetCategoryId,
    fleetCategoryName: dto.fleetCategoryName,
    equipmentTypeId: dto.equipmentTypeId,
    equipmentTypeName: dto.equipmentTypeName,
    documents: dto.documents || [],
    mileage: dto.odometerCurrent,
    hours: dto.hoursCurrent,
    assignedOperatorId: dto.assignedOperatorId,
    assignedOperatorName: dto.assignedOperatorName,
    notes: dto.notes,
    acquiredDate: dto.acquiredDate,
    inServiceDate: dto.inServiceDate,
    outOfServiceDate: dto.outOfServiceDate,
  };
};

export interface EquipmentCreatePayload extends Partial<Equipment> {
  unitNumber: string;
  equipmentTypeId: string;
  fleetCategoryId: number;
  initialOdometer: number;
  initialHours: number;
  operationalStatus: EquipmentOperationalStatus;
  plateNumber?: string;
  displayName?: string;
  acquiredDate?: string;
  inServiceDate?: string;
}

export type EquipmentUpdatePayload = Partial<Equipment>;

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
  },

  // POST /api/equipment/{id}/documents
  async uploadDocument(equipmentId: string, formData: FormData): Promise<EquipmentDocument> {
    // 1. Extract file and metadata from FormData
    const file = formData.get('file') as File;
    const docRole = formData.get('docRole') as DocumentRole; // String enum now
    const startDate = formData.get('startDate') as string;
    const expirationDate = formData.get('expirationDate') as string;
    const notes = formData.get('notes') as string;

    if (!file) throw new Error("No file provided");

    // 2. Upload file to storage first
    const fileUrl = await uploadsApi.uploadDocument(file);

    // 3. Create document record in /api/documents
    const docPayload = {
      fileUrl,
      fileType: file.type,
      docKind: equipmentApi.mapRoleToKind(docRole),
      vendorNameRaw: notes || null,
      runAiExtract: false  // Don't run AI for equipment docs
    };

    const docResponse = await api.post<{ id: string }>('/documents', docPayload);
    const documentId = docResponse.data.id;

    // 4. Link document to equipment via /api/equipment/{id}/documents
    const linkPayload = {
      documentId,
      docRole,
      startDate: startDate || null,
      expirationDate: expirationDate || null,
      notes: notes || null
    };

    const response = await api.post<EquipmentDocument>(`/equipment/${equipmentId}/documents`, linkPayload);
    return response.data;
  },

  mapRoleToKind(role: DocumentRole | number): string {
    // Handle string enum values
    if (typeof role === 'string') {
      switch (role) {
        case DocumentRole.Insurance: return 'insurance';
        case DocumentRole.Registration: return 'registration';
        case DocumentRole.Title: return 'title';
        case DocumentRole.Warranty: return 'warranty';
        case DocumentRole.Lease: return 'lease';
        case DocumentRole.DOTInspection: return 'inspection';
        case DocumentRole.ScaleTicket: return 'scale_ticket';
        case DocumentRole.General: return 'general';
        default: return 'other';
      }
    }

    // Legacy number fallback (if any)
    switch (role) {
      case 0: return 'general';
      // Equipment documents (10-16)
      case 10: return 'insurance';
      case 11: return 'registration';
      case 12: return 'title';
      case 13: return 'warranty';
      case 14: return 'lease';
      case 15: return 'inspection';
      case 16: return 'scale_ticket';
      default: return 'other';
    }
  },

  // DELETE /api/equipment/{id}/documents/{documentId}
  async deleteDocument(id: string, documentId: string): Promise<void> {
    await api.delete(`/equipment/${id}/documents/${documentId}`);
  }
};

export default equipmentApi;
