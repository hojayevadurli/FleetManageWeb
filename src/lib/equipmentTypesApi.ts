import api from "@/lib/Api";
import { EquipmentTypeDto } from "./types";

export const equipmentTypesApi = {
    // GET /api/equipment-types
    async list(industryId?: number, fleetCategoryId?: number): Promise<EquipmentTypeDto[]> {
        const params = new URLSearchParams();
        if (industryId) params.append("industryId", industryId.toString());
        if (fleetCategoryId) params.append("fleetCategoryId", fleetCategoryId.toString());

        const response = await api.get<EquipmentTypeDto[]>(`/equipment-types?${params.toString()}`);
        return response.data;
    }
};

export default equipmentTypesApi;
