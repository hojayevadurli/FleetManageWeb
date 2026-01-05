import api from "@/lib/Api";

/**
 * DTOs that match your .NET API
 */

import { WorkOrderDto, WorkOrderLineDto, WorkOrderDocumentDto, WorkOrderStatus, WorkOrderPriority, WorkOrderCostSource } from "@/lib/types";

export type AssetType = "truck" | "trailer";
export type WorkOrderLineType = "part" | "labor" | "fee" | "misc";

/**
 * Match CreateWorkOrderDto / UpdateWorkOrderDto
 */
export interface WorkOrderUpsertDto {
  equipmentId: string;
  vendorId?: string | null;
  workOrderNumber?: string | null;
  odometerAtService?: number | null;
  hoursAtService?: number | null;
  openedAt: string; // ISO string
  closedAt?: string | null;
  title: string;
  complaint: string;
  diagnosis?: string | null;
  resolution?: string | null;
  notes?: string | null;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  costSource: WorkOrderCostSource;
  estimatedTotal: number;
  manualActualTotal: number;
  lines: {
    type: string;
    description: string;
    qty: number;
    unitPrice: number;
    partNumber?: string | null;
  }[];
  replaceDocuments?: boolean;
  documentIds?: string[];
}

/**
 * Create WO directly from a Document's ExtractedJson
 * POST /api/workorders/from-document/{documentId}
 */
export interface CreateWorkOrderFromDocumentDto {
  equipmentId: string;
  vendorId?: string | null;
  odometer?: number | null;
  serviceDate?: string | null;
  summary?: string | null;
  confirmDocument?: boolean;
}

/**
 * Query params for listing
 */
export interface WorkOrderListParams {
  equipmentId?: string;
  page?: number;
  pageSize?: number;
}

/**
 * ✅ Safety: avoid wiping attachments accidentally.
 * If replaceDocuments !== true, strip documentIds from payload.
 */
function sanitizeUpsertDto(dto: WorkOrderUpsertDto): WorkOrderUpsertDto {
  if (dto.replaceDocuments === true) return dto;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { documentIds, ...rest } = dto;
  return rest as WorkOrderUpsertDto;
}

/**
 * ✅ Extract id from typical .NET create responses:
 * - response body is WorkOrderDto => res.data.id OR res.data.Id
 * - response body is string id => res.data
 * - response header Location: /api/workorders/{id} (requires CORS expose sometimes)
 */
async function resolveCreatedWorkOrder(res: any): Promise<WorkOrderDto> {
  // Case 1: backend returns full object (camelCase OR PascalCase)
  const idFromObj = res?.data?.id || res?.data?.Id;
  if (idFromObj) {
    // normalize to camelCase for app usage
    if (res.data && !res.data.id) res.data.id = idFromObj;
    return res.data as WorkOrderDto;
  }

  // Case 2: backend returns id as plain string
  if (typeof res?.data === "string" && res.data.trim()) {
    const id = res.data.trim();
    const getRes = await api.get(`/workorders/${id}`);
    return getRes.data as WorkOrderDto;
  }

  // Case 3: backend returns Location header (may be hidden unless exposed by CORS)
  const location = (res?.headers?.location || res?.headers?.Location) as string | undefined;
  if (location) {
    const id = location.split("/").filter(Boolean).pop();
    if (id) {
      const getRes = await api.get(`/workorders/${id}`);
      return getRes.data as WorkOrderDto;
    }
  }

  throw new Error(
    "Create work order failed: backend did not return id/Id in body, string id, or exposed Location header."
  );
}

export const workOrdersApi = {
  list: async (params?: WorkOrderListParams): Promise<WorkOrderDto[]> => {
    const res = await api.get("/workorders", { params });
    return res.data;
  },

  get: async (id: string): Promise<WorkOrderDto> => {
    const res = await api.get(`/workorders/${id}`);
    return res.data;
  },

  // ✅ Alias (optional, helps avoid UI confusion)
  getById: async (id: string): Promise<WorkOrderDto> => {
    const res = await api.get(`/workorders/${id}`);
    return res.data;
  },

  /**
   * ✅ Explicit draft creator
   * Creates a minimal draft work order for attachment uploads.
   * IMPORTANT: calls create() so ID is guaranteed even if backend returns Location header / no body.
   */
  createDraft: async (args: {
    equipmentId: string;
    title?: string;
    openedAt?: string; // ISO
  }): Promise<WorkOrderDto> => {
    const dto: WorkOrderUpsertDto = {
      equipmentId: args.equipmentId,
      vendorId: null,
      workOrderNumber: null,
      odometerAtService: null,
      openedAt: args.openedAt ?? new Date().toISOString(),
      title: args.title ?? "Draft",
      complaint: "Draft created for attachments",
      status: WorkOrderStatus.Draft,
      priority: WorkOrderPriority.Medium,
      costSource: WorkOrderCostSource.Estimated,
      estimatedTotal: 0,
      manualActualTotal: 0,
      lines: []
    };
    return await workOrdersApi.create(dto);
  },

  /**
   * Create work order (no attachments here).
   * After create, call uploadAttachments(workOrderId, files).
   *
   * ✅ Robust: handles backend returning (1) object, (2) string id, (3) Location header, (4) empty body.
   */
  create: async (dto: WorkOrderUpsertDto): Promise<WorkOrderDto> => {
    const res = await api.post("/workorders", sanitizeUpsertDto(dto));
    return await resolveCreatedWorkOrder(res);
  },

  /**
   * Update work order (no attachments here by default).
   * Attachments should be managed via uploadAttachments/deleteAttachment endpoints.
   *
   * ✅ Returns WorkOrderDto (falls back to GET if PUT returns empty)
   */
  update: async (id: string, dto: WorkOrderUpsertDto): Promise<WorkOrderDto> => {
    const payload = sanitizeUpsertDto(dto);
    const res = await api.put(`/workorders/${id}`, payload);

    // If backend returns updated entity
    if (res?.data) return res.data as WorkOrderDto;

    // If backend returns no body, fetch it
    return await workOrdersApi.get(id);
  },

  createFromDocument: async (
    documentId: string,
    dto: CreateWorkOrderFromDocumentDto
  ): Promise<WorkOrderDto> => {
    const res = await api.post(`/workorders/from-document/${documentId}`, dto);
    return res.data;
  },

  /**
   * ✅ Soft delete single work order
   * DELETE /api/workorders/{id}
   */
  delete: async (workOrderId: string): Promise<void> => {
    await api.delete(`/workorders/${workOrderId}`);
  },

  /**
   * ✅ Soft delete in bulk
   * POST /api/workorders/bulk-delete
   */
  bulkDelete: async (workOrderIds: string[]): Promise<void> => {
    await api.post("/workorders/bulk-delete", { workOrderIds });
  },

  /**
   * Upload attachments directly to a work order.
   * POST /api/workorders/{id}/attachments
   * multipart/form-data with field name "files"
   */
  uploadAttachments: async (workOrderId: string, files: File[]): Promise<WorkOrderDocumentDto[]> => {
    const form = new FormData();
    files.forEach((f) => form.append("files", f));

    const res = await api.post(`/workorders/${workOrderId}/attachments`, form);
    return res.data;
  },

  /**
   * List attachments
   * GET /api/workorders/{id}/attachments
   */
  listAttachments: async (workOrderId: string): Promise<WorkOrderDocumentDto[]> => {
    const res = await api.get(`/workorders/${workOrderId}/attachments`);
    return res.data;
  },

  /**
   * Delete one attachment
   * DELETE /api/workorders/{id}/attachments/{documentId}
   */
  deleteAttachment: async (workOrderId: string, documentId: string): Promise<void> => {
    await api.delete(`/workorders/${workOrderId}/attachments/${documentId}`);
  }
};
