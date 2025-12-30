
export enum EquipmentStatus {
  ACTIVE = 'active',
  IN_SHOP = 'in shop',
  OUT_OF_SERVICE = 'out of service'
}

export enum EquipmentType {
  TRUCK = 'truck',
  TRAILER = 'trailer'
}

export enum WorkOrderStatus {
  OPEN = 'Open',
  SENT_TO_SHOP = 'Sent to Shop',
  QUOTE_RECEIVED = 'Quote Received',
  APPROVED = 'Approved',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  ON_HOLD = 'On Hold',
  CANCELLED = 'Cancelled'
}

export enum WorkOrderPriority {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export enum VendorStatus {
  PREFERRED = 'Preferred',
  STANDARD = 'Standard',
  WARNING = 'Warning'
}

export interface WorkOrderMedia {
  url: string;
  type: 'image' | 'video' | 'pdf';
  name: string;
  size?: number;
  uploadedAt?: string;
}

export interface WorkOrderItem {
  id: string;
  serviceType: string;
  description: string;
  quantity?: number;
  unitPrice?: number;
  cost?: number;
  type?: 'parts' | 'labor' | 'fee' | 'tax' | 'discount';
}

export interface VendorReview {
  id: string;
  reviewerName: string;
  date: string;
  totalRating: number;
  qualityRating: number;
  timelinessRating: number;
  costRating: number;
  comment: string;
  workOrderId?: string;
  photos?: string[];
}

export interface Vendor {
  id: string;
  slug: string;
  name: string;
  address: string;
  phone: string;
  website?: string;
  email: string;
  businessHours: string;
  services: string[];
  rating: number;
  reviewCount: number;
  status: VendorStatus;
  lastUsedDate: string;
  lastReviewedDate: string;
  totalWorkOrders: number;
  avgCost: number;
  distance: string;
  responseTime: string;
  turnaroundTime: string;
  priceRange: number;
  lat: number;
  lng: number;
  reviews: VendorReview[];
  isPublic?: boolean;
  claimed?: boolean;
  createdAt?: string;
  internalNotes?: string;
  preferredContact?: string;
  specialRates?: string;
  googlePlaceId?: string;
  isVerified?: boolean;
}

export interface Equipment {
  id: string;
  unitNumber: string;
  type: EquipmentType;
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate: string; // Map to PlateNumber in C# Truck
  status: EquipmentStatus;
  lastServiceDate: string;

  // Truck specific (C#)
  mileage?: number;
  engineType?: string;

  // Trailer specific (C#)
  trailerType?: string; // Map to Type in C# Trailer
  length?: number;
  weightCapacity?: number;

  purchasedAt?: string;
}

export interface WorkOrder {
  id: string;
  woNumber: string;
  equipmentId: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  date: string;
  technician: string;
  totalCost: number;
  partsCost: number;
  laborCost: number;
  description: string;
  vendor: string;
  vendorAddress?: string;
  items: WorkOrderItem[];
  notes?: string;
  eta?: string;
  media?: WorkOrderMedia[];
  payer?: 'Company' | 'Drivers/Contractors' | 'Others';
  isRoadside?: boolean;
  location?: string;
  driverPhone?: string;
  shareToken?: string;
  quoteSubmittedAt?: string;
  odometer?: string;
  engineHours?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ParsedLineItem {
  description: string;
  cost: number;
  type: 'parts' | 'labor' | 'fee' | 'tax';
}

export interface ReceiptParsedData {
  businessAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  businessContact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  businessName: string;
  date: string;
  items: ParsedLineItem[];
  total: number;
  notes?: string;
  unitNumber?: string;
}

export interface FuelParsedData {
  businessName: string;
  businessAddress: string;
  date: string;
  fuelType: 'Diesel' | 'DEF' | 'Gas' | 'Other';
  gallons: number;
  unitPrice: number;
  total: number;
  unitNumber?: string;
  odometer?: number;
  state?: string;
}

export interface FuelRecord {
  id: string;
  assetId: string;
  assetNumber: string;
  date: string;
  vendorName: string;
  vendorAddress?: string;
  fuelType: string;
  gallons: number;
  unitPrice: number;
  totalAmount: number;
  odometer?: number;
  state?: string;
  documentUrl?: string;
  documentFileName?: string;
  notes?: string;
}
