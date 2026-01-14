import api from "@/lib/Api";

export interface CreateCheckoutResponse {
    sessionId: string;
    url: string;
}

export const STRIPE_PRICE_ID = "price_H5ggYJ..."; // TODO: Replace with actual Price ID

export const billingApi = {
    // POST /api/billing/checkout-session
    async createCheckoutSession(priceId: string): Promise<CreateCheckoutResponse> {
        const response = await api.post<CreateCheckoutResponse>("/billing/checkout-session", {
            priceId,
            successUrl: window.location.origin + "/settings?success=true",
            cancelUrl: window.location.origin + "/settings?canceled=true",
        });
        return response.data;
    }
};

export default billingApi;
