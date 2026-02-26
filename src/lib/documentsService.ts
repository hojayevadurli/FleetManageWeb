import api from './Api.temp';
import { DocumentAttachment, DocumentRole, AttachDocumentPayload } from './types';

// ------------------------------------------------------------------
// 1. Universal Upload
// ------------------------------------------------------------------
/**
 * Uploads a file and creates a document record.
 * Three-step process: upload file → create document → return document ID
 */
export const uploadDocument = async (
    file: File,
    docKind: string = 'general'
): Promise<{ id: string; fileUrl: string; fileType: string }> => {
    // Step 1: Upload file to storage
    const formData = new FormData();
    formData.append('files', file);

    const uploadResponse = await api.post<string[]>('/uploads/operators', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (!Array.isArray(uploadResponse.data) || uploadResponse.data.length === 0) {
        throw new Error('Upload failed: No URL returned');
    }

    const fileUrl = uploadResponse.data[0];

    // Step 2: Create document record in database
    const docPayload = {
        fileUrl,
        fileType: file.type,
        docKind,
        runAiExtract: false
    };

    const docResponse = await api.post<{ id: string }>('/documents', docPayload);

    // Step 3: Return document ID and metadata
    return {
        id: docResponse.data.id,
        fileUrl,
        fileType: file.type
    };
};

// ------------------------------------------------------------------
// 2. Equipment Attachments
// ------------------------------------------------------------------
export const attachToEquipment = async (equipmentId: string, payload: AttachDocumentPayload): Promise<DocumentAttachment> => {
    // EquipmentController expects 'docRole' instead of 'role'
    const body = {
        documentId: payload.documentId,
        docRole: payload.role,
        startDate: payload.startDate,
        expirationDate: payload.expirationDate
        // Equipment currently only supports these fields
    };
    const { data } = await api.post(`/equipment/${equipmentId}/documents`, body);
    return data;
};

export const detachFromEquipment = async (equipmentId: string, documentId: string): Promise<void> => {
    await api.delete(`/equipment/${equipmentId}/documents/${documentId}`);
};

// ------------------------------------------------------------------
// 3. Work Order Attachments
// ------------------------------------------------------------------
export const attachToWorkOrder = async (workOrderId: string, payload: AttachDocumentPayload): Promise<DocumentAttachment> => {
    // WorkOrdersController expects 'role'
    const body = {
        documentId: payload.documentId,
        role: payload.role,
        startDate: payload.startDate,
        amount: payload.amount,
        providerName: payload.providerName,
        externalRef: payload.externalRef,
        notes: payload.notes
    };
    const { data } = await api.post(`/workorders/${workOrderId}/attachments`, body);
    return data;
};

export const detachFromWorkOrder = async (workOrderId: string, documentId: string): Promise<void> => {
    await api.delete(`/workorders/${workOrderId}/attachments/${documentId}`);
};

// ------------------------------------------------------------------
// 4. Driver Attachments
// ------------------------------------------------------------------
export const attachToDriver = async (driverId: string, payload: AttachDocumentPayload): Promise<DocumentAttachment> => {
    const body = {
        documentId: payload.documentId,
        role: payload.role,
        startDate: payload.startDate,
        expirationDate: payload.expirationDate,
        isActive: payload.isActive ?? true,
        externalRef: payload.externalRef,
        providerName: payload.providerName,
        notes: payload.notes
    };
    const { data } = await api.post(`/drivers/${driverId}/attachments`, body);
    return data;
};

export const detachFromDriver = async (driverId: string, documentId: string): Promise<void> => {
    await api.delete(`/drivers/${driverId}/attachments/${documentId}`);
};

const DocumentService = {
    uploadDocument,
    attachToEquipment,
    detachFromEquipment,
    attachToWorkOrder,
    detachFromWorkOrder,
    attachToDriver,
    detachFromDriver
};

export default DocumentService;
