import React, { useState, useEffect, useRef } from 'react';
import {
    Plus,
    X,
    Loader2,
    Sparkles,
    Truck as TruckIcon,
    CheckCircle2,
    Upload,
    DollarSign,
    Fuel,
    Search,
    MapPin,
    Calendar,
    Gauge,
    ArrowUpRight,
    TrendingDown,
    Droplets,
    Receipt
} from 'lucide-react';
import { FuelRecord, FuelParsedData, Equipment } from '@/lib/types';
import { parseFuelReceipt } from '@/lib/gemini';
import { fuelApi } from '@/lib/fuelApi';
import { equipmentApi, mapDtoToEquipment } from '@/lib/equipmentApi';
import { useToast } from "@/hooks/use-toast";

const FuelManager = () => {
    const { toast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isParsing, setIsParsing] = useState(false);
    const [records, setRecords] = useState<FuelRecord[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<FuelRecord>>({
        date: new Date().toISOString().split('T')[0],
        fuelType: 'Diesel',
        gallons: 0,
        unitPrice: 0,
        totalAmount: 0,
        assetId: '',
        vendorName: '',
        vendorAddress: '',
        odometer: 0,
        state: ''
    });

    const receiptInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [fuelData, equipData] = await Promise.all([
                fuelApi.list(),
                equipmentApi.list()
            ]);
            setRecords(fuelData || []);
            setEquipment(equipData?.map(mapDtoToEquipment) || []);
        } catch (err) {
            console.error("Failed to load fuel data", err);
            toast({ title: "Sync Error", description: "Failed to load fuel records.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        if (!file) return;
        setAttachedFiles([file]);

        const reader = new FileReader();
        reader.onloadend = async () => {
            const dataUrl = reader.result as string;
            setReceiptPreview(dataUrl);
            const base64 = dataUrl.split(',')[1];

            setIsParsing(true);
            try {
                const result = await parseFuelReceipt(base64, file.type);
                if (result) {
                    const matchedEquip = equipment.find(e =>
                        result.unitNumber && e.unitNumber.toLowerCase().includes(result.unitNumber.toLowerCase())
                    );

                    setFormData(prev => ({
                        ...prev,
                        vendorName: result.businessName || prev.vendorName,
                        vendorAddress: result.businessAddress || prev.vendorAddress,
                        date: result.date || prev.date,
                        fuelType: result.fuelType || prev.fuelType,
                        gallons: result.gallons || prev.gallons,
                        unitPrice: result.unitPrice || prev.unitPrice,
                        totalAmount: result.total || prev.total,
                        odometer: result.odometer || prev.odometer,
                        state: result.state || prev.state,
                        assetId: matchedEquip?.id || prev.assetId
                    }));
                    toast({ title: "AI Scan Complete", description: "Fuel receipt details extracted successfully." });
                }
            } catch (err) {
                console.error("AI Parsing failed", err);
                toast({ title: "Parsing Failed", description: "Could not extract data from the receipt.", variant: "destructive" });
            } finally {
                setIsParsing(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // In a real app, we would upload the file first and get a URL
            // For now, we'll just save the record
            await fuelApi.create(formData as any);
            toast({ title: "Success", description: "Fuel transaction logged." });
            setIsModalOpen(false);
            resetForm();
            loadData();
        } catch (err) {
            toast({ title: "Error", description: "Failed to save record.", variant: "destructive" });
        }
    };

    const resetForm = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            fuelType: 'Diesel',
            gallons: 0,
            unitPrice: 0,
            totalAmount: 0,
            assetId: '',
            vendorName: '',
            vendorAddress: '',
            odometer: 0,
            state: ''
        });
        setAttachedFiles([]);
        setReceiptPreview(null);
    };

    // Stats Calculation
    const totalSpend = records.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalGallons = records.reduce((sum, r) => sum + r.gallons, 0);
    const avgPrice = totalGallons > 0 ? totalSpend / totalGallons : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                        <DollarSign className="w-20 h-20" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Total Fuel Spend</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black">${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <span className="text-xs font-bold text-emerald-400 flex items-center"><ArrowUpRight className="w-3 h-3" /> 12%</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                        <Droplets className="w-20 h-20 text-blue-600" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Average Price/Gal</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-900">${avgPrice.toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
                        <span className="text-xs font-bold text-blue-500 flex items-center"><TrendingDown className="w-3 h-3" /> $0.12</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                        <Fuel className="w-20 h-20 text-blue-600" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Volume</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-slate-900">{totalGallons.toLocaleString()}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase ml-1">Gal</span>
                    </div>
                </div>
            </div>

            {/* List Header */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Transactions</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Audit-ready fuel logs</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-slate-900 text-white px-8 py-4 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                >
                    <Plus className="w-4 h-4" /> Log Fuel Receipt
                </button>
            </div>

            {/* Transaction List */}
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Station</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type & Volume</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Unit Price</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {records.map((r) => (
                            <tr key={r.id} className="hover:bg-slate-50/50 transition-all cursor-pointer group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                            <MapPin className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-900 line-clamp-1">{r.vendorName}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                {new Date(r.date).toLocaleDateString()} • {r.state || 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                                            <TruckIcon className="w-3.5 h-3.5 text-slate-400" />
                                        </div>
                                        <span className="font-black text-slate-700">{r.assetNumber || 'Unit'}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${r.fuelType === 'Diesel' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                            r.fuelType === 'DEF' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                'bg-slate-50 text-slate-600 border-slate-100'
                                            }`}>
                                            {r.fuelType}
                                        </span>
                                        <span className="text-sm font-bold text-slate-500">{r.gallons.toLocaleString()} <span className="text-[10px] uppercase font-black">gal</span></span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right font-mono font-bold text-slate-600">${r.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 3 })}</td>
                                <td className="px-8 py-6 text-right font-mono font-black text-slate-900">${r.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {records.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Fuel className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-400 italic">No fuel transactions logged yet.</p>
                    </div>
                )}
            </div>

            {/* AI Parsing Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col my-auto max-h-[95vh]">
                        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
                                    <Droplets className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Audit Fuel Transaction</h2>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">AI-assisted consumption verification</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"><X className="w-6 h-6" /></button>
                        </div>

                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                            <form className="flex-1 overflow-y-auto p-10 space-y-10 md:w-1/2 border-r border-slate-100" onSubmit={handleSubmit}>
                                {/* AI Dropzone */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-blue-600" /> AI Vision Scan
                                        </h3>
                                    </div>
                                    <div
                                        onClick={() => receiptInputRef.current?.click()}
                                        className={`border-4 border-dashed rounded-[2.5rem] p-12 transition-all group flex flex-col items-center justify-center text-center cursor-pointer relative ${isParsing ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 bg-slate-50/30 hover:bg-blue-50/30 hover:border-blue-300'}`}
                                    >
                                        {isParsing ? (
                                            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                                        ) : (
                                            <>
                                                <Upload className="w-10 h-10 text-slate-400 group-hover:text-blue-500 mb-4" />
                                                <p className="text-sm font-bold text-slate-700">Scan Fuel Receipt</p>
                                            </>
                                        )}
                                        <input type="file" ref={receiptInputRef} className="hidden" accept="image/*,application/pdf" onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload(file);
                                        }} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset *</label>
                                        <select
                                            required
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 outline-none"
                                            value={formData.assetId}
                                            onChange={e => setFormData({ ...formData, assetId: e.target.value })}
                                        >
                                            <option value="">Select Asset...</option>
                                            {equipment.map(e => <option key={e.id} value={e.id}>{e.unitNumber}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transaction Date *</label>
                                        <input type="date" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fuel Station / Vendor *</label>
                                    <div className="relative">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            required
                                            placeholder="Station name..."
                                            className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 outline-none"
                                            value={formData.vendorName}
                                            onChange={e => setFormData({ ...formData, vendorName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-1 space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price/Gal</label>
                                        <input type="number" step="0.001" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900" value={formData.unitPrice} onChange={e => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                    <div className="col-span-1 space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gallons</label>
                                        <input type="number" step="0.01" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900" value={formData.gallons} onChange={e => setFormData({ ...formData, gallons: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                    <div className="col-span-1 space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Odometer</label>
                                        <input type="number" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900" value={formData.odometer} onChange={e => setFormData({ ...formData, odometer: parseInt(e.target.value) || 0 })} />
                                    </div>
                                </div>

                                <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-black uppercase tracking-widest text-blue-400">Total Transaction</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-black text-blue-400">$</span>
                                            <input
                                                type="number"
                                                className="bg-transparent text-4xl font-black outline-none w-32 border-b border-white/20 pb-1"
                                                value={formData.totalAmount}
                                                onChange={e => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-5 pt-8 sticky bottom-0 bg-white">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Discard</button>
                                    <button type="submit" className="px-12 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-700 active:scale-95 transition-all">Complete Audit</button>
                                </div>
                            </form>

                            {/* Receipt Preview */}
                            <div className="hidden md:flex flex-1 bg-slate-50 items-center justify-center p-8 overflow-hidden">
                                {receiptPreview ? (
                                    <div className="w-full h-full bg-white rounded-[2rem] shadow-inner border border-slate-200 overflow-hidden relative">
                                        <img src={receiptPreview} alt="Receipt Preview" className="w-full h-full object-contain p-4" />
                                        <button
                                            type="button"
                                            onClick={() => setReceiptPreview(null)}
                                            className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur rounded-lg shadow text-slate-400 hover:text-rose-500"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center p-12">
                                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
                                            <Receipt className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Document Upload</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FuelManager;
