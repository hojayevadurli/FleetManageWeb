import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { fuelApi, FuelRecordDto, FUEL_TYPES } from "@/lib/fuelApi";
import { Equipment } from "@/lib/types";
import { Fuel, Plus, Loader2, Trash2, Pencil, Droplets, DollarSign, Gauge } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Props {
    equipment: Equipment;
    onRecordsChange?: (records: FuelRecordDto[]) => void;
}

const emptyForm = (equipmentId: string) => ({
    assetId: equipmentId,
    date: new Date().toISOString().slice(0, 10),
    vendorName: "",
    vendorAddress: "",
    fuelType: "Diesel",
    gallons: "" as unknown as number,
    unitPrice: "" as unknown as number,
    totalAmount: "" as unknown as number,
    odometer: "" as unknown as number,
    state: "",
    notes: "",
});

const FuelEquipmentTab = ({ equipment, onRecordsChange }: Props) => {
    const { toast } = useToast();
    const [records, setRecords]       = useState<FuelRecordDto[]>([]);
    const [loading, setLoading]       = useState(true);
    const [showModal, setShowModal]   = useState(false);
    const [editId, setEditId]         = useState<string | null>(null);
    const [saving, setSaving]         = useState(false);
    const [form, setForm]             = useState(emptyForm(equipment.id));

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const data = await fuelApi.list({ assetId: equipment.id, pageSize: 500 });
            setRecords(data);
            onRecordsChange?.(data);
        } catch {
            toast({ title: "Failed to load fuel records", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRecords(); }, [equipment.id]);

    const openNew = () => {
        setEditId(null);
        setForm(emptyForm(equipment.id));
        setShowModal(true);
    };

    const openEdit = (r: FuelRecordDto) => {
        setEditId(r.id);
        setForm({
            assetId: equipment.id,
            date: r.date.slice(0, 10),
            vendorName: r.vendorName,
            vendorAddress: r.vendorAddress ?? "",
            fuelType: r.fuelType,
            gallons: r.gallons,
            unitPrice: r.unitPrice,
            totalAmount: r.totalAmount,
            odometer: r.odometer ?? ("" as unknown as number),
            state: r.state ?? "",
            notes: r.notes ?? "",
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.vendorName.trim()) {
            toast({ title: "Enter a vendor / station name", variant: "destructive" });
            return;
        }
        if (!form.gallons || !form.totalAmount) {
            toast({ title: "Enter gallons and total amount", variant: "destructive" });
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                gallons:     Number(form.gallons),
                unitPrice:   Number(form.unitPrice) || 0,
                totalAmount: Number(form.totalAmount),
                odometer:    form.odometer ? Number(form.odometer) : undefined,
            };
            if (editId) {
                await fuelApi.update(editId, payload);
            } else {
                await fuelApi.create(payload);
            }
            toast({ title: editId ? "Fuel record updated" : "Fuel record saved" });
            setShowModal(false);
            fetchRecords();
        } catch (err: any) {
            toast({ title: "Save failed", description: err?.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this fuel record?")) return;
        try {
            await fuelApi.remove(id);
            const updated = records.filter(r => r.id !== id);
            setRecords(updated);
            onRecordsChange?.(updated);
        } catch {
            toast({ title: "Delete failed", variant: "destructive" });
        }
    };

    // KPIs
    const totalSpend  = records.reduce((s, r) => s + r.totalAmount, 0);
    const totalGallons = records.reduce((s, r) => s + r.gallons, 0);
    const avgPpg      = totalGallons > 0 ? totalSpend / totalGallons : 0;

    const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                    <h3 className="text-base font-black text-slate-900">Fuel History</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{records.length} record{records.length !== 1 ? "s" : ""}</p>
                </div>
                <Button onClick={openNew}
                    className="bg-blue-600 text-white h-9 px-4 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700 text-sm">
                    <Plus className="w-4 h-4" /> Add Fuel Record
                </Button>
            </div>

            {/* KPIs */}
            {records.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Spent</p>
                        </div>
                        <p className="text-2xl font-black text-slate-900">${totalSpend.toFixed(2)}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Droplets className="w-4 h-4 text-blue-500" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Gallons</p>
                        </div>
                        <p className="text-2xl font-black text-slate-900">{totalGallons.toFixed(1)}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Gauge className="w-4 h-4 text-amber-500" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg $/Gallon</p>
                        </div>
                        <p className="text-2xl font-black text-slate-900">${avgPpg.toFixed(3)}</p>
                    </div>
                </div>
            )}

            {/* Records */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
            ) : records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                        <Fuel className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-500">No fuel records yet</p>
                    <p className="text-xs text-slate-400 mt-1">Click "Add Fuel Record" to get started</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-slate-50">
                        {records.map(r => (
                            <div key={r.id} className="px-5 py-4 flex items-start gap-3 hover:bg-slate-50 group transition-colors">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                                    <Fuel className="w-4 h-4 text-emerald-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-black text-slate-900 text-sm truncate">{r.vendorName}</span>
                                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                            <span className="font-black text-slate-900">${r.totalAmount.toFixed(2)}</span>
                                            <button onClick={() => openEdit(r)}
                                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-blue-50 hover:text-blue-600 text-slate-300 transition-all">
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(r.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-50 hover:text-rose-600 text-slate-300 transition-all">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="text-[10px] text-slate-400 font-bold">
                                            {format(parseISO(r.date), "MMM d, yyyy")}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            {r.gallons.toFixed(1)} gal · ${r.unitPrice.toFixed(3)}/gal
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                                            {r.fuelType}
                                        </span>
                                        {r.state && (
                                            <span className="text-[10px] text-slate-400">{r.state}</span>
                                        )}
                                        {r.odometer && (
                                            <span className="text-[10px] text-slate-400">· {r.odometer.toLocaleString()} mi</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add / Edit modal */}
            <Dialog open={showModal} onOpenChange={v => { if (!v) setShowModal(false); }}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-black">
                            <Fuel className="w-5 h-5 text-emerald-500" />
                            {editId ? "Edit Fuel Record" : "Add Fuel Record"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 mt-2">
                        {/* Date + Fuel type */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Date *</Label>
                                <Input type="date" className="h-10 bg-white border-slate-200 text-sm"
                                    value={form.date} onChange={e => set("date", e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Fuel Type</Label>
                                <Select value={form.fuelType} onValueChange={v => set("fuelType", v)}>
                                    <SelectTrigger className="h-10 bg-white border-slate-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FUEL_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Station / vendor */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Station / Vendor *</Label>
                            <Input className="h-10 bg-white border-slate-200 text-sm"
                                placeholder="e.g. Pilot Travel Center"
                                value={form.vendorName} onChange={e => set("vendorName", e.target.value)} />
                        </div>

                        {/* Gallons + Price + Total */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Gallons *</Label>
                                <Input type="number" min="0" step="0.001" className="h-10 bg-white border-slate-200 text-sm"
                                    placeholder="0.000"
                                    value={form.gallons} onChange={e => {
                                        const g = parseFloat(e.target.value) || 0;
                                        set("gallons", e.target.value);
                                        if (form.unitPrice) set("totalAmount", (g * Number(form.unitPrice)).toFixed(2));
                                    }} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">$/Gallon</Label>
                                <Input type="number" min="0" step="0.0001" className="h-10 bg-white border-slate-200 text-sm"
                                    placeholder="0.0000"
                                    value={form.unitPrice} onChange={e => {
                                        const p = parseFloat(e.target.value) || 0;
                                        set("unitPrice", e.target.value);
                                        if (form.gallons) set("totalAmount", (Number(form.gallons) * p).toFixed(2));
                                    }} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Total ($) *</Label>
                                <Input type="number" min="0" step="0.01" className="h-10 bg-white border-slate-200 text-sm"
                                    placeholder="0.00"
                                    value={form.totalAmount} onChange={e => set("totalAmount", e.target.value)} />
                            </div>
                        </div>

                        {/* Odometer + State */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Odometer (mi)</Label>
                                <Input type="number" min="0" className="h-10 bg-white border-slate-200 text-sm"
                                    placeholder="Optional"
                                    value={form.odometer} onChange={e => set("odometer", e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">State</Label>
                                <Input className="h-10 bg-white border-slate-200 text-sm"
                                    placeholder="e.g. TX"
                                    value={form.state} onChange={e => set("state", e.target.value)} />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Notes</Label>
                            <Input className="h-10 bg-white border-slate-200 text-sm"
                                placeholder="Optional notes..."
                                value={form.notes} onChange={e => set("notes", e.target.value)} />
                        </div>
                    </div>

                    <DialogFooter className="mt-5 gap-2">
                        <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={saving}
                            className="bg-emerald-600 text-white hover:bg-emerald-700 font-bold">
                            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Record"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default FuelEquipmentTab;
