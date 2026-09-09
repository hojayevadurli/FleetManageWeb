import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { tollsApi, TollRecord } from "@/lib/tollsApi";
import { Equipment } from "@/lib/types";
import { Receipt, Plus, Loader2, MapPin, Trash2, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import TollRecordModal from "@/components/tolls/TollCalculatorModal";

interface Props {
    equipment: Equipment;
}

const TollsEquipmentTab = ({ equipment }: Props) => {
    const { toast } = useToast();
    const [records, setRecords] = useState<TollRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCalculator, setShowCalculator] = useState(false);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const data = await tollsApi.getByEquipment(equipment.id, 1, 50);
            setRecords(data);
        } catch {
            toast({ title: "Failed to load toll records", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRecords(); }, [equipment.id]);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this toll record?")) return;
        try {
            await tollsApi.delete(id);
            setRecords(prev => prev.filter(r => r.id !== id));
        } catch {
            toast({ title: "Delete failed", variant: "destructive" });
        }
    };

    const totalCash = records.reduce((s, r) => s + r.totalCostCash, 0);
    const totalEzPass = records.some(r => r.totalCostEzPass != null)
        ? records.reduce((s, r) => s + (r.totalCostEzPass ?? 0), 0)
        : null;

    return (
        <div className="space-y-5">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-black text-slate-900">Toll History</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{records.length} record{records.length !== 1 ? "s" : ""}</p>
                </div>
                <Button
                    onClick={() => setShowCalculator(true)}
                    className="bg-blue-600 text-white h-9 px-4 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700 text-sm"
                >
                    <Plus className="w-4 h-4" /> New Toll Entry
                </Button>
            </div>

            {/* KPI tiles */}
            {records.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Cash Tolls</p>
                        <p className="text-2xl font-black text-slate-900">${totalCash.toFixed(2)}</p>
                    </div>
                    {totalEzPass != null && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total E-ZPass</p>
                            <p className="text-2xl font-black text-blue-700">${totalEzPass.toFixed(2)}</p>
                        </div>
                    )}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trips</p>
                        <p className="text-2xl font-black text-slate-900">{records.length}</p>
                    </div>
                </div>
            )}

            {/* Records list */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
            ) : records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                        <Receipt className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-500">No toll records yet</p>
                    <p className="text-xs text-slate-400 mt-1">Click "New Toll Entry" to add the first one</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-50">
                        {records.map(r => (
                            <div key={r.id} className="px-5 py-4 flex items-start gap-3 hover:bg-slate-50 transition-colors group">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                                    <MapPin className="w-4 h-4 text-blue-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-black text-slate-900 text-sm">
                                            {r.originAddress || r.destinationAddress
                                                ? [r.originAddress, r.destinationAddress].filter(Boolean).join(" → ")
                                                : r.routeDescription ?? "Toll Record"}
                                        </span>
                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                            <span className="font-black text-slate-900">${r.totalCostCash.toFixed(2)}</span>
                                            <button
                                                onClick={() => handleDelete(r.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-50 hover:text-rose-600 text-slate-300 transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="text-[10px] text-slate-400 font-bold">
                                            {format(parseISO(r.tripDate), "MMM d, yyyy")}
                                        </span>
                                        {r.totalCostEzPass != null && (
                                            <span className="text-[10px] text-blue-500">E-ZPass ${r.totalCostEzPass.toFixed(2)}</span>
                                        )}
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
                </div>
            )}

            <TollRecordModal
                open={showCalculator}
                onOpenChange={setShowCalculator}
                equipment={[equipment]}
                preselectedEquipmentId={equipment.id}
                onSaved={(record) => {
                    setRecords(prev => [record, ...prev]);
                    setShowCalculator(false);
                }}
            />
        </div>
    );
};

export default TollsEquipmentTab;
