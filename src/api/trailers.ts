// src/api/trailers.ts
import { api } from "@/lib/Api";

export type Trailer = {
  id: string;
  number: string;
  vin: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  purchasedAt?: string | null; // ISO string
  type?: string | null;
  length?: number | null;
  weightCapacity?: number | null;
  status?: string | null;
};

export type TrailerPayload = Omit<Trailer, "id">;

// GET /api/trailers
export async function listTrailers(): Promise<Trailer[]> {
  const res = await api.get<Trailer[]>("/trailers");
  return res.data;
}

// POST /api/trailers
export async function createTrailer(payload: TrailerPayload): Promise<Trailer> {
  const res = await api.post<Trailer>("/trailers", payload);
  return res.data;
}

// PUT /api/trailers/{id}
export async function updateTrailer(
  id: string,
  payload: TrailerPayload
): Promise<void> {
  await api.put(`/trailers/${id}`, payload);
}

// DELETE /api/trailers/{id}
export async function deleteTrailer(id: string): Promise<void> {
  await api.delete(`/trailers/${id}`);
}

export async function bulkDeleteTrailers(ids: string[]): Promise<void> {
  await api.post("/trailers/bulk-delete", { trailerIds: ids });
}
