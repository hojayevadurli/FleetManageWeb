import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Equipment, WorkOrder } from "@/lib/types";
import { TollRecord } from "@/lib/tollsApi";
import { FuelRecordDto } from "@/lib/fuelApi";
import { FileText, Wrench, Receipt, Fuel, DollarSign, Printer } from "lucide-react";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, subDays } from "date-fns";

interface Props {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    equipment: Equipment;
    workOrders: WorkOrder[];
    tollRecords: TollRecord[];
    fuelRecords: FuelRecordDto[];
}

type QuickRange = "30d" | "90d" | "365d" | "all";

const quickRanges: { label: string; value: QuickRange }[] = [
    { label: "Last 30 days", value: "30d" },
    { label: "Last 90 days", value: "90d" },
    { label: "Last year", value: "365d" },
    { label: "All time", value: "all" },
];

const ExpenseReportModal = ({ open, onOpenChange, equipment, workOrders, tollRecords, fuelRecords }: Props) => {
    const today = new Date();
    const [quickRange, setQuickRange] = useState<QuickRange>("30d");
    const [from, setFrom] = useState(format(subDays(today, 30), "yyyy-MM-dd"));
    const [to, setTo]   = useState(format(today, "yyyy-MM-dd"));

    const applyQuick = (range: QuickRange) => {
        setQuickRange(range);
        const t = new Date();
        if (range === "30d")  { setFrom(format(subDays(t, 30), "yyyy-MM-dd")); setTo(format(t, "yyyy-MM-dd")); }
        if (range === "90d")  { setFrom(format(subDays(t, 90), "yyyy-MM-dd")); setTo(format(t, "yyyy-MM-dd")); }
        if (range === "365d") { setFrom(format(subDays(t, 365), "yyyy-MM-dd")); setTo(format(t, "yyyy-MM-dd")); }
        if (range === "all")  { setFrom("2000-01-01"); setTo(format(t, "yyyy-MM-dd")); }
    };

    const inRange = (dateStr: string) => {
        try {
            const d = startOfDay(parseISO(dateStr));
            return isWithinInterval(d, {
                start: startOfDay(parseISO(from)),
                end:   endOfDay(parseISO(to)),
            });
        } catch { return false; }
    };

    const filteredWOs    = useMemo(() => workOrders.filter(wo => inRange(wo.date)), [workOrders, from, to]);
    const filteredTolls  = useMemo(() => tollRecords.filter(r => inRange(r.tripDate)), [tollRecords, from, to]);
    const filteredFuel   = useMemo(() => fuelRecords.filter(r => inRange(r.date)), [fuelRecords, from, to]);

    const maintTotal = filteredWOs.reduce((s, wo) => s + (wo.totalCost ?? 0), 0);
    const tollTotal  = filteredTolls.reduce((s, r) => s + r.totalCostCash, 0);
    const fuelTotal  = filteredFuel.reduce((s, r) => s + r.totalAmount, 0);
    const grandTotal = maintTotal + tollTotal + fuelTotal;

    const categories = [
        { label: "Maintenance", icon: Wrench,  color: "bg-blue-500",  amount: maintTotal, count: filteredWOs.length },
        { label: "Tolls",       icon: Receipt, color: "bg-amber-500", amount: tollTotal,  count: filteredTolls.length },
        { label: "Fuel",        icon: Fuel,    color: "bg-emerald-500", amount: fuelTotal, count: filteredFuel.length },
    ];

    // Itemized rows — newest first
    type Row = { date: string; category: string; description: string; amount: number; color: string };
    const rows: Row[] = [
        ...filteredWOs.map(wo => ({ date: wo.date, category: "Maintenance", description: wo.title || wo.woNumber || "Work Order", amount: wo.totalCost ?? 0, color: "blue" })),
        ...filteredTolls.map(r => ({ date: r.tripDate, category: "Toll",  description: r.routeDescription || r.originAddress || "Toll", amount: r.totalCostCash, color: "amber" })),
        ...filteredFuel.map(r  => ({ date: r.date,    category: "Fuel",  description: r.vendorName, amount: r.totalAmount, color: "emerald" })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const badgeStyle: Record<string, string> = {
        blue:    "bg-blue-100 text-blue-700",
        amber:   "bg-amber-100 text-amber-700",
        emerald: "bg-emerald-100 text-emerald-700",
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-black">
                        <FileText className="w-5 h-5 text-blue-500" />
                        Expense Report — Unit {equipment.unitNumber}
                    </DialogTitle>
                </DialogHeader>

                {/* Date range */}
                <div className="space-y-3 mt-2">
                    <div className="flex flex-wrap gap-2">
                        {quickRanges.map(r => (
                            <button key={r.value}
                                onClick={() => applyQuick(r.value)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${quickRange === r.value ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"}`}>
                                {r.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">From</Label>
                            <Input type="date" value={from} onChange={e => { setFrom(e.target.value); setQuickRange("all"); }}
                                className="h-9 text-sm bg-white border-slate-200" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">To</Label>
                            <Input type="date" value={to} onChange={e => { setTo(e.target.value); setQuickRange("all"); }}
                                className="h-9 text-sm bg-white border-slate-200" />
                        </div>
                    </div>
                </div>

                {/* KPI tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="col-span-2 sm:col-span-2 bg-slate-900 rounded-2xl p-4 text-white">
                        <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-blue-400" />
                            <p className="text-[9px] font-black uppercase tracking-widest text-blue-400">Grand Total</p>
                        </div>
                        <p className="text-3xl font-black">${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    {categories.map(c => (
                        <div key={c.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                            <div className="flex items-center gap-1.5 mb-1">
                                <c.icon className={`w-3.5 h-3.5 ${c.color.replace("bg-", "text-")}`} />
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{c.label}</p>
                            </div>
                            <p className="text-lg font-black text-slate-900">${c.amount.toFixed(2)}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">{c.count} record{c.count !== 1 ? "s" : ""}</p>
                        </div>
                    ))}
                </div>

                {/* Category breakdown bars */}
                {grandTotal > 0 && (
                    <div className="mt-4 space-y-2">
                        {categories.filter(c => c.amount > 0).map(c => (
                            <div key={c.label} className="flex items-center gap-3">
                                <span className="w-24 text-[10px] font-black text-slate-500 uppercase tracking-wider">{c.label}</span>
                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${c.color}`}
                                        style={{ width: `${Math.max(2, (c.amount / grandTotal) * 100)}%` }} />
                                </div>
                                <span className="text-xs font-black text-slate-700 w-16 text-right">${c.amount.toFixed(0)}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Itemized table */}
                {rows.length > 0 ? (
                    <div className="mt-5 border border-slate-100 rounded-2xl overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Itemized ({rows.length})</p>
                        </div>
                        <div className="divide-y divide-slate-50 max-h-60 overflow-y-auto">
                            {rows.map((r, i) => (
                                <div key={i} className="flex items-center gap-3 px-4 py-3">
                                    <span className="text-[10px] text-slate-400 font-bold w-20 shrink-0">
                                        {format(parseISO(r.date.slice(0, 10)), "MMM d, yy")}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${badgeStyle[r.color]}`}>
                                        {r.category}
                                    </span>
                                    <span className="flex-1 text-xs text-slate-700 truncate">{r.description}</span>
                                    <span className="text-xs font-black text-slate-900 shrink-0">${r.amount.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="mt-5 py-10 text-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-2xl">
                        No expenses in selected period
                    </div>
                )}

                {/* Footer */}
                <div className="flex justify-end gap-2 mt-5">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                    <Button onClick={() => window.print()}
                        className="bg-blue-600 text-white hover:bg-blue-700 font-bold flex items-center gap-2">
                        <Printer className="w-4 h-4" /> Print Report
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ExpenseReportModal;
