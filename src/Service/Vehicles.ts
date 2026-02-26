
import api from "@/lib/Api";
export type Vehicle = { id: string; unitNumber: string; make: string; model: string; year: number; odometerMiles: number };

export const listVehicles = async () => (await api.get<Vehicle[]>("/api/vehicles")).data;
export const createVehicle = async (v: Partial<Vehicle>) => (await api.post<Vehicle>("/api/vehicles", v)).data;
export const updateVehicle = async (id: string, v: Partial<Vehicle>) => (await api.put<Vehicle>(`/api/vehicles/${id}`, v)).data;
export const deleteVehicle = async (id: string) => (await api.delete(`/api/vehicles/${id}`)).data;
