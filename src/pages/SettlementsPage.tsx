import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page, PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { settlementsApi, SettlementSummary } from "@/lib/settlementsApi";
import { equipmentApi } from "@/lib/equipmentApi";
import { operatorsApi } from "@/lib/operatorsApi";
import SettlementHeaderDialog from "@/components/settlements/SettlementHeaderDialog";
import { Plus, Loader2, FileCheck, ChevronRight, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";

const SettlementsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settlements, setSettlements] = useState<SettlementSummary[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<{ id: string; label: string }[]>([]);
  const [operatorOptions, setOperatorOptions] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [list, equipment, operators] = await Promise.all([
        settlementsApi.list({ pageSize: 500 }),
        equipmentApi.list(),
        operatorsApi.getAll(1, 500),
      ]);
      setSettlements(list);
      setEquipmentOptions(equipment.map((e: any) => ({ id: e.id, label: e.unitNumber })));
      setOperatorOptions(operators.map((o: any) => ({ id: o.id, label: o.fullName })));
    } catch {
      toast({ title: "Failed to load settlements", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async (dto: any) => {
    const created = await settlementsApi.create(dto);
    toast({ title: "Settlement created" });
    navigate(`/app/settlements/${created.id}`);
  };

  const handleDelete = async (e: React.MouseEvent, s: SettlementSummary) => {
    e.stopPropagation();
    if (!window.confirm(`Delete this settlement for ${s.vendorName} (Unit ${s.unitNumber})? This cannot be undone.`)) return;
    try {
      await settlementsApi.remove(s.id);
      setSettlements(prev => prev.filter(x => x.id !== s.id));
      toast({ title: "Settlement deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <Page>
        <div className="flex items-center justify-center p-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </Page>
    );
  }

  const totalNetBill = settlements.reduce((sum, s) => sum + s.totalNetBill, 0);
  const totalOtherExpenses = settlements.reduce((sum, s) => sum + s.otherExpensesTotal, 0);
  const totalAdjustedNetPay = settlements.reduce((sum, s) => sum + s.adjustedNetPay, 0);

  return (
    <Page>
      <PageHeader title="Truck Owner Settlements" subtitle="Per-unit driver settlements, deductions, and adjusted net pay">
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white h-10 px-5 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New Settlement
        </Button>
      </PageHeader>

      {settlements.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Settlements</p>
            <p className="text-3xl font-black text-slate-900">{settlements.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Net Bill</p>
            <p className="text-3xl font-black text-slate-900">${totalNetBill.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Other Expenses</p>
            <p className="text-3xl font-black text-amber-600">${totalOtherExpenses.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900 rounded-2xl shadow-sm p-5">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Adjusted Net Pay</p>
            <p className={`text-3xl font-black ${totalAdjustedNetPay < 0 ? "text-rose-400" : "text-white"}`}>
              ${totalAdjustedNetPay.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {settlements.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {settlements.map(s => (
              <button
                key={s.id}
                onClick={() => navigate(`/app/settlements/${s.id}`)}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
                  <div>
                    <p className="font-black text-slate-900 text-sm truncate">{s.vendorName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {s.settlementNumber || s.externalId || "—"}
                    </p>
                  </div>
                  <div className="text-sm text-slate-600">Unit {s.unitNumber}</div>
                  <div className="text-sm text-slate-600 truncate">{s.driverName}</div>
                  <div className="text-xs text-slate-400">
                    {format(parseISO(s.periodStart), "MMM d")} – {format(parseISO(s.periodEnd), "MMM d, yyyy")}
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-900 text-sm">${s.adjustedNetPay.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Adjusted Net Pay</p>
                  </div>
                </div>
                <span
                  role="button"
                  onClick={(e) => handleDelete(e, s)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-rose-50 hover:text-rose-600 text-slate-300 transition-all shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <FileCheck className="w-8 h-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-400">No settlements yet</p>
            <p className="text-xs text-slate-400 mt-1">Use "New Settlement" to create your first truck owner settlement</p>
          </div>
        )}
      </div>

      <SettlementHeaderDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        equipmentOptions={equipmentOptions}
        operatorOptions={operatorOptions}
        onSubmit={handleCreate}
      />
    </Page>
  );
};

export default SettlementsPage;
