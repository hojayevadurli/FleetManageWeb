import api from "@/lib/Api";

export interface CreateCheckoutResponse {
    sessionId: string;
    url: string;
}

export interface InvoiceDto {
    id: string;
    number: string;
    date: string;
    amount: number;
    status: string;
    periodStart?: string;
    periodEnd?: string;
    receiptUrl?: string;
}

export const STRIPE_PRICE_ID = "price_1T3sJpCVvDykkptYdVnyMK25";

export const billingApi = {
    // POST /api/billing/checkout-session
    async createCheckoutSession(priceId: string): Promise<CreateCheckoutResponse> {
        const response = await api.post<CreateCheckoutResponse>("/billing/checkout-session", {
            priceId,
            successUrl: window.location.origin + "/app/settings/billing?success=true",
            cancelUrl: window.location.origin + "/app/settings/billing?canceled=true",
        });
        return response.data;
    },

    // GET /api/billing/history
    async getHistory(): Promise<InvoiceDto[]> {
        const response = await api.get<InvoiceDto[]>("/billing/history");
        return response.data;
    },

    // POST /api/billing/portal-session
    async createPortalSession(returnUrl: string): Promise<{ url: string }> {
        const response = await api.post<{ url: string }>("/billing/portal-session", { returnUrl });
        return response.data;
    },

    // GET /api/billing/upcoming-invoice
    async getUpcomingInvoice(): Promise<{ amountDue: number, date: string | null }> {
        const response = await api.get<{ amountDue: number, date: string | null }>("/billing/upcoming-invoice");
        return response.data;
    }
};

export default billingApi;
