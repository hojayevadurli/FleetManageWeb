import api from "@/lib/Api";

export interface FuelRecordDto {
  id: string;
  equipmentId: string;
  assetNumber: string;
  date: string;
  vendorName: string;
  vendorAddress?: string;
  fuelType: string;
  gallons: number;
  unitPrice: number;
  totalAmount: number;
  odometer?: number;
  state?: string;
  documentUrl?: string;
  documentFileName?: string;
  notes?: string;
  createdAt: string;
}

export interface FuelUpsertDto {
  assetId: string;
  assetType?: string;
  date: string;
  vendorName: string;
  vendorAddress?: string;
  fuelType: string;
  gallons: number;
  unitPrice: number;
  totalAmount: number;
  odometer?: number;
  state?: string;
  documentUrl?: string;
  documentFileName?: string;
  notes?: string;
}

// Keep backwards-compat alias used by FuelManager
export type FuelDto = FuelRecordDto & { assetId: string };

export const FUEL_TYPES = ["Diesel", "Gasoline", "DEF", "E85", "CNG", "LNG", "Electric"];

export const fuelApi = {
  list: (params?: { assetId?: string; page?: number; pageSize?: number }) =>
    api.get<FuelRecordDto[]>("/fuel", { params }).then(r => r.data),

  get: (id: string) =>
    api.get<FuelRecordDto>(`/fuel/${id}`).then(r => r.data),

  create: (dto: FuelUpsertDto) =>
    api.post<FuelRecordDto>("/fuel", dto).then(r => r.data),

  update: (id: string, dto: Partial<FuelUpsertDto>) =>
    api.put<FuelRecordDto>(`/fuel/${id}`, dto).then(r => r.data),

  remove: (id: string) =>
    api.delete(`/fuel/${id}`).then(() => undefined),
};
