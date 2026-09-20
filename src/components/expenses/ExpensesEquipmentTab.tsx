import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { expensesApi, UnifiedExpenses, UnifiedExpense, ExpenseRecord } from "@/lib/expensesApi";
import { operatorsApi } from "@/lib/operatorsApi";
import { Equipment } from "@/lib/types";
import SettlementRowDialog from "@/components/settlements/SettlementRowDialog";
import {
  Receipt, Wrench, Fuel as FuelIcon, Tag, Plus, Loader2, Wallet,
  Pencil, Trash2, ExternalLink,
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface Props {
  equipment: Equipment;
}

const money = (n: number) => `$${n.toFixed(2)}`;

const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  Toll:        { icon: <Receipt className="w-4 h-4" />,  color: "bg-blue-50 text-blue-500",   label: "Toll" },
  Fuel:        { icon: <FuelIcon className="w-4 h-4" />, color: "bg-emerald-50 text-emerald-500", label: "Fuel" },
  Maintenance: { icon: <Wrench className="w-4 h-4" />,   color: "bg-orange-50 text-orange-500", label: "Maintenance" },
  Other:       { icon: <Tag className="w-4 h-4" />,       color: "bg-slate-100 text-slate-500", label: "Other" },
};

const ExpensesEquipmentTab = ({ equipment }: Props) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<UnifiedExpenses | null>(null);
  const [operatorOptions, setOperatorOptions] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogRow, setDialogRow] = useState<{ open: boolean; initial: ExpenseRecord | null }>({ open: false, initial: null });

  const equipmentOptions = [{ id: equipment.id, label: equipment.unitNumber }];

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await expensesApi.list(equipment.id);
      setData(result);
    } catch {
      toast({ title: "Failed to load expenses", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    operatorsApi.getAll(1, 500)
      .then(ops => setOperatorOptions(ops.map((o: any) => ({ id: o.id, label: o.fullName }))))
      .catch(() => {});
  }, [equipment.id]);

  const openAdd = () => setDialogRow({ open: true, initial: null });

  const openEdit = async (item: UnifiedExpense) => {
    try {
      const full = await expensesApi.get(item.id);
      setDialogRow({ open: true, initial: full });
    } catch {
      toast({ title: "Failed to load expense", variant: "destructive" });
    }
  };

  const handleSubmit = async (payload: any) => {
    if (dialogRow.initial) {
      await expensesApi.update(dialogRow.initial.id, payload);
      toast({ title: "Expense updated" });
    } else {
      await expensesApi.create(payload);
      toast({ title: "Expense added" });
    }
    fetchData();
  };

  const handleDelete = async (item: UnifiedExpense) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await expensesApi.remove(item.id);
      fetchData();
      toast({ title: "Expense deleted" });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.response?.data?.error, variant: "destructive" });
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const tiles = [
    { label: "Toll", value: data.totalTolls, color: "text-blue-600" },
    { label: "Fuel", value: data.totalFuel, color: "text-emerald-600" },
    { label: "Maintenance", value: data.totalMaintenance, color: "text-orange-600" },
    { label: "Other", value: data.totalOther, color: "text-slate-700" },
  ];

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900">Expenses</h3>
          <p className="text-xs text-slate-400 mt-0.5">Toll, Fuel, Maintenance and Other Expenses for this unit</p>
        </div>
        <Button
          onClick={openAdd}
          className="bg-blue-600 text-white h-9 px-4 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </Button>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {tiles.map(t => (
          <div key={t.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.label}</p>
            <p className={`text-xl font-black ${t.color}`}>{money(t.value)}</p>
          </div>
        ))}
        <div className="bg-slate-900 rounded-2xl p-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
          <p className="text-xl font-black text-white">{money(data.grandTotal)}</p>
        </div>
      </div>

      {/* List */}
      {data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-500">No expenses recorded for this unit yet</p>
          <p className="text-xs text-slate-400 mt-1">Click "Add Expense" to log the first one</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {data.items.map(item => {
              const meta = CATEGORY_META[item.category] ?? CATEGORY_META.Other;
              return (
                <div key={`${item.category}-${item.id}`} className="px-5 py-4 flex items-start gap-3 hover:bg-slate-50 transition-colors group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${meta.color}`}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm truncate">{item.description}</span>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <span className="font-black text-slate-900">{money(item.amount)}</span>
                        {item.isEditableHere ? (
                          <>
                            <button onClick={() => openEdit(item)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(item)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-50 hover:text-rose-600 text-slate-300 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : item.category === "Toll" ? (
                          <span className="opacity-0 group-hover:opacity-100 text-[9px] font-bold text-slate-300 pl-1">via Tolls tab</span>
                        ) : item.category === "Fuel" ? (
                          <span className="opacity-0 group-hover:opacity-100 text-[9px] font-bold text-slate-300 pl-1">via Fuel tab</span>
                        ) : (
                          <span className="opacity-0 group-hover:opacity-100 text-[9px] font-bold text-slate-300 pl-1">via Service</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-bold">
                        {format(parseISO(item.date), "MMM d, yyyy")}
                      </span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${meta.color}`}>
                        {meta.label}
                      </span>
                      {item.settlementId && (
                        <button
                          onClick={() => navigate(`/app/settlements/${item.settlementId}`)}
                          className="text-[10px] text-blue-500 hover:text-blue-700 font-bold flex items-center gap-0.5"
                        >
                          Settlement {item.settlementLabel ?? ""} <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <SettlementRowDialog
        open={dialogRow.open}
        onOpenChange={(open) => setDialogRow(prev => ({ ...prev, open }))}
        section="expense"
        initial={dialogRow.initial}
        defaultEquipmentId={equipment.id}
        equipmentOptions={equipmentOptions}
        operatorOptions={operatorOptions}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default ExpensesEquipmentTab;
