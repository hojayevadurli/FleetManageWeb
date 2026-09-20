import api from "@/lib/Api";

export interface TruckOwner {
  id: string;
  companyName: string;
  mcNumber?: string;
  dotNumber?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface TruckOwnerUpsert {
  companyName: string;
  mcNumber?: string;
  dotNumber?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  isActive: boolean;
}

export const truckOwnersApi = {
  list: (params?: { search?: string; activeOnly?: boolean }) =>
    api.get<TruckOwner[]>("/truck-owners", { params }).then(r => r.data),

  get: (id: string) =>
    api.get<TruckOwner>(`/truck-owners/${id}`).then(r => r.data),

  create: (dto: TruckOwnerUpsert) =>
    api.post<TruckOwner>("/truck-owners", dto).then(r => r.data),

  update: (id: string, dto: TruckOwnerUpsert) =>
    api.put<TruckOwner>(`/truck-owners/${id}`, dto).then(r => r.data),

  remove: (id: string) =>
    api.delete(`/truck-owners/${id}`).then(() => undefined),
};
