import api from "@/lib/Api";

export interface TollPlaza {
  name?: string;
  road?: string;
  state?: string;
  direction?: string;
  costCash: number;
  costEzPass?: number;
}

export interface TollRecord {
  id: string;
  equipmentId: string;
  unitNumber: string;
  tripDate: string;
  originAddress?: string;
  destinationAddress?: string;
  routeDescription?: string;
  vehicleType: string;
  totalCostCash: number;
  totalCostEzPass?: number;
  currency: string;
  distanceMiles?: number;
  tollPlazaCount?: number;
  tollPlazas?: TollPlaza[];
  notes?: string;
  source: "calculated" | "manual";
  createdAt: string;
}

export interface TollUnitSummary {
  equipmentId: string;
  unitNumber: string;
  totalCostCash: number;
  totalCostEzPass?: number;
  tripCount: number;
  totalDistanceMiles?: number;
}

export interface TollSummary {
  totalCostCash: number;
  totalCostEzPass?: number;
  tripCount: number;
  totalDistanceMiles?: number;
  byUnit: TollUnitSummary[];
}

export interface TollCalculateRequest {
  equipmentId: string;
  originAddress: string;
  destinationAddress: string;
  vehicleType: string;
  tripDate?: string;
  notes?: string;
}

export interface TollManualEntry {
  equipmentId: string;
  originAddress?: string;
  destinationAddress?: string;
  routeDescription?: string;
  vehicleType: string;
  tripDate: string;
  totalCostCash: number;
  totalCostEzPass?: number;
  distanceMiles?: number;
  notes?: string;
}

export const VEHICLE_TYPES = [
  { value: "2AxlesTruck",  label: "2-Axle Truck" },
  { value: "3AxlesTruck",  label: "3-Axle Truck" },
  { value: "4AxlesTruck",  label: "4-Axle Truck" },
  { value: "5AxlesTruck",  label: "5-Axle Truck (18-Wheeler)" },
  { value: "6AxlesTruck",  label: "6-Axle Truck" },
  { value: "2AxlesAuto",   label: "2-Axle Vehicle (Car)" },
  { value: "3AxlesAuto",   label: "3-Axle Vehicle" },
];

export const tollsApi = {
  async calculate(req: TollCalculateRequest): Promise<TollRecord> {
    const res = await api.post<TollRecord>("/tolls/calculate", req);
    return res.data;
  },

  async manual(req: TollManualEntry): Promise<TollRecord> {
    const res = await api.post<TollRecord>("/tolls/manual", req);
    return res.data;
  },

  async getByEquipment(equipmentId: string, page = 1, pageSize = 20): Promise<TollRecord[]> {
    const res = await api.get<TollRecord[]>(`/tolls/equipment/${equipmentId}`, {
      params: { page, pageSize },
    });
    return res.data;
  },

  async getSummary(days = 30): Promise<TollSummary> {
    const res = await api.get<TollSummary>("/tolls/summary", { params: { days } });
    return res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/tolls/${id}`);
  },
};
