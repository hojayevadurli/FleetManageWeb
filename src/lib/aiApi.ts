import api from "@/lib/Api";

export interface ParsedInvoiceLineItem {
    description?: string;
    quantity?: number;
    unitPrice?: number;
    amount?: number;
    category?: string;
    lineType?: "part" | "labor" | "fee" | "misc";
}

export interface ParsedInvoiceResult {
    vendorName?: string;
    invoiceNumber?: string;
    invoiceDate?: string;
    dueDate?: string;
    truckNumber?: string;
    vin?: string;
    mileage?: number;
    subtotal?: number;
    tax?: number;
    total?: number;
    workCompleted?: string;
    lineItems?: ParsedInvoiceLineItem[];
    raw?: unknown;
}

const normalizeAiResponse = (payload: unknown): ParsedInvoiceResult => {
    const data = payload as {
        json?: string;
        result?: ParsedInvoiceResult;
        data?: ParsedInvoiceResult;
    };

    if (data?.result) return data.result;
    if (data?.data) return data.data;

    if (typeof data?.json === "string") {
        try {
            return JSON.parse(data.json) as ParsedInvoiceResult;
        } catch {
            return { raw: data.json };
        }
    }

    return payload as ParsedInvoiceResult;
};

export const aiApi = {
    parseInvoiceText: async (text: string): Promise<ParsedInvoiceResult> => {
        const response = await api.post("/ai/parse-invoice", { text });
        return normalizeAiResponse(response.data);
    },

    parseInvoiceFile: async (file: File): Promise<ParsedInvoiceResult> => {
        const form = new FormData();
        form.append("file", file);

        const response = await api.post("/ai/parse-invoice-file", form);
        return normalizeAiResponse(response.data);
    },
};