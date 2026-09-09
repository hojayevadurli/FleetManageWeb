import { useEffect, useState } from "react";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { tollsApi, TollRecord, TollSummary } from "@/lib/tollsApi";
import { equipmentApi } from "@/lib/equipmentApi";
import { Equipment } from "@/lib/types";
import { mapDtoToEquipment } from "@/lib/equipmentApi";
import TollRecordModal from "@/components/tolls/TollCalculatorModal";
import {
  Receipt, Plus, Loader2, TrendingUp, MapPin, Truck,
  Trash2, ChevronRight, AlertCircle
} from "lucide-react";
import { format, parseISO } from "date-fns";

const PERIOD_OPTIONS = [
  { label: "Last 7 days",   value: "7"  },
  { label: "Last 30 days",  value: "30" },
  { label: "Last 90 days",  value: "90" },
  { label: "Last year",     value: "365" },
];

const TollsPage = () => {
  const { toast } = useToast();
  const [summary, setSummary] = useState<TollSummary | null>(null);
  const [recentRecords, setRecentRecords] = useState<TollRecord[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [days, setDays] = useState("30");
  const [loading, setLoading] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dtos, sum] = await Promise.all([
        equipmentApi.list(),
        tollsApi.getSummary(Number(days)),
      ]);
      setEquipment(dtos.map(mapDtoToEquipment));
      setSummary(sum);

      // Fetch recent records per top unit (up to first 3)
      const topUnits = sum.byUnit.slice(0, 3);
      const records = (
        await Promise.all(
          topUnits.map(u => tollsApi.getByEquipment(u.equipmentId, 1, 5).catch(() => []))
        )
      ).flat();
      setRecentRecords(records);
    } catch {
      toast({ title: "Failed to load tolls", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [days]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this toll record?")) return;
    try {
      await tollsApi.delete(id);
      setRecentRecords(prev => prev.filter(r => r.id !== id));
      fetchData();
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

  return (
    <Page>
      <PageHeader title="Toll Tracker" subtitle="Record and review toll payments per unit">
        <div className="flex items-center gap-3">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="h-10 w-[150px] bg-white border-slate-200 text-sm font-medium rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => setShowCalculator(true)}
            className="bg-blue-600 text-white h-10 px-5 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> New Toll Entry
          </Button>
        </div>
      </PageHeader>

      {/* Summary KPI row */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Tolls Paid</p>
            <p className="text-3xl font-black text-slate-900">${summary.totalCostCash.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">Last {days} days</p>
          </div>
          {summary.totalCostEzPass != null && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Tolls (E-ZPass)</p>
              <p className="text-3xl font-black text-blue-700">${summary.totalCostEzPass.toFixed(2)}</p>
              <p className="text-xs text-slate-400 mt-1">
                Saved ${(summary.totalCostCash - summary.totalCostEzPass).toFixed(2)} vs cash
              </p>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Trips</p>
            <p className="text-3xl font-black text-slate-900">{summary.tripCount}</p>
            <p className="text-xs text-slate-400 mt-1">Recorded trips</p>
          </div>
          {summary.totalDistanceMiles != null && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Miles</p>
              <p className="text-3xl font-black text-slate-900">{summary.totalDistanceMiles!.toFixed(0)}</p>
              <p className="text-xs text-slate-400 mt-1">
                Avg ${summary.tripCount > 0 ? (summary.totalCostCash / summary.totalDistanceMiles!).toFixed(3) : "—"}/mi
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Per-unit breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Truck className="w-4 h-4 text-slate-400" />
            <h3 className="font-black text-slate-900">By Unit</h3>
            <span className="ml-auto text-xs text-slate-400">Last {days} days</span>
          </div>
          {summary && summary.byUnit.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {summary.byUnit.map((u, idx) => {
                const pct = summary.totalCostCash > 0
                  ? (u.totalCostCash / summary.totalCostCash) * 100
                  : 0;
                return (
                  <div key={u.equipmentId} className="flex items-center gap-4 px-6 py-4">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-black text-slate-900 text-sm">{u.unitNumber}</span>
                        <span className="font-black text-slate-900 text-sm">${u.totalCostCash.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold shrink-0">
                          {u.tripCount} trip{u.tripCount !== 1 ? "s" : ""}
                          {u.totalDistanceMiles ? ` · ${u.totalDistanceMiles.toFixed(0)} mi` : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <TrendingUp className="w-8 h-8 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-400">No toll records in this period</p>
              <p className="text-xs text-slate-400 mt-1">Use "New Toll Entry" to add your first record</p>
            </div>
          )}
        </div>

        {/* Recent records */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-400" />
            <h3 className="font-black text-slate-900">Recent Records</h3>
          </div>
          {recentRecords.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {recentRecords.map(r => (
                <div key={r.id} className="px-6 py-4 flex items-start gap-3 hover:bg-slate-50 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 text-sm">{r.unitNumber}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">${r.totalCostCash.toFixed(2)}</span>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-50 hover:text-rose-600 text-slate-300 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {(r.originAddress || r.destinationAddress) && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {r.originAddress} {r.originAddress && r.destinationAddress ? "→" : ""} {r.destinationAddress}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400 font-bold">
                        {format(parseISO(r.tripDate), "MMM d, yyyy")}
                      </span>
                      {r.tollPlazaCount != null && (
                        <span className="text-[10px] text-slate-400">· {r.tollPlazaCount} plazas</span>
                      )}
                      {r.distanceMiles != null && (
                        <span className="text-[10px] text-slate-400">· {r.distanceMiles.toFixed(0)} mi</span>
                      )}
                      <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        r.source === "calculated"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {r.source}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <AlertCircle className="w-8 h-8 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-400">No recent records</p>
            </div>
          )}
        </div>
      </div>

      <TollRecordModal
        open={showCalculator}
        onOpenChange={setShowCalculator}
        equipment={equipment}
        onSaved={() => fetchData()}
      />
    </Page>
  );
};

export default TollsPage;
