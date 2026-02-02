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
    // 1. Parse comment for metadata (check notes/description too)
    const { cleanComment, preference: storedPreference } = parseComment(data.comment || data.notes || data.description);

    // 2. Determine vendor preference
    // Priority:
    // a. Stored metadata in comment (Our specific source of truth)
    // b. Explicit field (vendorPreference, vendor_preference)
    // c. Network Tier field (networkTier, network_tier)
    // d. Map from rate category/color
    // e. Default to STANDARD

    let rateCategory = (data.rateCategory || data.rate_category || data.networkTier || data.network_tier || 'orange').toLowerCase() as ShopRateCategory;
    let vendorPreference: VendorPreference = 'STANDARD';

    const explicitPref = data.vendorPreference || data.vendor_preference;
    const tierRaw = (data.networkTier || data.network_tier || '').toUpperCase();

    // Check stored preference in comment FIRST (it acts as our override)
    if (storedPreference) {
        vendorPreference = storedPreference;
        if (PREFERENCE_TO_RATE_CATEGORY[vendorPreference]) {
            rateCategory = PREFERENCE_TO_RATE_CATEGORY[vendorPreference];
        }
    }
    else if (explicitPref) {
        vendorPreference = explicitPref;
    } else if (tierRaw) {
        // Map backend tier values to frontend preference
        if (tierRaw === 'NEW') vendorPreference = 'NEW';
        else if (tierRaw === 'PARTNER') vendorPreference = 'PARTNER';
        else if (tierRaw === 'PREFERRED' || tierRaw === 'GREEN') vendorPreference = 'PREFERRED';
        else if (tierRaw === 'STANDARD' || tierRaw === 'ORANGE') vendorPreference = 'STANDARD';
        else if (tierRaw === 'RESTRICTED' || tierRaw === 'WARNING' || tierRaw === 'RED') vendorPreference = 'RESTRICTED';
    } else if (RATE_CATEGORY_TO_PREFERENCE[rateCategory]) {
        vendorPreference = RATE_CATEGORY_TO_PREFERENCE[rateCategory];
    }

    return {
        id: data.id,
        shop_id: data.shopId || data.shop_id || data.id,
        shop_name: data.shopName || data.shop_name || data.name || "Unknown Shop",
        address: data.address1 || data.address || "",
        contact_name: data.contactName || data.contact_name,
        labor_rate: data.laborRate || data.labor_rate || 0,
        rate_category: rateCategory,
        vendor_preference: vendorPreference,
        comment: cleanComment,
        phone: data.phone,
        email: data.email,
        website: data.website,
        hours_of_operation: data.hoursOfOperation || data.hours_of_operation,
        specialties: data.specialties || [],
        latitude: data.latitude,
        longitude: data.longitude,
        average_rating: data.averageRating || data.average_rating || 0,
        total_reviews: data.reviewCount || data.total_reviews || 0,
        created_at: data.createdAt || data.created_at || new Date().toISOString(),
        updated_at: data.updatedAt || data.updated_at || new Date().toISOString(),
        city: data.city,
        state: data.state,
        zip: data.postalCode || data.postal_code || data.zip
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
            // Log raw response for debugging persistence
            console.log(`[ShopApi] Fetched shop ${id} raw data:`, response.data);
            return mapBackendShopToShop(response.data);
        } catch (error) {
            console.error(`Error fetching shop ${id}:`, error);
            return null;
        }
    },

    // POST /api/service-partners
    async create(payload: ShopCreatePayload): Promise<Shop> {
        const commentWithTag = injectPreference(payload.comment, payload.vendorPreference);
        // Robust payload: send multiple variations to ensure backend picks it up
        const payloadToSend = {
            ...payload,
            // Core fields mapped to likely backend names
            shopName: payload.name,
            name: payload.name, // Keep original
            address: payload.address1,
            address1: payload.address1, // Keep original
            postalCode: payload.postalCode,
            zip: payload.postalCode,

            comment: commentWithTag,
            notes: commentWithTag, // Try 'notes' field
            description: commentWithTag, // Try 'description' field

            // Send Preference as both
            networkTier: payload.vendorPreference,
            vendorPreference: payload.vendorPreference,
            vendor_preference: payload.vendorPreference
        };

        const response = await api.post<any>("/service-partners", payloadToSend);
        return mapBackendShopToShop(response.data);
    },

    // PUT /api/service-partners/{id}
    async update(id: string, payload: ShopUpdatePayload): Promise<Shop> {
        const commentWithTag = injectPreference(payload.comment, payload.vendorPreference);
        console.log('[ShopApi] Updating shop with preference:', {
            original: payload.vendorPreference,
            injectedComment: commentWithTag
        });

        const payloadToSend = {
            ...payload,
            // Core fields mapped to likely backend names
            shopName: payload.name,
            name: payload.name,
            address: payload.address1,
            address1: payload.address1,
            postalCode: payload.postalCode,
            zip: payload.postalCode,

            comment: commentWithTag,
            notes: commentWithTag, // Try 'notes' field
            description: commentWithTag, // Try 'description' field

            // Send Preference as both styles
            networkTier: payload.vendorPreference,
            vendorPreference: payload.vendorPreference,
            vendor_preference: payload.vendorPreference
        };

        const response = await api.put<any>(`/service-partners/${id}`, payloadToSend);
        const mappedShop = mapBackendShopToShop(response.data);

        // CRITICAL FIX: Backend may not echo back preference, force what we sent
        if (payload.vendorPreference) {
            mappedShop.vendor_preference = payload.vendorPreference;
            // Also update rate_category to match
            mappedShop.rate_category = PREFERENCE_TO_RATE_CATEGORY[payload.vendorPreference];
        }
        // Also force other fields that might not be echoed
        if (payload.name) mappedShop.shop_name = payload.name;
        if (payload.laborRate) mappedShop.labor_rate = payload.laborRate;
        if (payload.address1) mappedShop.address = payload.address1;
        if (payload.phone) mappedShop.phone = payload.phone;
        if (payload.city) mappedShop.city = payload.city;
        if (payload.state) mappedShop.state = payload.state;
        if (payload.postalCode) mappedShop.zip = payload.postalCode;

        console.log('[ShopApi] Returning shop with forced preference:', mappedShop.vendor_preference);
        return mappedShop;
    },

    // DELETE /api/service-partners/{id}
    async delete(id: string): Promise<void> {
        await api.delete(`/service-partners/${id}`);
    },

    // GET /api/service-partners/{id}/ratings
    // GET /api/service-partners/{id}/ratings
    async getRatings(id: string): Promise<ShopRating[]> {
        try {
            const response = await api.get<any[]>(`/service-partners/${id}/ratings`);

            // ✅ Normalize keys for consistent frontend usage
            const normalizeRating = (r: any): ShopRating => ({
                ...r,
                id: r.id || r.Id,
                work_order_id: r.work_order_id || r.workOrderId || r.WorkOrderId,
                rating: r.rating || r.Rating,
                quality_rating: r.quality_rating || r.qualityRating,
                timeliness_rating: r.timeliness_rating || r.timelinessRating,
                communication_rating: r.communication_rating || r.communicationRating,
                value_rating: r.value_rating || r.valueRating,
                would_recommend: r.would_recommend ?? r.wouldRecommend,
                review_text: r.review_text || r.reviewText || r.comment,
            });

            return response.data.map(normalizeRating);
        } catch (error) {
            console.error(`Error fetching ratings for shop ${id}:`, error);
            return [];
        }
    },

    // POST /api/service-partners/{id}/ratings
    async createRating(id: string, payload: RatingCreatePayload): Promise<ShopRating> {
        // Map payload to snake_case for backend
        const payloadToSend = {
            rating: payload.rating,
            review_text: payload.reviewText, // Align with ShopRating interface
            comment: payload.reviewText, // Send both just in case
            service_date: payload.serviceDate,
            work_order_id: payload.workOrderId,
            quality_rating: payload.qualityRating,
            timeliness_rating: payload.timelinessRating,
            communication_rating: payload.communicationRating,
            value_rating: payload.valueRating,
            would_recommend: payload.wouldRecommend
        };
        const response = await api.post<ShopRating>(`/service-partners/${id}/ratings`, payloadToSend);
        return response.data;
    },

    // PUT /api/service-partners/{id}/ratings/{ratingId}
    async updateRating(shopId: string, ratingId: string, payload: RatingCreatePayload): Promise<ShopRating> {
        const payloadToSend = {
            rating: payload.rating,
            review_text: payload.reviewText,
            comment: payload.reviewText,
            service_date: payload.serviceDate,
            work_order_id: payload.workOrderId,
            quality_rating: payload.qualityRating,
            timeliness_rating: payload.timelinessRating,
            communication_rating: payload.communicationRating,
            value_rating: payload.valueRating,
            would_recommend: payload.wouldRecommend
        };
        const response = await api.put<ShopRating>(`/service-partners/${shopId}/ratings/${ratingId}`, payloadToSend);
        return response.data;
    },
};

export default shopsApi;
