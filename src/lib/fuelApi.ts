// src/lib/fuelApi.ts
import { getToken, logout } from "../components/auth/Auth";

const API_BASE = (import.meta.env.VITE_API_URL || "https://localhost:5001").replace(/\/+$/, "");

function joinUrl(base: string, path: string) {
    return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type FuelUpsertDto = {
    assetId: string;
    assetType?: string;
    date: string;
    vendorName: string;
    vendorAddress?: string;
    fuelType: string;
    gallons: number;
    unitPrice: number;
    totalAmount: number;
    odometer?: number;
    state?: string;
    documentUrl?: string;
    documentFileName?: string;
    notes?: string;
};

export type FuelDto = FuelUpsertDto & {
    id: string;
    assetNumber?: string;
    createdAt?: string;
};

async function request<T>(
    path: string,
    method: HttpMethod,
    options?: {
        body?: any;
        headers?: Record<string, string>;
        query?: Record<string, string | number | boolean | undefined | null>;
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

    const headers: Record<string, string> = { ...(options?.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;

    let body: BodyInit | undefined = undefined;
    if (options?.body !== undefined) {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(options.body);
    }

    const res = await fetch(url.toString(), { method, headers, body });

    if (res.status === 401 || res.status === 403) {
        try { logout(); } catch { }
    }

    if (!res.ok) {
        const details = await res.json().catch(() => ({}));
        throw new Error(details.message || `Fuel API Error (${res.status})`);
    }

    if (res.status === 204) return undefined as unknown as T;
    return res.json();
}

const FUEL_BASE = "/fuel";

export const fuelApi = {
    list: (params?: any) => request<FuelDto[]>(FUEL_BASE, "GET", { query: params }),
    get: (id: string) => request<FuelDto>(`${FUEL_BASE}/${id}`, "GET"),
    create: (dto: FuelUpsertDto) => request<FuelDto>(FUEL_BASE, "POST", { body: dto }),
    update: (id: string, dto: Partial<FuelUpsertDto>) => request<FuelDto>(`${FUEL_BASE}/${id}`, "PUT", { body: dto }),
    remove: (id: string) => request<void>(`${FUEL_BASE}/${id}`, "DELETE"),
};
