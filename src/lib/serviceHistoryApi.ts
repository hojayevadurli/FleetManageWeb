// src/lib/serviceHistoryApi.ts
// FleetManage.ai — Service History API client (fetch-based, JWT-ready)

import { getToken, logout } from "../components/auth/Auth";

// ✅ Adjust if your env var / base differs
const API_BASE = (import.meta.env.VITE_API_URL || "https://localhost:5001").replace(/\/+$/, "");

function joinUrl(base: string, path: string) {
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type ServiceHistoryLineUpsertDto = {
  type: string;
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
  partNumber?: string | null;
};

export type ServiceHistoryUpsertDto = {
  assetType: "truck" | "trailer";
  assetId: string;
  workOrderId?: string | null;
  vendorId?: string | null;
  vendorNameRaw?: string | null;
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  odometer?: number | null;
  totalAmount: number;
  taxAmount: number;
  summary?: string | null;
  category?: string | null;
  status: string;
  lines: ServiceHistoryLineUpsertDto[];

  // attachments
  attachmentUrl?: string | null;
  attachmentFileName?: string | null;
};

export type ServiceHistoryDto = {
  id: string;

  // asset
  assetType: "truck" | "trailer";
  assetId?: string | null; // optional if you use internal GUIDs
  assetNumber?: string | null; // check if backend returns number as assetNumber/unitNumber

  // vendor / invoice
  vendorNameRaw?: string | null;
  vendorName?: string | null;
  invoiceNumber?: string | null;
  invoiceDate?: string | null; // ISO string
  totalAmount?: number | null;
  total?: number | null;
  taxAmount?: number | null;

  // maintenance fields
  odometer?: number | null;
  summary?: string | null; // raw notes or AI summary
  description?: string | null;
  status?: string | null;

  // attachments
  attachmentUrl?: string | null; // where PDF is stored
  attachmentFileName?: string | null;

  createdAt?: string;
  updatedAt?: string;
  lines?: ServiceHistoryLineUpsertDto[];
};

export type ServiceHistoryStatus = "draft" | "open" | "closed" | "paid" | "unpaid";

export type ListParams = {
  assetType?: "truck" | "trailer";
  assetId?: string;
  unitNumber?: string;
  vendorName?: string;
  fromDate?: string; // ISO
  toDate?: string; // ISO
  status?: ServiceHistoryStatus;
  q?: string; // generic search
  page?: number;
  pageSize?: number;
};

export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  method: HttpMethod,
  options?: {
    body?: any;
    headers?: Record<string, string>;
    query?: Record<string, string | number | boolean | undefined | null>;
    isMultipart?: boolean;
  }
): Promise<T> {
  const token = getToken();

  const url = new URL(joinUrl(API_BASE, path));

  if (options?.query) {
    for (const [k, v] of Object.entries(options.query)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    ...(options?.headers || {})
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined = undefined;

  // JSON body by default unless multipart
  if (options?.body !== undefined) {
    if (options?.isMultipart) {
      body = options.body as FormData;
      // IMPORTANT: do NOT set Content-Type for FormData; browser sets boundary.
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.body);
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body
  });

  // Auto-logout on auth errors
  if (res.status === 401 || res.status === 403) {
    try {
      logout();
    } catch { }
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    let details: any = undefined;
    try {
      details = isJson ? await res.json() : await res.text();
    } catch { }

    console.error(`[API Error] ${method} ${url.toString()} -> ${res.status}`, details);

    const message =
      (details && (details.message || details.title)) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status, details);
  }

  if (res.status === 204) {
    // No Content
    return undefined as unknown as T;
  }

  return (isJson ? await res.json() : await res.text()) as unknown as T;
}

/**
 * ✅ IMPORTANT: set this to match your controller route.
 * Examples:
 * - "/api/service-history"
 * - "/api/invoices"
 * - "/api/maintenance/service-history"
 */
const SERVICE_HISTORY_BASE = "/service-history";

export const serviceHistoryApi = {
  // GET /api/service-history
  list: (params?: ListParams) =>
    request<ServiceHistoryDto[]>(SERVICE_HISTORY_BASE, "GET", {
      query: params ? (params as any) : undefined
    }),

  // GET /api/service-history/{id}
  get: (id: string) =>
    request<ServiceHistoryDto>(`${SERVICE_HISTORY_BASE}/${encodeURIComponent(id)}`, "GET"),

  // POST /api/service-history
  create: (dto: ServiceHistoryUpsertDto) =>
    request<string>(SERVICE_HISTORY_BASE, "POST", { body: dto }),

  // PUT /api/service-history/{id}
  update: (id: string, dto: Partial<ServiceHistoryUpsertDto>) =>
    request<ServiceHistoryDto>(`${SERVICE_HISTORY_BASE}/${encodeURIComponent(id)}`, "PUT", {
      body: dto
    }),

  // DELETE /api/service-history/{id}
  remove: (id: string) =>
    request<void>(`${SERVICE_HISTORY_BASE}/${encodeURIComponent(id)}`, "DELETE"),

  /**
   * Upload an invoice PDF/image and create a ServiceHistory record.
   * Common backend:
   * POST /api/service-history/upload (multipart/form-data)
   */
  uploadInvoice: (args: {
    file: File;

    assetType: "truck" | "trailer";
    assetId?: string;
    unitNumber?: string;
    vendorName?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    odometer?: number;
    notes?: string;

    parseWithAi?: boolean;
  }) => {
    const form = new FormData();
    form.append("file", args.file);

    form.append("assetType", args.assetType);
    if (args.assetId) form.append("assetId", args.assetId);
    if (args.unitNumber) form.append("unitNumber", args.unitNumber);
    if (args.vendorName) form.append("vendorName", args.vendorName);
    if (args.invoiceNumber) form.append("invoiceNumber", args.invoiceNumber);
    if (args.invoiceDate) form.append("invoiceDate", args.invoiceDate);
    if (args.odometer !== undefined) form.append("odometer", String(args.odometer));
    if (args.notes) form.append("notes", args.notes);
    if (args.parseWithAi !== undefined) form.append("parseWithAi", String(args.parseWithAi));

    return request<ServiceHistoryDto>(`${SERVICE_HISTORY_BASE}/upload`, "POST", {
      body: form,
      isMultipart: true
    });
  }
};
