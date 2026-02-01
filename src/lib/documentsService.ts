import api from './Api';
import { DocumentAttachment, DocumentRole, AttachDocumentPayload } from './types';

// ------------------------------------------------------------------
// 1. Universal Upload
// ------------------------------------------------------------------
/**
 * Uploads a file to the universal Documents endpoint.
 * Returns the created document metadata (including the ID needed for attachment).
 */
export const uploadDocument = async (
    file: File,
    docKind: string = 'general'
): Promise<{ id: string; fileUrl: string; fileType: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('docKind', docKind);
    // formData.append('runAiExtract', 'true'); // Optional: explicitly request AI
    const { data } = await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
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
