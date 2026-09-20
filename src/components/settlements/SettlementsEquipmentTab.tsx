import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { settlementsApi, SettlementSummary } from "@/lib/settlementsApi";
import { operatorsApi } from "@/lib/operatorsApi";
import { Equipment } from "@/lib/types";
import SettlementHeaderDialog from "./SettlementHeaderDialog";
import { DollarSign, Plus, Loader2, FileCheck, Trash2, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Props {
  equipment: Equipment;
}

const money = (n: number) => `$${n.toFixed(2)}`;

const SettlementsEquipmentTab = ({ equipment }: Props) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settlements, setSettlements] = useState<SettlementSummary[]>([]);
  const [operatorOptions, setOperatorOptions] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const equipmentOptions = [{ id: equipment.id, label: equipment.unitNumber }];

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const data = await settlementsApi.list({ equipmentId: equipment.id });
      setSettlements(data);
    } catch {
      toast({ title: "Failed to load settlements", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
    operatorsApi.getAll(1, 500)
      .then(ops => setOperatorOptions(ops.map((o: any) => ({ id: o.id, label: o.fullName }))))
      .catch(() => {});
  }, [equipment.id]);

  const handleCreate = async (dto: any) => {
    const created = await settlementsApi.create(dto);
    navigate(`/app/settlements/${created.id}`);
  };

  const handleDelete = async (e: React.MouseEvent, s: SettlementSummary) => {
    e.stopPropagation();
    if (!window.confirm(`Delete this settlement for ${s.vendorName} (${format(parseISO(s.periodStart), "MMM d")} – ${format(parseISO(s.periodEnd), "MMM d, yyyy")})?`)) return;
    try {
      await settlementsApi.remove(s.id);
      setSettlements(prev => prev.filter(x => x.id !== s.id));
      toast({ title: "Settlement deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const totalAdjustedNet = settlements.reduce((sum, s) => sum + s.adjustedNetPay, 0);

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900">Settlements</h3>
          <p className="text-xs text-slate-400 mt-0.5">{settlements.length} settlement{settlements.length !== 1 ? "s" : ""}</p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-blue-600 text-white h-9 px-4 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700 text-sm"
        >
          <Plus className="w-4 h-4" /> New Settlement
        </Button>
      </div>

      {/* KPI tiles */}
      {settlements.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Adjusted Net Pay</p>
            <p className="text-2xl font-black text-slate-900">{money(totalAdjustedNet)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Settlements</p>
            <p className="text-2xl font-black text-slate-900">{settlements.length}</p>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : settlements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <DollarSign className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-500">No settlements yet</p>
          <p className="text-xs text-slate-400 mt-1">Click "New Settlement" to create the first one for this unit</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {settlements.map(s => (
              <button
                key={s.id}
                onClick={() => navigate(`/app/settlements/${s.id}`)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-50 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <FileCheck className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-sm truncate">{s.vendorName}</span>
                    <span className="font-black text-slate-900 shrink-0 ml-2">{money(s.adjustedNetPay)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-bold">
                      {format(parseISO(s.periodStart), "MMM d")} – {format(parseISO(s.periodEnd), "MMM d, yyyy")}
                    </span>
                    {s.settlementNumber && <span className="text-[10px] text-slate-400">· {s.settlementNumber}</span>}
                    <span className="text-[10px] text-slate-400">· Driver: {s.driverName}</span>
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
        </div>
      )}

      <SettlementHeaderDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        defaultEquipmentId={equipment.id}
        equipmentOptions={equipmentOptions}
        operatorOptions={operatorOptions}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default SettlementsEquipmentTab;
