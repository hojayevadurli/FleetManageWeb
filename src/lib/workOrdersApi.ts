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
  vendorName?: string | null;
  vendorNameRaw?: string | null;
  vendorAddress?: string | null;
  vendorCity?: string | null;
  vendorState?: string | null;
  vendorZip?: string | null;
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
    isWarrantyClaim?: boolean;
    warrantyExpiryDate?: string | null;
    category?: string | null;
  }[];
  replaceDocuments?: boolean;
  documentIds?: string[];
  rating?: number;
  reviewText?: string;
  createdAt?: string; // Optional override
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
  vendorId?: string;
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
  console.log("resolveCreatedWorkOrder received:", res);
  let rawData = res?.data;

  // Case 2: backend returns id as plain string
  if (typeof rawData === "string" && rawData.trim()) {
    const id = rawData.trim();
    const getRes = await api.get(`/workorders/${id}`);
    rawData = getRes.data;
  }
  // Case 3: backend returns Location header
  else if (!rawData && (res?.headers?.location || res?.headers?.Location)) {
    const location = (res.headers.location || res.headers.Location) as string;
    const id = location.split("/").filter(Boolean).pop();
    if (id) {
      const getRes = await api.get(`/workorders/${id}`);
      rawData = getRes.data;
    }
  }

  if (rawData) {
    return normalizeWorkOrder(rawData);
  }

  throw new Error(
    "Create work order failed: backend did not return body, string id, or exposed Location header."
  );
}

function normalizeDocument(d: any): WorkOrderDocumentDto {
  const fileUrl = d.fileUrl || d.FileUrl;
  const fileName = d.fileName || d.FileName || (fileUrl ? fileUrl.split('/').pop() : 'Attachment');

  return {
    ...d,
    id: d.id || d.Id,
    fileName: fileName,
    fileUrl: fileUrl,
    fileType: d.fileType || d.FileType || 'application/octet-stream' // safe default
  };
}

function normalizeWorkOrder(data: any): WorkOrderDto {
  if (!data) return data;
  return {
    ...data,
    id: data.id || data.Id,
    workOrderNumber: data.workOrderNumber || data.WorkOrderNumber,
    equipmentId: data.equipmentId || data.EquipmentId,
    vendorId: data.vendorId || data.VendorId,
    vendorName: data.vendorName || data.VendorName,
    odometerAtService: data.odometerAtService ?? data.OdometerAtService,
    hoursAtService: data.hoursAtService ?? data.HoursAtService,
    openedAt: data.openedAt || data.OpenedAt,
    closedAt: data.closedAt || data.ClosedAt,
    title: data.title || data.Title,
    complaint: data.complaint || data.Complaint,
    diagnosis: data.diagnosis || data.Diagnosis,
    resolution: data.resolution || data.Resolution,
    notes: data.notes || data.Notes,
    status: (typeof data.status === 'number'
      ? data.status
      : WorkOrderStatus[data.status as keyof typeof WorkOrderStatus] ?? WorkOrderStatus.Open) as any, // Cast to any to satisfy string type in DTO for now, or update DTO type
    priority: (typeof data.priority === 'number'
      ? data.priority
      : WorkOrderPriority[data.priority as keyof typeof WorkOrderPriority] ?? WorkOrderPriority.Normal) as any,
    costSource: (typeof data.costSource === 'number'
      ? data.costSource
      : WorkOrderCostSource[data.costSource as keyof typeof WorkOrderCostSource] ?? WorkOrderCostSource.Estimated) as any,
    estimatedTotal: data.estimatedTotal ?? data.EstimatedTotal ?? 0,
    rating: data.rating ?? data.Rating,
    reviewText: data.reviewText ?? data.ReviewText ?? data.ratingComment ?? data.RatingComment,
    ratedAt: data.ratedAt ?? data.RatedAt,
    manualActualTotal: data.manualActualTotal ?? data.ManualActualTotal ?? 0,
    lines: (data.lines || data.Lines || []).map((l: any) => ({
      ...l,
      id: l.id || l.Id,
      type: l.type || l.Type,
      category: l.category || l.Category,
      description: l.description || l.Description,
      qty: l.qty ?? l.Qty ?? 0,
      unitPrice: l.unitPrice ?? l.UnitPrice ?? 0,
      amount: l.amount ?? l.Amount ?? 0,
      partNumber: l.partNumber || l.PartNumber,
      isWarrantyClaim: l.isWarrantyClaim ?? l.IsWarrantyClaim ?? false,
      warrantyExpiryDate: l.warrantyExpiryDate || l.WarrantyExpiryDate
    })),
    documents: (data.documents || data.Documents || []).map(normalizeDocument)
  } as WorkOrderDto;
}

export const workOrdersApi = {
  list: async (params?: WorkOrderListParams): Promise<WorkOrderDto[]> => {
    const res = await api.get("/workorders", { params });
    return (res.data || []).map(normalizeWorkOrder);
  },

  get: async (id: string): Promise<WorkOrderDto> => {
    const res = await api.get(`/workorders/${id}`);
    return normalizeWorkOrder(res.data);
  },

  // ✅ Alias (optional, helps avoid UI confusion)
  getById: async (id: string): Promise<WorkOrderDto> => {
    return workOrdersApi.get(id);
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
    workOrderNumber?: string | null;
  }): Promise<WorkOrderDto> => {
    const dto: WorkOrderUpsertDto = {
      equipmentId: args.equipmentId,
      vendorId: null,
      workOrderNumber: args.workOrderNumber ?? null,
      odometerAtService: null,
      openedAt: args.openedAt ?? new Date().toISOString(),
      title: args.title ?? "Draft",
      complaint: "Draft created for attachments",
      status: WorkOrderStatus.Draft,
      priority: WorkOrderPriority.Normal,
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
    try {
      return await resolveCreatedWorkOrder(res);
    } catch (e) {
      // Fallback: if 201 Created but parsing failed, try to find the latest for this asset
      if (res.status === 201 && dto.equipmentId) {
        console.warn("Create 201 but no ID returned. Fallback: fetching latest for equipment...");
        // Fetch recent
        const list = await workOrdersApi.list({ equipmentId: dto.equipmentId, pageSize: 5 });
        // Assuming list returns newest first. If not, we might need client-side sort.
        // Let's sort client side just in case
        const sorted = list.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());

        if (sorted.length > 0) {
          return sorted[0];
        }
      }
      throw e;
    }
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
    if (res?.data) return normalizeWorkOrder(res.data);

    // If backend returns no body, fetch it
    return await workOrdersApi.get(id);
  },

  createFromDocument: async (
    documentId: string,
    dto: CreateWorkOrderFromDocumentDto
  ): Promise<WorkOrderDto> => {
    const res = await api.post(`/workorders/from-document/${documentId}`, dto);
    return normalizeWorkOrder(res.data);
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
    return (res.data || []).map(normalizeDocument); // Attachments typically simple DTOs, usually camelCase from NestJS/ASP.NET default formatter, but we could normalize if needed.
  },

  /**
   * List attachments
   * GET /api/workorders/{id}/attachments
   */
  listAttachments: async (workOrderId: string): Promise<WorkOrderDocumentDto[]> => {
    const res = await api.get(`/workorders/${workOrderId}/attachments`);
    return (res.data || []).map(normalizeDocument);
  },

  /**
   * Delete one attachment
   * DELETE /api/workorders/{id}/attachments/{documentId}
   */
  deleteAttachment: async (workOrderId: string, documentId: string): Promise<void> => {
    await api.delete(`/workorders/${workOrderId}/attachments/${documentId}`);
  },

  /**
   * Link an existing document to a work order
   * POST /api/workorders/{id}/attachments
   * Body: AttachDocumentPayload
   */
  attachDocument: async (workOrderId: string, payload: any): Promise<WorkOrderDocumentDto> => {
    // 1. Fetch current to get state + existing docs
    const wo = await workOrdersApi.get(workOrderId);

    const existingIds = wo.documents?.map(d => d.id) || [];
    // Avoid duplicates
    const newIds = existingIds.includes(payload.documentId)
      ? existingIds
      : [...existingIds, payload.documentId];

    // 2. Construct full DTO for PUT
    const dto: WorkOrderUpsertDto = {
      equipmentId: wo.equipmentId,
      vendorId: wo.vendorId,
      vendorName: wo.vendorName,
      workOrderNumber: wo.workOrderNumber,
      odometerAtService: wo.odometerAtService,
      hoursAtService: wo.hoursAtService,
      openedAt: wo.openedAt,
      closedAt: wo.closedAt,
      title: wo.title,
      complaint: wo.complaint,
      diagnosis: wo.diagnosis,
      resolution: wo.resolution,
      notes: wo.notes,
      status: wo.status,
      priority: wo.priority,
      costSource: wo.costSource,
      estimatedTotal: wo.estimatedTotal,
      manualActualTotal: wo.manualActualTotal,
      // Map lines (strip IDs if strictly needed, but usually safe to re-send or map to DTO shape)
      lines: (wo.lines || []).map(l => ({
        type: l.type,
        description: l.description,
        qty: l.qty,
        unitPrice: l.unitPrice,
        partNumber: l.partNumber
      })),
      // KEY: Enable replacement
      replaceDocuments: true,
      documentIds: newIds
    };

    await workOrdersApi.update(workOrderId, dto);

    // Return dummy/mock since FileUpload logic only needs success (and technically we have the ID)
    // The previous FileUpload change passes the 'doc' from create() to the UI, so this return value is largely ignored.
    return {
      id: payload.documentId,
      fileUrl: "",
      fileName: (payload.notes || "Attachment"),
      fileType: "application/octet-stream",
      docKind: "work_order",
      role: payload.role || "WorkOrder",
      createdAt: new Date().toISOString()
    } as any;
  }
};
