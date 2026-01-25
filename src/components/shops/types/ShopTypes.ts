
export type ShopRateCategory = 'purple' | 'green' | 'orange' | 'red' | 'blue' | 'black';

export type VendorPreference = 'NEW' | 'PARTNER' | 'PREFERRED' | 'STANDARD' | 'RESTRICTED';

export const VENDOR_PREFERENCE_CONFIG: Record<VendorPreference, { label: string; borderHex: string; textColor: string; bgColor: string; mapColor: string; description: string }> = {
  PREFERRED: {
    label: 'Preferred',
    borderHex: '#10b981', // Green
    textColor: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    mapColor: '#10B981',
    description: "Top rated"
  },
  PARTNER: {
    label: 'Partner',
    borderHex: '#3b82f6', // Blue
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    mapColor: '#3b82f6',
    description: "Contracted rates"
  },
  STANDARD: {
    label: 'Standard',
    borderHex: '#94a3b8', // Gray (Slate-400 equivalent)
    textColor: 'text-slate-600',
    bgColor: 'bg-slate-100',
    mapColor: '#94a3b8',
    description: "General use"
  },
  NEW: {
    label: 'New',
    borderHex: '#eab308', // Yellow
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    mapColor: '#eab308',
    description: "Trial stage"
  },
  RESTRICTED: {
    label: 'Restricted',
    borderHex: '#ef4444', // Red
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    mapColor: '#ef4444',
    description: "Avoid use"
  },
};

export const RATE_CATEGORY_TO_PREFERENCE: Record<string, VendorPreference> = {
  'green': 'PREFERRED',
  'blue': 'PARTNER',
  'gray': 'STANDARD',
  'yellow': 'NEW',
  'red': 'RESTRICTED'
};

export const PREFERENCE_TO_RATE_CATEGORY: Record<VendorPreference, ShopRateCategory> = {
  'PREFERRED': 'green',
  'PARTNER': 'blue',
  'STANDARD': 'orange', // Keeping orange for backward compat in types, but UI will look gray
  'NEW': 'purple',      // Keeping purple for backward compat
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
  total_spent?: number;
  order_count?: number;
  last_used_at?: string;
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
