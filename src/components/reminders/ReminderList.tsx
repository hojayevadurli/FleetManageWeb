import { Reminder } from "@/lib/remindersApi";
import { Bell, Pencil, Trash2, Check, X, RotateCcw, Gauge, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Props {
  reminders: Reminder[];
  showUnitColumn?: boolean;
  pendingId?: string | null; // id of a reminder with a status action in-flight - disables its buttons
  onEdit: (r: Reminder) => void;
  onComplete: (r: Reminder) => void;
  onDismiss: (r: Reminder) => void;
  onReopen: (r: Reminder) => void;
  onDelete: (r: Reminder) => void;
}

const STATUS_STYLE: Record<string, string> = {
  Open: "bg-blue-100 text-blue-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Dismissed: "bg-slate-100 text-slate-500",
};

const ReminderList = ({ reminders, showUnitColumn = true, pendingId, onEdit, onComplete, onDismiss, onReopen, onDelete }: Props) => {
  if (reminders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Bell className="w-6 h-6 text-slate-300" />
        </div>
        <p className="text-sm font-bold text-slate-500">No reminders yet</p>
        <p className="text-xs text-slate-400 mt-1">Click "New Reminder" to add the first one</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="divide-y divide-slate-50">
        {reminders.map(r => {
          const milesLeft = r.dueAtOdometer != null && r.currentOdometer != null
            ? r.dueAtOdometer - r.currentOdometer
            : null;

          const isPending = pendingId === r.id;

          return (
            <div key={r.id} className={`px-5 py-4 flex items-start gap-3 hover:bg-slate-50 transition-colors group ${r.isOverdue ? "bg-rose-50/40" : ""} ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${r.isOverdue ? "bg-rose-100 text-rose-500" : "bg-blue-50 text-blue-500"}`}>
                {r.isOverdue ? <AlertTriangle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-slate-900 text-sm truncate">{r.title}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {r.status === "Open" && (
                      <>
                        <button disabled={isPending} onClick={() => onComplete(r)} title="Mark complete" className="p-1.5 rounded hover:bg-emerald-50 hover:text-emerald-600 text-slate-400 transition-all disabled:cursor-not-allowed">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button disabled={isPending} onClick={() => onDismiss(r)} title="Dismiss" className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-slate-100 text-slate-400 transition-all disabled:cursor-not-allowed">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {r.status !== "Open" && (
                      <button disabled={isPending} onClick={() => onReopen(r)} title="Reopen" className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-blue-50 hover:text-blue-600 text-slate-400 transition-all disabled:cursor-not-allowed">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button disabled={isPending} onClick={() => onEdit(r)} title="Edit" className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all disabled:cursor-not-allowed">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button disabled={isPending} onClick={() => onDelete(r)} title="Delete" className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-all disabled:cursor-not-allowed">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_STYLE[r.status]}`}>
                    {r.isOverdue ? "Overdue" : r.status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">{r.type}</span>
                  {showUnitColumn && r.unitNumber && (
                    <span className="text-[10px] text-slate-400">· Unit {r.unitNumber}</span>
                  )}
                  {r.driverName && (
                    <span className="text-[10px] text-slate-400">· {r.driverName}</span>
                  )}
                  {r.dueDate && (
                    <span className="text-[10px] text-slate-400">· Due {format(parseISO(r.dueDate), "MMM d, yyyy")}</span>
                  )}
                  {r.dueAtOdometer != null && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <Gauge className="w-2.5 h-2.5" />
                      {r.dueAtOdometer.toLocaleString()} mi
                      {milesLeft != null && (
                        <span className={milesLeft < 0 ? "text-rose-500 font-bold" : ""}>
                          {" "}({milesLeft < 0 ? `${Math.abs(milesLeft).toLocaleString()} over` : `${milesLeft.toLocaleString()} left`})
                        </span>
                      )}
                    </span>
                  )}
                  {(r.repeatIntervalDays || r.repeatIntervalMiles) && (
                    <span className="text-[10px] text-slate-400">
                      · Repeats every {r.repeatIntervalDays ? `${r.repeatIntervalDays}d` : ""}{r.repeatIntervalDays && r.repeatIntervalMiles ? " / " : ""}{r.repeatIntervalMiles ? `${r.repeatIntervalMiles}mi` : ""}
                    </span>
                  )}
                </div>
                {r.notes && <p className="text-xs text-slate-500 mt-1.5">{r.notes}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReminderList;
