import api from "@/lib/Api.temp";

export interface FleetCategory {
    id: number;
    industryId: number;
    industryName: string;
    name: string;
    code: string;
    isActive: boolean;
    listEquipment: boolean;
}

export const fleetCategoriesApi = {
    // GET /api/fleetcategories
    async list(industryId?: number): Promise<FleetCategory[]> {
        const url = industryId ? `/fleetcategories?industryId=${industryId}` : '/fleetcategories';
        const response = await api.get<FleetCategory[]>(url);
        return response.data;
    },

    // GET /api/fleetcategories/{id}
    async get(id: number): Promise<FleetCategory | null> {
        try {
            const response = await api.get<FleetCategory>(`/fleetcategories/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching fleet category ${id}:`, error);
            return null;
        }
    }
};

export default fleetCategoriesApi;
