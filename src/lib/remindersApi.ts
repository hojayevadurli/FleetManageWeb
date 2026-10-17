import api from "@/lib/Api";

export const REMINDER_TYPES = [
  "Oil Change", "Tire Rotation", "Brake Inspection", "DOT Inspection",
  "Registration Renewal", "Insurance Renewal", "License Renewal",
  "Preventive Maintenance", "Tire Replacement", "Other",
];

export interface ReminderUpsert {
  equipmentId?: string;
  operatorId?: string;
  title: string;
  type: string;
  notes?: string;
  dueDate?: string;        // yyyy-MM-dd
  dueAtOdometer?: number;
  repeatIntervalDays?: number;
  repeatIntervalMiles?: number;
}

export interface Reminder extends ReminderUpsert {
  id: string;
  unitNumber?: string;
  driverName?: string;
  currentOdometer?: number;
  status: "Open" | "Completed" | "Dismissed";
  isOverdue: boolean;
  completedAt?: string;
  createdAt: string;
}

export const remindersApi = {
  list: (params?: { equipmentId?: string; status?: string; page?: number; pageSize?: number }) =>
    api.get<Reminder[]>("/reminders", { params }).then(r => r.data),

  get: (id: string) =>
    api.get<Reminder>(`/reminders/${id}`).then(r => r.data),

  create: (dto: ReminderUpsert) =>
    api.post<Reminder>("/reminders", dto).then(r => r.data),

  update: (id: string, dto: ReminderUpsert) =>
    api.put<Reminder>(`/reminders/${id}`, dto).then(r => r.data),

  complete: (id: string) =>
    api.post<Reminder>(`/reminders/${id}/complete`).then(r => r.data),

  dismiss: (id: string) =>
    api.post<Reminder>(`/reminders/${id}/dismiss`).then(r => r.data),

  reopen: (id: string) =>
    api.post<Reminder>(`/reminders/${id}/reopen`).then(r => r.data),

  remove: (id: string) =>
    api.delete(`/reminders/${id}`).then(() => undefined),
};
