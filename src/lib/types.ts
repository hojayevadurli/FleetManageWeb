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
  role?: DocumentRole;
  docKind?: string;
}

export interface WorkOrderItem {
  id: string;
  serviceType: string;
  description: string;
  quantity: number;
  unitPrice: number;
  cost: number;
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

  assignedOperatorId?: string;
  assignedOperatorName?: string;

  // Categorization
  specificType?: string; // e.g. "Sleeper Tractor", "Dry Van"

  // Department/Industry links
  fleetCategoryId?: number;
  fleetCategoryName?: string;
  equipmentTypeId?: string;
  equipmentTypeName?: string;
  documents?: EquipmentDocument[];
}

// Unified DocumentRole enum for all entity types
export enum DocumentRole {
  General = "General",

  // Equipment / Vehicle
  Insurance = "Insurance",
  Registration = "Registration",
  Title = "Title",
  Warranty = "Warranty",
  Lease = "Lease",
  DOTInspection = "DOTInspection",
  ScaleTicket = "ScaleTicket",

  // Operator
  OperatorLicense = "OperatorLicense", // CDL
  MedicalCard = "MedicalCard",
  TrainingCert = "TrainingCert", // General Training
  Contract = "Contract",

  // Incidents / Tickets
  IncidentReport = "IncidentReport",
  Citation = "Citation",
  PoliceReport = "PoliceReport",
  WitnessStatement = "WitnessStatement",

  // Screening
  MVR = "MVR",
  BackgroundCheck = "BackgroundCheck",
  DrugTest = "DrugTest",
  ClearinghouseQuery = "ClearinghouseQuery",

  // Onboarding / Specific Training
  RoadTest = "RoadTest",
  Orientation = "Orientation",
  SafetyTraining = "SafetyTraining",

  TWIC = "TWIC",
  HazmatEndorsement = "HazmatEndorsement",

  // Work Order
  Invoice = "Invoice", // WorkOrderInvoice
  Receipt = "Receipt", // WorkOrderReceipt
  Quote = "Quote", // WorkOrderEstimate

  WorkOrder = "WorkOrder", // General/Legacy

  PhotoBefore = "PhotoBefore",
  PhotoAfter = "PhotoAfter",
  Inspection = "Inspection",

  WorkOrderOther = "WorkOrderOther",

  // Assignment Attachments
  AssignmentPhotoStart = "AssignmentPhotoStart",
  AssignmentPhotoEnd = "AssignmentPhotoEnd",
  AssignmentVideoStart = "AssignmentVideoStart",
  AssignmentVideoEnd = "AssignmentVideoEnd",

  // Other
  Other = "Other"
}

export interface DocumentAttachment {
  id: string;             // PublicId of the Link or Document
  fileUrl: string;
  fileType: string;
  docKind?: string;       // AI classification
  role: DocumentRole;

  // Metadata
  startDate?: string;     // YYYY-MM-DD
  expirationDate?: string;// YYYY-MM-DD
  isActive: boolean;
  amount?: number;
  providerName?: string;
  externalRef?: string;   // Invoice #, License #, etc.
  notes?: string;

  createdAt: string;
  addedAt: string;
}

// Payload for attaching a document
export interface AttachDocumentPayload {
  documentId: string;     // ID from the upload response
  role: DocumentRole;
  startDate?: string;
  expirationDate?: string;
  amount?: number;
  providerName?: string;
  externalRef?: string;
  notes?: string;
  isActive?: boolean;
}

// Legacy alias for backward compatibility
export const EquipmentDocRole = DocumentRole;

export interface EquipmentDocument {
  id: string;
  equipmentId: string;
  documentId: string;
  fileUrl: string;
  fileType: string;
  docKind?: string;
  status?: string;
  confidenceScore?: number;
  vendorNameRaw?: string;
  docRole: DocumentRole;
  startDate?: string;
  expirationDate?: string;
  addedAt: string;
  createdAt?: string;
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
  assignedOperatorId?: string;
  assignedOperatorName?: string;
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
  createdAt?: string;
  updatedAt?: string;
  openedAt?: string;
  attachmentUrl?: string; // Mapped from document or preview
  attachmentFileName?: string;
  assetNumber?: string; // Mapped for display
  rating?: number;

  reviewText?: string;
  ratedAt?: string;
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
  role?: DocumentRole;        // DocumentRole enum (Invoice=50, Receipt=51, etc.)
  amount?: number;            // Invoice/receipt amount
  providerName?: string;      // Vendor/provider name
  startDate?: string;         // Service/invoice date
  externalRef?: string;       // Invoice number, reference
  notes?: string;             // Additional notes
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
  rating?: number;
  ratingComment?: string;
  reviewText?: string; // Normalized field
  ratedAt?: string;
  createdAt?: string;
  updatedAt?: string;
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
  odometer?: number;
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

export interface DriverLicenseParsedData {
  firstName: string;
  lastName: string;
  dob?: string;
  address?: string; // Full address string fallback
  addressComponents?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  dlNumber?: string;
  dlIssueDate?: string;
  dlExpireDate?: string;
  licenseState?: string;
  confidence?: Record<string, number>;
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

export enum DriverOperatingStatus {
  Active = 'Active',
  OnLeave = 'On Leave',
  InOrientation = 'In Orientation',
  Suspended = 'Inactive',
  Terminated = 'Terminated'
}

export enum DriverHiringStage {
  Lead = 'Lead',
  Applied = 'Applied',
  Screening = 'Screening',
  Interview = 'Interview',
  Offer = 'Offer',
  Checks = 'Checks',
  Onboarding = 'Onboarding'
}

export enum DriverComplianceStatus {
  Good = 'Good',
  AttentionNeeded = 'AttentionNeeded',
  NonCompliant = 'NonCompliant'
}

export interface Driver {
  id: string;
  tenantId?: number;
  publicId?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;

  // Revised Status System
  operatingStatus?: DriverOperatingStatus;
  hiringStage?: DriverHiringStage;
  isBlacklisted: boolean;

  complianceStatus: DriverComplianceStatus;

  photoUrl?: string;
  driverNumber?: string;

  // Personal Info
  dob?: string;
  address?: string; // Full string for now, could be structured later

  // License Info
  licenseNumber?: string;
  licenseState?: string;
  dlIssueDate?: string;
  dlExpireDate?: string;
  medicalCardExpiration?: string;

  hireDate?: string;
  terminationDate?: string;

  homeTerminal?: string;
  currentAssetId?: string;
  currentAssettNumber?: string;

  rating?: number;
  totalSpend?: number;

  documents?: DriverDocument[];
  notes?: DriverNote[];
}

export interface DriverDocument {
  id: string;
  driverId: string;
  docType: string; // CDL, MedicalCard, etc.
  fileUrl: string;
  fileName: string;
  status: 'Valid' | 'Expiring' | 'Expired';
  issuedDate?: string;
  expirationDate?: string;
  daysUntilExpiration?: number;
}

export interface DriverNote {
  id: string;
  driverId: string;
  category: 'HR' | 'Safety' | 'Performance' | 'General';
  content: string;
  createdBy: string;
  createdAt: string;
  isPinned: boolean;
}

export interface TimeOffRequest {
  id: string;
  driverId: string;
  driverName: string;
  startDate: string;
  endDate: string;
  type: 'HomeTime' | 'Vacation' | 'Sick' | 'Personal';
  status: 'Pending' | 'Approved' | 'Denied';
  reason?: string;
  requestedAt: string;
}

// Operator (Driver) Management Types matching Backend DTOs

export enum OperatorStatus {
  Active = 1,
  Inactive = 2,
  OnLeave = 3,
  Terminated = 4
}

// Equipment Assignment Types
export interface OperatorAssignment {
  id: string;
  operatorId: string;
  equipmentId: string;
  equipmentNumber?: string;
  equipmentType?: string;
  startAt: string;
  endAt?: string | null;
  assignmentType: 'Primary' | 'Temporary' | 'Team';
  notes?: string;
  assignedBy: string;
  createdAt: string;
}

export interface CreateAssignmentDto {
  equipmentId: string;
  startAt: string;
  assignmentType: 'Primary' | 'Temporary' | 'Team';
  notes?: string;
  startPhotoIds?: string[]; // Document IDs for start photos/videos
}

export interface AssignmentDto {
  id: string;
  operatorId: string;
  operatorName: string;
  equipmentId: string;
  equipmentUnitNumber: string;
  equipmentType: string;
  startAt: string;
  endAt?: string | null;
  assignmentType: string;
  notes?: string;
  createdAt: string;
  startAttachments?: DocumentAttachment[];
  endAttachments?: DocumentAttachment[];
}

export interface EndAssignmentDto {
  endAt: string;
  endPhotoIds?: string[]; // Document IDs for end photos/videos
}



export interface OperatorDocumentDto {
  id: string;
  fileUrl: string;
  fileType: string;
  docKind: string;
  status: string;
  confidenceScore?: number;
  createdAt: string;
  role: DocumentRole;
  startDate?: string;
  expirationDate?: string;
  isActive: boolean;
  externalRef?: string;
  providerName?: string;
}

export interface OperatorDto {
  id: string; // PublicId
  firstName: string;
  lastName: string;
  fullName: string;
  photoUrl?: string;
  email?: string;
  phone?: string;
  status: OperatorStatus; // OperatorStatus enum
  employeeId?: string;
  licenseNumber?: string;
  licenseState?: string;
  licenseExpirationDate?: string; // DateOnly as string
  dateOfBirth?: string; // DateOnly as string
  hireDate?: string; // DateOnly as string
  terminationDate?: string; // DateOnly as string
  notes?: string;
  createdAt: string;
  documents: OperatorDocumentDto[];
}

export interface CreateOperatorDto {
  firstName: string;
  lastName: string;
  photoUrl?: string;
  email?: string;
  phone?: string;
  status: OperatorStatus;
  employeeId?: string;
  licenseNumber?: string;
  licenseState?: string;
  licenseExpirationDate?: string;
  dateOfBirth?: string;
  hireDate?: string;
  notes?: string;
  documentIds?: string[];
}

export interface UpdateOperatorDto {
  firstName: string;
  lastName: string;
  photoUrl?: string;
  email?: string;
  phone?: string;
  status: OperatorStatus;
  employeeId?: string;
  licenseNumber?: string;
  licenseState?: string;
  licenseExpirationDate?: string;
  dateOfBirth?: string;
  hireDate?: string;
  terminationDate?: string;
  notes?: string;
  documentIds?: string[];
}

export interface AddOperatorAttachmentDto {
  documentId: string;
  role: DocumentRole;
  startDate?: string;
  expirationDate?: string;
  isActive: boolean;
  externalRef?: string;
  providerName?: string;
  notes?: string;
}

export interface EmploymentType {
  id: number;
  name: string;
  description?: string;
}

export interface OperatorContract {
  id: string;
  operatorId: string;
  employmentTypeId: number;
  employmentTypeName: string;
  // driverRole removed in favor of relation
  paymentType: string; // Per Mile, Percentage, Hourly
  paymentRate: number; // e.g. 0.65 or 25.00
  payFrequency?: string; // Weekly, Bi-Weekly, Monthly
  grossShare?: number;
  driverType: string; // Solo, Team
  showTripRates: boolean;
  showLoadedMileage: boolean;
  showEmptyMileage: boolean;
  coDriverId?: string;
  startDate: string;
  endDate?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateOperatorContractDto {
  employmentTypeId: number;
  paymentType: string;
  paymentRate: number;
  payFrequency?: string;
  grossShare?: number;
  driverType: string;
  showTripRates: boolean;
  showLoadedMileage: boolean;
  showEmptyMileage: boolean;
  coDriverId?: string;
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface UpdateOperatorContractDto {
  employmentTypeId?: number;
  paymentType?: string;
  paymentRate?: number;
  payFrequency?: string;
  grossShare?: number;
  driverType?: string;
  showTripRates?: boolean;
  showLoadedMileage?: boolean;
  showEmptyMileage?: boolean;
  coDriverId?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface OperatorSpendTransactionDto {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  status: string;
  linkedEntityId: string;
  linkedEntityType: string;
}



export enum IncidentType {
  Accident = 'Accident',
  Violation = 'Violation',
  Warning = 'Warning',
  Complaint = 'Complaint',
  DotInspection = 'DotInspection',
  Other = 'Other'
}

export enum IncidentStatus {
  Open = 'Open',
  UnderReview = 'UnderReview',
  Disputed = 'Disputed',
  Closed = 'Closed'
}

export interface OperatorIncident {
  id: string; // PublicId
  operatorId: string;
  operatorName: string;
  equipmentId?: string;
  equipmentUnitNumber?: string;
  type: IncidentType;
  date: string;
  location: string;
  description?: string;
  fineAmount?: number;
  points?: number;
  status: IncidentStatus;
  isAtFault: boolean;

  reportNumber?: string;
  inspectionLevel?: string;
  isOutOfService?: boolean;
  violations?: string; // JSON or text
  inspectedParty?: string;

  createdAt: string;
  documents: OperatorDocumentDto[];
}

export interface CreateIncidentDto {
  operatorId: string;
  equipmentId?: string;
  type: IncidentType;
  date: string; // ISO string
  location: string;
  description?: string;
  fineAmount?: number;
  points?: number;
  status?: IncidentStatus;
  isAtFault?: boolean;

  reportNumber?: string;
  inspectionLevel?: string;
  isOutOfService?: boolean;
  violations?: string;
  inspectedParty?: string;

  documentIds?: string[];
}

export interface UpdateIncidentDto {
  type?: IncidentType;
  date?: string;
  location?: string;
  description?: string;
  fineAmount?: number;
  points?: number;
  status?: IncidentStatus;
  isAtFault?: boolean;

  reportNumber?: string;
  inspectionLevel?: string;
  isOutOfService?: boolean;
  violations?: string;
  inspectedParty?: string;

  documentIds?: string[];
}
