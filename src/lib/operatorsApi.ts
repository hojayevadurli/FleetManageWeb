import axios from 'axios';
import {
    OperatorDto,
    CreateOperatorDto,
    UpdateOperatorDto,
    OperatorDocumentDto,
    AddOperatorAttachmentDto,
    AssignmentDto,
    CreateAssignmentDto,
    EndAssignmentDto,
    OperatorContract,
    CreateOperatorContractDto,
    UpdateOperatorContractDto,
    EmploymentType,
    OperatorSpendSummaryDto
} from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
});

// Interceptor to add auth token if needed (assuming standard pattern)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const operatorsApi = {
    // List Operators
    getAll: async (page = 1, pageSize = 25, search?: string) => {
        const params: any = { page, pageSize };
        if (search) params.search = search;

        const response = await api.get<OperatorDto[]>('/operators', { params });
        return response.data;
    },

    // Get Single Operator
    getById: async (id: string) => {
        const response = await api.get<OperatorDto>(`/operators/${id}`);
        return response.data;
    },

    // Create Operator
    create: async (data: CreateOperatorDto) => {
        try {
            const response = await api.post<OperatorDto>('/operators', data);
            return response.data;
        } catch (error: any) {
            console.error("Create Operator Failed:", error.response?.data || error.message);
            throw error;
        }
    },

    // Update Operator
    update: async (id: string, data: UpdateOperatorDto) => {
        const response = await api.put(`/operators/${id}`, data);
        return response.data;
    },

    // Delete Operator (soft delete)
    delete: async (id: string) => {
        console.log('Deleting operator with ID:', id);
        console.log('DELETE URL:', `/operators/${id}`);
        const response = await api.delete(`/operators/${id}`);
        console.log('Delete response:', response);
        return response;
    },

    // Get Attachments
    getAttachments: async (id: string) => {
        const response = await api.get<OperatorDocumentDto[]>(`/operators/${id}/attachments`);
        return response.data;
    },

    // Attach Document
    attachDocument: async (id: string, data: AddOperatorAttachmentDto) => {
        const response = await api.post<OperatorDocumentDto>(`/operators/${id}/attachments`, data);
        return response.data;
    },

    // Detach Document
    detachDocument: async (id: string, documentId: string) => {
        await api.delete(`/operators/${id}/attachments/${documentId}`);
    },

    // Get Equipment Assignments
    getAssignments: async (id: string) => {
        const response = await api.get<AssignmentDto[]>(`/operators/${id}/assignments`);
        return response.data;
    },

    // Create Equipment Assignment
    assignEquipment: async (id: string, data: CreateAssignmentDto) => {
        const response = await api.post<AssignmentDto>(`/operators/${id}/assignments`, data);
        return response.data;
    },

    // End Equipment Assignment
    endAssignment: async (id: string, assignmentId: string, data: EndAssignmentDto) => {
        const response = await api.put(`/operators/${id}/assignments/${assignmentId}/end`, data);
        return response.data;
    },

    // Delete Equipment Assignment
    deleteAssignment: async (id: string, assignmentId: string) => {
        await api.delete(`/operators/${id}/assignments/${assignmentId}`);
    },

    // Contracts
    getEmploymentTypes: async () => {
        const response = await api.get<EmploymentType[]>('/operators/employment-types');
        return response.data;
    },

    getContracts: async (id: string) => {
        const response = await api.get<OperatorContract[]>(`/operators/${id}/contracts`);
        return response.data;
    },

    createContract: async (id: string, data: CreateOperatorContractDto) => {
        const response = await api.post<OperatorContract>(`/operators/${id}/contracts`, data);
        return response.data;
    },

    updateContract: async (id: string, contractId: string, data: UpdateOperatorContractDto) => {
        const response = await api.put<OperatorContract>(`/operators/${id}/contracts/${contractId}`, data);
        return response.data;
    },

    deleteContract: async (id: string, contractId: string) => {
        await api.delete(`/operators/${id}/contracts/${contractId}`);
    },

    // Spend Analysis
    getSpend: async (id: string, startDate?: string, endDate?: string) => {
        const params: any = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const response = await api.get<OperatorSpendSummaryDto>(`/operators/${id}/spend`, { params });
        return response.data;
    }
};
