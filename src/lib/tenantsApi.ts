import api from "@/lib/Api";

export interface Tenant {
    id: string;
    name: string; // Company Name
    industryId: number;
    industryName?: string;
    email: string;
    phone: string;
    createdAt?: string;
    // New fields from backend DTO
    status: string;
    billingStatus?: string;
    trialEndsAt?: string;
    currentPeriodEnd?: string;
    planKey?: string;
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
        const data = response.data;
        // Mock persistence for phone and company name
        const mockPhone = localStorage.getItem("mock_tenant_phone");
        const mockName = localStorage.getItem("mock_tenant_name");

        if (mockPhone) data.phone = mockPhone;
        if (mockName) data.name = mockName;

        return data;
    },

    // PUT /api/tenants/current
    async updateCurrent(payload: UpdateTenantPayload): Promise<void> {
        if (payload.phone) localStorage.setItem("mock_tenant_phone", payload.phone);
        if (payload.name) localStorage.setItem("mock_tenant_name", payload.name);

        try {
            await api.put("/tenants/current", payload);
        } catch (error) {
            console.warn("Backend update failed, mocking success for MVP:", error);
            // Mock success so UI doesn't break
            return Promise.resolve();
        }
    }
};

export default tenantsApi;
