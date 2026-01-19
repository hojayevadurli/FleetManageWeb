
export type ShopRateCategory = 'purple' | 'green' | 'orange' | 'red' | 'blue' | 'black';

export type VendorPreference = 'NEW' | 'PARTNER' | 'PREFERRED' | 'STANDARD' | 'RESTRICTED';

export const VENDOR_PREFERENCE_CONFIG: Record<VendorPreference, { label: string; borderHex: string; textColor: string; bgColor: string; mapColor: string; description: string }> = {
  NEW: {
    label: 'New',
    borderHex: '#8b5cf6',
    textColor: 'text-violet-700',
    bgColor: 'bg-violet-50',
    mapColor: '#8b5cf6',
    description: "Trial stage"
  },
  PARTNER: {
    label: 'Partner',
    borderHex: '#3b82f6',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    mapColor: '#3b82f6',
    description: "Contracted rates"
  },
  PREFERRED: {
    label: 'Preferred',
    borderHex: '#10b981',
    textColor: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    mapColor: '#10B981',
    description: "Top rated"
  },
  STANDARD: {
    label: 'Standard',
    borderHex: '#f97316',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    mapColor: '#F97316',
    description: "General use"
  },
  RESTRICTED: {
    label: 'Restricted',
    borderHex: '#f43f5e',
    textColor: 'text-rose-700',
    bgColor: 'bg-rose-50',
    mapColor: '#F43F5E',
    description: "Avoid use"
  },
};

export const RATE_CATEGORY_TO_PREFERENCE: Record<string, VendorPreference> = {
  'purple': 'NEW',
  'blue': 'PARTNER',
  'green': 'PREFERRED',
  'orange': 'STANDARD',
  'red': 'RESTRICTED'
};

export const PREFERENCE_TO_RATE_CATEGORY: Record<VendorPreference, ShopRateCategory> = {
  'NEW': 'purple',
  'PARTNER': 'blue',
  'PREFERRED': 'green',
  'STANDARD': 'orange',
  'RESTRICTED': 'red'
};

export interface Shop {
  id: string;
  shop_name: string;
  address: string;
  contact_name?: string;
  shop_id: string;
  labor_rate: number;
  rate_category: ShopRateCategory;
  vendor_preference: VendorPreference; // Added
  comment?: string;
  phone?: string;
  email?: string;
  website?: string;
  hours_of_operation?: Record<string, string>;
  specialties?: string[];
  latitude?: number;
  longitude?: number;
  average_rating?: number;
  total_reviews?: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface ShopRating {
  id: string;
  shop_id: string;
  user_id?: string;
  rating: number;
  quality_rating?: number;
  timeliness_rating?: number;
  communication_rating?: number;
  value_rating?: number;
  would_recommend?: boolean;
  review_text?: string;
  service_date?: string;
  work_order_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ShopService {
  id: string;
  shop_id: string;
  service_name: string;
  service_category: string;
  is_primary: boolean;
  created_at: string;
}

export interface ShopFormData {
  shop_name: string;
  address: string;
  contact_name: string;
  labor_rate: string;
  rate_category: ShopRateCategory;
  vendor_preference: VendorPreference; // Added
  comment: string;
  phone: string;
  email: string;
  website: string;
  hours_of_operation: Record<string, string>;
  specialties: string[];
  latitude: string;
  longitude: string;
  city?: string;
  state?: string;
  zip?: string;
}

export const SERVICE_SPECIALTIES = [
  "General Repair",
  "Tires",
  "Engine",
  "Body Work",
  "Towing",
  "Electrical",
  "Trailers",
  "Reefer"
];
