import api from "@/lib/Api";
import { Shop, ShopRating } from "@/components/shops/types/ShopTypes";

export interface RatingCreatePayload {
    rating: number;
    reviewText?: string;
    serviceDate?: string;
}

export interface ShopCreatePayload {
    shopId?: string;
    name: string;      // Changed from shopName
    address1: string;  // Changed from address
    address2?: string;
    city: string;      // Required by backend
    state: string;     // Required by backend
    postalCode?: string;
    contactName?: string;
    phone?: string;
    email?: string;
    website?: string;
    laborRate?: number;
    rateCategory?: 'green' | 'orange' | 'red';
    comment?: string;
    hoursOfOperation?: Record<string, string>;
    specialties?: string[];
    latitude?: number;
    longitude?: number;
}

export interface ShopUpdatePayload extends Partial<ShopCreatePayload> { }

export const shopsApi = {
    // GET /api/service-partners
    async list(): Promise<Shop[]> {
        try {
            const response = await api.get<Shop[]>("/service-partners");
            return response.data;
        } catch (error) {
            console.error("Error fetching shops:", error);
            return [];
        }
    },

    // GET /api/service-partners/{id}
    async get(id: string): Promise<Shop | null> {
        try {
            const response = await api.get<Shop>(`/service-partners/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching shop ${id}:`, error);
            return null;
        }
    },

    // POST /api/service-partners
    async create(payload: ShopCreatePayload): Promise<Shop> {
        const response = await api.post<Shop>("/service-partners", payload);
        return response.data;
    },

    // PUT /api/service-partners/{id}
    async update(id: string, payload: ShopUpdatePayload): Promise<Shop> {
        const response = await api.put<Shop>(`/service-partners/${id}`, payload);
        return response.data;
    },

    // DELETE /api/service-partners/{id}
    async delete(id: string): Promise<void> {
        await api.delete(`/service-partners/${id}`);
    },

    // GET /api/service-partners/{id}/ratings
    async getRatings(id: string): Promise<ShopRating[]> {
        try {
            const response = await api.get<ShopRating[]>(`/service-partners/${id}/ratings`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching ratings for shop ${id}:`, error);
            return [];
        }
    },

    // POST /api/service-partners/{id}/ratings
    async createRating(id: string, payload: RatingCreatePayload): Promise<ShopRating> {
        const response = await api.post<ShopRating>(`/service-partners/${id}/ratings`, payload);
        return response.data;
    },
};

export default shopsApi;
