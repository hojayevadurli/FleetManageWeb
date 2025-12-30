
export interface ServiceHistoryFormData {
  vehicle_id: string;
  vehicle_type: "truck" | "trailer";
  service_date: string;
  work_completed: string;
  shop_id: string;
  labor_hours: string;
  total_cost: string;
  mileage: string;
  invoice_file: File | null;
}

export interface ServiceRecord {
  id: string;
  vehicle_id: string;
  vehicle_type: string;
  service_date: string;
  work_completed: string;
  shop_id: string;
  labor_hours?: number;
  total_cost?: number;
  mileage?: number;
  invoice_url?: string;
}
