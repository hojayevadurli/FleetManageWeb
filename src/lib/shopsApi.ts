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
    country?: string;  // Required by backend
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

const mapBackendShopToShop = (data: any): Shop => ({
    id: data.id,
    shop_id: data.shopId || data.id,
    shop_name: data.name || data.shopName || "Unknown Shop",
    address: data.address1 || data.address || "",
    contact_name: data.contactName,
    labor_rate: data.laborRate || 0,
    rate_category: (data.rateCategory || data.networkTier || 'green').toLowerCase() as 'green' | 'orange' | 'red',
    comment: data.comment || data.notes,
    phone: data.phone,
    email: data.email,
    website: data.website,
    hours_of_operation: data.hoursOfOperation,
    specialties: data.specialties || [],
    latitude: data.latitude,
    longitude: data.longitude,
    average_rating: data.averageRating || 0,
    total_reviews: data.reviewCount || 0,
    created_at: data.createdAt || new Date().toISOString(),
    updated_at: data.updatedAt || new Date().toISOString(),
    city: data.city,
    state: data.state,
    zip: data.postalCode
});

export const shopsApi = {
    // GET /api/service-partners
    async list(): Promise<Shop[]> {
        try {
            const response = await api.get<any[]>("/service-partners");
            return response.data.map(mapBackendShopToShop);
        } catch (error) {
            console.error("Error fetching shops:", error);
            return [];
        }
    },

    // GET /api/service-partners/{id}
    async get(id: string): Promise<Shop | null> {
        try {
            const response = await api.get<any>(`/service-partners/${id}`);
            return mapBackendShopToShop(response.data);
        } catch (error) {
            console.error(`Error fetching shop ${id}:`, error);
            return null;
        }
    },

    // POST /api/service-partners
    async create(payload: ShopCreatePayload): Promise<Shop> {
        const response = await api.post<any>("/service-partners", payload);
        return mapBackendShopToShop(response.data);
    },

    // PUT /api/service-partners/{id}
    async update(id: string, payload: ShopUpdatePayload): Promise<Shop> {
        const response = await api.put<any>(`/service-partners/${id}`, payload);
        return mapBackendShopToShop(response.data);
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
