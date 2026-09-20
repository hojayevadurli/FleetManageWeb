import api from "@/lib/Api";

export type ExpenseCategory = "Toll" | "Fuel" | "Maintenance" | "Other";

export interface UnifiedExpense {
  category: ExpenseCategory;
  id: string;
  date: string;
  description: string;
  amount: number;
  isEditableHere: boolean;
  settlementId?: string;
  settlementLabel?: string;
}

export interface UnifiedExpenses {
  items: UnifiedExpense[];
  totalTolls: number;
  totalFuel: number;
  totalMaintenance: number;
  totalOther: number;
  grandTotal: number;
}

export interface ExpenseUpsert {
  expenseDate: string;
  type: string;
  description?: string;
  equipmentId?: string;
  operatorId?: string;
  quantity: number;
  rate: number;
  totalAmount: number;
}

export interface ExpenseRecord extends ExpenseUpsert {
  id: string;
  unitNumber?: string;
  driverName?: string;
  createdAt: string;
  settlementId?: string;
  settlementLabel?: string;
}

export const expensesApi = {
  list: (equipmentId: string) =>
    api.get<UnifiedExpenses>("/expenses", { params: { equipmentId } }).then(r => r.data),

  get: (id: string) =>
    api.get<ExpenseRecord>(`/expenses/${id}`).then(r => r.data),

  create: (dto: ExpenseUpsert) =>
    api.post<ExpenseRecord>("/expenses", dto).then(r => r.data),

  update: (id: string, dto: ExpenseUpsert) =>
    api.put<ExpenseRecord>(`/expenses/${id}`, dto).then(r => r.data),

  remove: (id: string) =>
    api.delete(`/expenses/${id}`).then(() => undefined),
};
