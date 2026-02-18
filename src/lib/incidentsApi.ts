import api from "@/lib/Api";
import { OperatorIncident, CreateIncidentDto, UpdateIncidentDto, IncidentType } from "@/lib/types";

export const incidentsApi = {
    // GET /api/incidents
    async list(operatorId?: string, type?: IncidentType): Promise<OperatorIncident[]> {
        let url = '/incidents?';
        if (operatorId) url += `operatorId=${operatorId}&`;
        if (type) url += `type=${type}&`;

        const response = await api.get<OperatorIncident[]>(url);
        return response.data;
    },

    // GET /api/incidents/{id}
    async get(id: string): Promise<OperatorIncident> {
        const response = await api.get<OperatorIncident>(`/incidents/${id}`);
        return response.data;
    },

    // POST /api/incidents
    async create(payload: CreateIncidentDto): Promise<OperatorIncident> {
        const response = await api.post<OperatorIncident>("/incidents", payload);
        return response.data;
    },

    // PUT /api/incidents/{id}
    async update(id: string, payload: UpdateIncidentDto): Promise<void> {
        await api.put(`/incidents/${id}`, payload);
    },

    // DELETE /api/incidents/{id}
    async delete(id: string): Promise<void> {
        await api.delete(`/incidents/${id}`);
    }
};
