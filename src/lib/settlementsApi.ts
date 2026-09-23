import api from "@/lib/Api";

// ── Suggested values (free text on the server — these are frontend suggestions only) ──

export const DEDUCTION_TYPES = [
  "Trailer Rental", "Company Fee", "Insurance", "Eld Logbook", "Tolls", "Other", "Toll",
];

export const DEDUCTION_DESCRIPTIONS = [
  "Trailer rental", "Dispatch Fee", "Cargo Insurance", "ELD Logbook", "Prepass Device", "Shop", "Auto calculated Toll cost",
];

export const BILL_INFO_NATURES = ["Driver Pay", "Total Gross"];

export const OTHER_EXPENSE_TYPES = [
  "Fuel", "Parking", "Scale", "Hotel", "Repair", "Maintenance", "Towing", "Roadside",
  "Truck Wash", "Parts", "Tires", "Permits", "Registration", "IFTA", "Insurance",
  "Truck Payment", "Trailer Payment", "Driver Advance", "Other",
];

// ── Header ───────────────────────────────────────────────────────────────

export interface SettlementUpsert {
  truckOwnerId: string;
  equipmentId: string;
  primaryOperatorId: string;
  externalId?: string;
  settlementNumber?: string;
  billDate: string;
  periodStart: string;
  periodEnd: string;
  checkDate?: string;
  notes?: string;
}

export interface SettlementSummary {
  id: string;
  externalId?: string;
  settlementNumber?: string;
  vendorName: string;
  unitNumber: string;
  driverName: string;
  billDate: string;
  periodStart: string;
  periodEnd: string;
  checkDate?: string;
  totalGrossBill: number;
  deductionsTotal: number;
  totalNetBill: number;
  otherExpensesTotal: number;
  adjustedNetPay: number;
}

// ── Section 2: Loads ─────────────────────────────────────────────────────

export interface SettlementLoadInput {
  loadNumber?: string;
  pickupLocation?: string;
  deliveryLocation?: string;
  deliveryDate?: string;
  loadedMiles: number;
  emptyMiles: number;
  totalMiles: number;
  grossAmount: number;
  paymentAmount: number;
}

export interface SettlementLoad extends SettlementLoadInput {
  id: string;
}

// ── Section 3: Toll Transactions ────────────────────────────────────────

export interface SettlementTollInput {
  type: string;
  operatorId?: string;
  driverNameRaw?: string;
  transactionDate?: string;
  description?: string;
  exitPlaza?: string;
  city?: string;
  state?: string;
  totalAmount: number;
}

export interface SettlementToll extends SettlementTollInput {
  id: string;
  driverName: string;
}

// ── Section 4: Bill Information ─────────────────────────────────────────

export interface SettlementBillInfoInput {
  nature: string;
  description?: string;
  quantity: number;
  rate: number;
  totalAmount: number;
}

export interface SettlementBillInfoItem extends SettlementBillInfoInput {
  id: string;
}

// ── Section 5: Deductions ───────────────────────────────────────────────

export interface SettlementDeductionInput {
  type: string;
  description?: string;
  quantity: number;
  rate: number;
  totalAmount: number;
  syncFromTollTotal: boolean;
}

export interface SettlementDeductionItem extends SettlementDeductionInput {
  id: string;
}

// ── Section 6: Other Expenses ───────────────────────────────────────────

export interface SettlementExpenseInput {
  expenseDate: string;
  type: string;
  description?: string;
  equipmentId?: string;
  operatorId?: string;
  quantity: number;
  rate: number;
  totalAmount: number;
}

export interface SettlementExpense extends SettlementExpenseInput {
  id: string;
  unitNumber?: string;
  driverName?: string;
  createdAt: string;
}

// ── Detail (full document) ──────────────────────────────────────────────

export interface SettlementDetail {
  id: string;
  externalId?: string;
  settlementNumber?: string;

  truckOwnerId: string;
  vendorName: string;

  equipmentId: string;
  unitNumber: string;

  primaryOperatorId: string;
  driverName: string;
  driverId?: string;

  billDate: string;
  periodStart: string;
  periodEnd: string;
  checkDate?: string;
  notes?: string;

  trucks: number;
  drivers: number;
  trips: number;

  loads: SettlementLoad[];
  tollTransactions: SettlementToll[];
  billInfoItems: SettlementBillInfoItem[];
  deductionItems: SettlementDeductionItem[];
  otherExpenses: SettlementExpense[];

  totalGrossBill: number;
  deductionsTotal: number;
  totalNetBill: number;

  importedTotalGrossBill?: number;
  importedDeductionsTotal?: number;
  importedTotalNetBill?: number;

  otherExpensesTotal: number;
  adjustedNetPay: number;

  createdAt: string;
  updatedAt: string;
}

// ── Pull expenses from Fleet records (Tolls / Fuel / Maintenance) ──────────

export interface ImportableToll {
  tollRecordId: string;
  tripDate: string;
  originAddress?: string;
  destinationAddress?: string;
  routeDescription?: string;
  totalCostCash: number;
  totalCostEzPass?: number;
  source: string;
}

export interface ImportableFuel {
  fuelRecordId: string;
  date: string;
  vendorName: string;
  fuelType: string;
  gallons: number;
  totalAmount: number;
}

export interface ImportableMaintenance {
  workOrderId: string;
  date: string;
  title?: string;
  category: string;
  vendorName?: string;
  totalCost: number;
}

export interface SettlementImportable {
  tolls: ImportableToll[];
  fuel: ImportableFuel[];
  maintenance: ImportableMaintenance[];
}

export interface SettlementImportRequest {
  tollRecordIds: string[];
  fuelRecordIds: string[];
  workOrderIds: string[];
}

// ── Scan PDF (AI extraction) ────────────────────────────────────────────

export interface SettlementScanResult {
  billDate?: string;
  periodStart?: string;
  periodEnd?: string;
  checkDate?: string;
  vendorName?: string;
  mcNumber?: string;
  externalId?: string;
  settlementNumber?: string;
  driverName?: string;
  driverId?: string;
  unitNumber?: string;
  totalGrossBill?: number;
  deductions?: number;
  totalNetBill?: number;
  loads: SettlementLoadInput[];
  tollTransactions: SettlementTollInput[];
  billInformation: SettlementBillInfoInput[];
  deductionItems: SettlementDeductionInput[];
}

export interface SettlementScanImportRequest {
  checkDate?: string;
  externalId?: string;
  settlementNumber?: string;
  importedTotalGrossBill?: number;
  importedDeductionsTotal?: number;
  importedTotalNetBill?: number;
  loads: SettlementLoadInput[];
  tollTransactions: SettlementTollInput[];
  billInfoItems: SettlementBillInfoInput[];
  deductionItems: SettlementDeductionInput[];
}

export const settlementsApi = {
  list: (params?: { equipmentId?: string; truckOwnerId?: string; page?: number; pageSize?: number }) =>
    api.get<SettlementSummary[]>("/settlements", { params }).then(r => r.data),

  get: (id: string) =>
    api.get<SettlementDetail>(`/settlements/${id}`).then(r => r.data),

  create: (dto: SettlementUpsert) =>
    api.post<SettlementDetail>("/settlements", dto).then(r => r.data),

  update: (id: string, dto: SettlementUpsert) =>
    api.put<SettlementDetail>(`/settlements/${id}`, dto).then(r => r.data),

  remove: (id: string) =>
    api.delete(`/settlements/${id}`).then(() => undefined),

  addLoad: (settlementId: string, dto: SettlementLoadInput) =>
    api.post<SettlementDetail>(`/settlements/${settlementId}/loads`, dto).then(r => r.data),
  updateLoad: (settlementId: string, rowId: string, dto: SettlementLoadInput) =>
    api.put<SettlementDetail>(`/settlements/${settlementId}/loads/${rowId}`, dto).then(r => r.data),
  deleteLoad: (settlementId: string, rowId: string) =>
    api.delete<SettlementDetail>(`/settlements/${settlementId}/loads/${rowId}`).then(r => r.data),

  addToll: (settlementId: string, dto: SettlementTollInput) =>
    api.post<SettlementDetail>(`/settlements/${settlementId}/tolls`, dto).then(r => r.data),
  updateToll: (settlementId: string, rowId: string, dto: SettlementTollInput) =>
    api.put<SettlementDetail>(`/settlements/${settlementId}/tolls/${rowId}`, dto).then(r => r.data),
  deleteToll: (settlementId: string, rowId: string) =>
    api.delete<SettlementDetail>(`/settlements/${settlementId}/tolls/${rowId}`).then(r => r.data),

  addBillInfoItem: (settlementId: string, dto: SettlementBillInfoInput) =>
    api.post<SettlementDetail>(`/settlements/${settlementId}/bill-items`, dto).then(r => r.data),
  updateBillInfoItem: (settlementId: string, rowId: string, dto: SettlementBillInfoInput) =>
    api.put<SettlementDetail>(`/settlements/${settlementId}/bill-items/${rowId}`, dto).then(r => r.data),
  deleteBillInfoItem: (settlementId: string, rowId: string) =>
    api.delete<SettlementDetail>(`/settlements/${settlementId}/bill-items/${rowId}`).then(r => r.data),

  addDeduction: (settlementId: string, dto: SettlementDeductionInput) =>
    api.post<SettlementDetail>(`/settlements/${settlementId}/deductions`, dto).then(r => r.data),
  updateDeduction: (settlementId: string, rowId: string, dto: SettlementDeductionInput) =>
    api.put<SettlementDetail>(`/settlements/${settlementId}/deductions/${rowId}`, dto).then(r => r.data),
  deleteDeduction: (settlementId: string, rowId: string) =>
    api.delete<SettlementDetail>(`/settlements/${settlementId}/deductions/${rowId}`).then(r => r.data),

  addExpense: (settlementId: string, dto: SettlementExpenseInput) =>
    api.post<SettlementDetail>(`/settlements/${settlementId}/expenses`, dto).then(r => r.data),
  updateExpense: (settlementId: string, rowId: string, dto: SettlementExpenseInput) =>
    api.put<SettlementDetail>(`/settlements/${settlementId}/expenses/${rowId}`, dto).then(r => r.data),
  deleteExpense: (settlementId: string, rowId: string) =>
    api.delete<SettlementDetail>(`/settlements/${settlementId}/expenses/${rowId}`).then(r => r.data),

  getImportable: (settlementId: string) =>
    api.get<SettlementImportable>(`/settlements/${settlementId}/importable`).then(r => r.data),

  import: (settlementId: string, req: SettlementImportRequest) =>
    api.post<SettlementDetail>(`/settlements/${settlementId}/import`, req).then(r => r.data),

  importScan: (settlementId: string, req: SettlementScanImportRequest) =>
    api.post<SettlementDetail>(`/settlements/${settlementId}/import-scan`, req).then(r => r.data),

  syncLinks: (settlementId: string) =>
    api.post<SettlementDetail>(`/settlements/${settlementId}/sync-links`).then(r => r.data),
};
