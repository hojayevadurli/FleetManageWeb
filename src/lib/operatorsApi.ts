import axios from 'axios';
import {
    OperatorDto,
    CreateOperatorDto,
    UpdateOperatorDto,
    OperatorDocumentDto,
    AddOperatorAttachmentDto
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
    }
};
