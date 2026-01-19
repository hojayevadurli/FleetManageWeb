import api from "@/lib/Api";
import { Shop, ShopRating, ShopRateCategory, VendorPreference, RATE_CATEGORY_TO_PREFERENCE, PREFERENCE_TO_RATE_CATEGORY } from "@/components/shops/types/ShopTypes";

export interface RatingCreatePayload {
    rating: number;
    reviewText?: string;
    serviceDate?: string;
    workOrderId?: string;
    // Detailed ratings
    qualityRating?: number;
    timelinessRating?: number;
    communicationRating?: number;
    valueRating?: number;
    wouldRecommend?: boolean;
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
    rateCategory?: ShopRateCategory;
    vendorPreference?: VendorPreference; // Added
    comment?: string;
    hoursOfOperation?: Record<string, string>;
    specialties?: string[];
    latitude?: number;
    longitude?: number;
}

export interface ShopUpdatePayload extends Partial<ShopCreatePayload> { }

// Helper to strip tag from comment for display
const parseComment = (comment?: any) => {
    if (!comment || typeof comment !== 'string') return { cleanComment: comment || '', preference: null };
    const match = comment.match(/\[PREF:([A-Z]+)\]/);
    if (match) {
        return {
            cleanComment: comment.replace(/\[PREF:[A-Z]+\]\s*/g, '').trim(),
            preference: match[1] as VendorPreference
        };
    }
    return { cleanComment: comment, preference: null };
};

// Helper to inject tag into comment for storage
const injectPreference = (comment: string | undefined, preference?: VendorPreference) => {
    if (!preference) return comment;
    const clean = (comment || '').replace(/\[PREF:[A-Z]+\]\s*/g, '').trim();
    // Prepend tag exactly as expected by regex
    return `[PREF:${preference}] ${clean}`.trim();
};

const mapBackendShopToShop = (data: any): Shop => {
    // 1. Parse comment for metadata
    const { cleanComment, preference: storedPreference } = parseComment(data.comment || data.notes);

    // 2. Determine vendor preference
    // Priority:
    // a. Explicit field (if backend supports it)
    // b. Stored metadata in comment
    // c. Map from rate category/color
    // d. Default to STANDARD

    // Determine rate category (color) from backend first, but might override later
    let rateCategory = (data.rateCategory || data.networkTier || 'orange').toLowerCase() as ShopRateCategory;
    let vendorPreference: VendorPreference = 'STANDARD';

    if (data.vendorPreference) {
        vendorPreference = data.vendorPreference;
    } else if (storedPreference) {
        vendorPreference = storedPreference;
        // If we recovered preference from comment, FORCE the rate category to match
        // This fixes the issue where backend returns 'orange' for 'blue' preference
        if (PREFERENCE_TO_RATE_CATEGORY[vendorPreference]) {
            rateCategory = PREFERENCE_TO_RATE_CATEGORY[vendorPreference];
        }
    } else {
        // If no explicit preference or stored preference, try to derive from networkTier/rateCategory
        const tierRaw = (data.networkTier || '').toUpperCase();
        if (tierRaw === 'NEW') vendorPreference = 'NEW';
        else if (tierRaw === 'PARTNER') vendorPreference = 'PARTNER';
        else if (tierRaw === 'PREFERRED' || tierRaw === 'GREEN') vendorPreference = 'PREFERRED';
        else if (tierRaw === 'STANDARD' || tierRaw === 'ORANGE') vendorPreference = 'STANDARD';
        else if (tierRaw === 'RESTRICTED' || tierRaw === 'WARNING' || tierRaw === 'RED') vendorPreference = 'RESTRICTED';
        else if (RATE_CATEGORY_TO_PREFERENCE[rateCategory]) { // Fallback to mapping from rateCategory
            vendorPreference = RATE_CATEGORY_TO_PREFERENCE[rateCategory];
        }
    }

    return {
        id: data.id,
        shop_id: data.shopId || data.id,
        shop_name: data.name || data.shopName || "Unknown Shop",
        address: data.address1 || data.address || "",
        contact_name: data.contactName,
        labor_rate: data.laborRate || 0,
        rate_category: rateCategory,
        vendor_preference: vendorPreference,
        comment: cleanComment, // Use clean comment without tags
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
    };
};

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
        // Inject preference into comment
        const commentWithTag = injectPreference(payload.comment, payload.vendorPreference);
        // Map vendorPreference to networkTier for backend
        const payloadToSend = {
            ...payload,
            comment: commentWithTag,
            networkTier: payload.vendorPreference
        };

        const response = await api.post<any>("/service-partners", payloadToSend);
        return mapBackendShopToShop(response.data);
    },

    // PUT /api/service-partners/{id}
    async update(id: string, payload: ShopUpdatePayload): Promise<Shop> {
        // Inject preference into comment
        const commentWithTag = injectPreference(payload.comment, payload.vendorPreference);
        console.log('[ShopApi] Updating shop with preference:', {
            original: payload.vendorPreference,
            injectedComment: commentWithTag
        });

        // Map vendorPreference to networkTier for backend
        const payloadToSend = {
            ...payload,
            comment: commentWithTag,
            networkTier: payload.vendorPreference
        };

        const response = await api.put<any>(`/service-partners/${id}`, payloadToSend);
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
