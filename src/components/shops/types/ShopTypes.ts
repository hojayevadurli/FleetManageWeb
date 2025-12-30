
export interface Shop {
  id: string;
  shop_name: string;
  address: string;
  contact_name?: string;
  shop_id: string;
  labor_rate: number;
  rate_category: 'green' | 'orange' | 'red';
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
}

export interface ShopRating {
  id: string;
  shop_id: string;
  user_id?: string;
  rating: number;
  review_text?: string;
  service_date?: string;
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
  rate_category: 'green' | 'orange' | 'red';
  comment: string;
  phone: string;
  email: string;
  website: string;
  hours_of_operation: Record<string, string>;
  specialties: string[];
  latitude: string;
  longitude: string;
}
