import api from "@/lib/Api";

export type EquipmentType = "truck" | "trailer";

export interface EquipmentOption {
  id: string;
  type: EquipmentType;
  number: string;
  vin: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  status?: string | null;
}

export const equipmentApi = {
  async list(): Promise<EquipmentOption[]> {
    try {
      const [trucksRes, trailersRes] = await Promise.all([
        api.get("/trucks"),
        api.get("/trailers")
      ]);

      const trucksData = trucksRes.data ?? [];
      const trailersData = trailersRes.data ?? [];

      const trucks: EquipmentOption[] = trucksData.map((t: any) => ({
        id: t.id,
        type: "truck",
        number: t.number,
        vin: t.vin,
        year: t.year ?? null,
        make: t.make ?? null,
        model: t.model ?? null,
        status: (t.status || "active").toLowerCase(),
      }));

      const trailers: EquipmentOption[] = trailersData.map((t: any) => ({
        id: t.id,
        type: "trailer",
        number: t.number,
        vin: t.vin,
        year: t.year ?? null,
        make: t.make ?? null,
        model: t.model ?? null,
        status: (t.status || "active").toLowerCase(),
      }));

      const all = [...trucks, ...trailers];

      // Sort by type then number
      all.sort((a, b) => (a.type + a.number).localeCompare(b.type + b.number));
      return all;
    } catch (err) {
      console.error("Error fetching equipment list:", err);
      return [];
    }
  },
  async get(id: string): Promise<EquipmentOption | null> {
    try {
      // Trying trucks first
      const truckRes = await api.get(`/trucks/${id}`).catch(() => null);
      if (truckRes) {
        const t = truckRes.data;
        return {
          id: t.id,
          type: "truck",
          number: t.number,
          vin: t.vin,
          year: t.year ?? null,
          make: t.make ?? null,
          model: t.model ?? null,
          status: (t.status || "active").toLowerCase(),
        };
      }

      const trailerRes = await api.get(`/trailers/${id}`).catch(() => null);
      if (trailerRes) {
        const t = trailerRes.data;
        return {
          id: t.id,
          type: "trailer",
          number: t.number,
          vin: t.vin,
          year: t.year ?? null,
          make: t.make ?? null,
          model: t.model ?? null,
          status: (t.status || "active").toLowerCase(),
        };
      }
      return null;
    } catch (err) {
      console.error("Error fetching equipment by ID:", err);
      return null;
    }
  },
};
