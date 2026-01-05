import api from "@/lib/Api";

export interface Industry {
    id: string;
    name: string;
}

export const industriesApi = {
    // GET /api/industries
    async list(): Promise<Industry[]> {
        try {
            const response = await api.get<any[]>("/industries");
            // Map response to handle potential PascalCase from API and ensure string types
            return response.data.map(item => ({
                id: String(item.id || item.Id || "").trim(),
                name: String(item.name || item.Name || "").trim()
            })).filter(i => i.id && i.name); // Filter out invalid items
        } catch (error) {
            console.error("Error fetching industries:", error);
            return [];
        }
    }
};
