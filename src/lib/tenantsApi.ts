import api from "@/lib/Api";

export interface Tenant {
    id: string;
    name: string; // Company Name
    industryId: number;
    industryName?: string;
    email: string;
    phone: string;
    createdAt?: string;
}

export interface UpdateTenantPayload {
    name: string;
    industryId: number;
    email: string;
    phone: string;
}

export const tenantsApi = {
    // GET /api/tenants/current
    async getCurrent(): Promise<Tenant> {
        const response = await api.get<Tenant>("/tenants/current");
        return response.data;
    },

    // PUT /api/tenants/current
    async updateCurrent(payload: UpdateTenantPayload): Promise<void> {
        await api.put("/tenants/current", payload);
    }
};

export default tenantsApi;
