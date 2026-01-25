export enum EquipmentOperationalStatus {
  Active = 1,
  InShop = 2,
  OutOfService = 3,
  Sold = 4
}



// 63+ types supported now
export type EquipmentType = string;

export enum WorkOrderStatus {
  Draft = 0,
  Open = 1,
  InProcess = 2,
  Completed = 3,
  Closed = 4,
  Cancelled = 5,
  Paid = 6
}

export enum WorkOrderPriority {
  Low = 0,
  Normal = 1,
  High = 2,
  Critical = 3
}

export enum WorkOrderCostSource {
  Estimated = 0,
  Manual = 1,
  Invoiced = 2
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
  partNumber?: string;
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
  type: EquipmentType; // "Truck", "Trailer", "Forklift", etc.
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  serialNumber?: string;
  licensePlate?: string;
  status: EquipmentOperationalStatus;
  lastServiceDate?: string;
  acquiredDate?: string;


  inServiceDate?: string;
  outOfServiceDate?: string;

  // Common optional specs
  mileage?: number;
  hours?: number;
  engineType?: string;
  fuelType?: string;
  length?: number;
  weightCapacity?: number;
  licenseState?: string;
  purchasedAt?: string;
  notes?: string;

  // Flexible bag for extra properties if needed
  specs?: Record<string, string | number | boolean>;

  // Categorization
  specificType?: string; // e.g. "Sleeper Tractor", "Dry Van"

  // Department/Industry links
  fleetCategoryId?: number;
  fleetCategoryName?: string;
  equipmentTypeId?: string;
  equipmentTypeName?: string;
  documents?: EquipmentDocument[];
}

export enum EquipmentDocRole {
  General = 0,
  Registration = 1,
  Title = 2,
  Insurance = 3,
  Warranty = 4,
  Lease = 5,
  Other = 6,
  DOTInspection = 7
}

export interface EquipmentDocument {
  id: string;
  equipmentId: string;
  documentId: string;
  fileUrl: string;
  fileType: string;
  vendorNameRaw?: string;
  docRole: EquipmentDocRole;
  startDate?: string;
  expirationDate?: string;
  addedAt: string;
}

export interface Warranty {
  id: string;
  description: string;
  provider: string;
  startDate?: string;
  endDate?: string;
  status: 'Active' | 'Expired' | 'Pending';
  files?: { name: string; url: string; type: string }[];
}

// Backend DTO structure
export interface EquipmentDto {
  id: string;
  equipmentTypeId: string;
  equipmentTypeName: string;
  equipmentTypeCode: string;
  fleetCategoryId: number;
  fleetCategoryName: string;
  lastServiceDate?: string;
  unitNumber: string;
  displayName: string;
  vin: string;
  serialNumber: string;
  make: string;
  model: string;
  year: number;
  plateNumber: string;
  operationalStatus: EquipmentOperationalStatus;
  odometerCurrent: number;
  hoursCurrent: number;
  acquiredDate: string;
  inServiceDate: string;
  outOfServiceDate: string;
  notes: string;
  recalls: any[]; // Define clearer recall type later if needed
  documents: EquipmentDocument[];
}

export interface EquipmentTypeDto {
  id: number;
  industryId: number;
  fleetCategoryId?: number;
  name: string;
  code: string;
  meterMode: string; // "odometer", "hours", "both"
  hasVin: boolean;
  hasSerial: boolean;
  isActive: boolean;
}

export interface WorkOrder {
  id: string;
  woNumber: string;
  equipmentId: string;
  vendorId?: string | null;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  date: string; // Map from OpenedAt
  closedAt?: string;
  technician: string;
  totalCost: number; // Estimated or Manual
  partsCost: number;
  laborCost: number;
  title: string;
  complaint: string;
  diagnosis?: string;
  resolution?: string;
  notes?: string;
  costSource: WorkOrderCostSource;
  estimatedTotal: number;
  manualActualTotal: number;
  description: string; // Shared field if needed
  vendor?: string;
  vendorAddress?: string;
  items: WorkOrderItem[];
  media?: WorkOrderMedia[];
  odometer?: number;
  hours?: number;
  payer?: string;
}

export interface ServiceHistoryLine {
  id: string;
  serviceHistoryId: string;
  type: string; // part/labor/fee/misc
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
  partNumber?: string;
}

export interface ServiceHistory {
  id: string;
  equipmentId: string;
  workOrderId?: string;
  vendorId?: string;
  vendorNameRaw?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  odometer?: number;
  totalAmount: number;
  taxAmount: number;
  summary?: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lines: ServiceHistoryLine[];
}

export interface ServiceHistoryUpsertDto {
  equipmentId: string;
  workOrderId?: string;
  vendorId?: string | null;
  vendorNameRaw?: string | null;
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  odometer?: number | null;
  totalAmount: number;
  taxAmount: number;
  summary?: string | null;
  category: string;
  status: string;
  lines: {
    type: string;
    description: string;
    qty: number;
    unitPrice: number;
    amount: number;
    partNumber?: string | null;
  }[];
}

export interface WorkOrderLineDto {
  id: string;
  type: string;
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
  partNumber?: string;
}

export interface WorkOrderDocumentDto {
  id: string;
  fileUrl: string;
  fileType: string;
  docKind: string;
  status: string;
  confidenceScore?: number;
  createdAt: string;
}

export interface WorkOrderDto {
  id: string;
  isDeleted: boolean;
  deletedAt?: string;
  equipmentId: string;
  vendorId?: string;
  workOrderNumber?: string;
  odometerAtService?: number;
  hoursAtService?: number;
  openedAt: string;
  closedAt?: string;
  title: string;
  complaint: string;
  diagnosis?: string;
  resolution?: string;
  notes?: string;
  estimatedTotal: number;
  manualActualTotal: number;
  status: string;
  priority: string;
  costSource: string;
  lines: WorkOrderLineDto[];
  documents: WorkOrderDocumentDto[];
  vendorName?: string;
  vendorAddress?: string;
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
