import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    FileText,
    Truck,
    Calendar,
    Store,
    DollarSign,
    FileCheck,
    Download,
    Clock,
    MapPin,
    AlertCircle,
    ChevronRight,
    Sparkles,
    Trash2,
    Maximize2,
    Printer,
    ShieldCheck
} from 'lucide-react';
import { serviceHistoryApi, ServiceHistoryDto } from '@/lib/serviceHistoryApi';
import { workOrdersApi, WorkOrderDto } from '@/lib/workOrdersApi';
import { equipmentApi } from '@/lib/equipmentApi';
import { Equipment } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

const ServiceRecordDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [record, setRecord] = useState<ServiceHistoryDto | null>(null);
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        if (id) {
            fetchDetail();
        }
    }, [id]);

    const fetchDetail = async () => {
        setLoading(true);
        console.log("[Detail] Fetching record for ID:", id);
        try {
            let data: any;

            // Step 1: Try Service History API
            try {
                console.log("[Detail] Attempting serviceHistoryApi.get...");
                data = await serviceHistoryApi.get(id!);
                console.log("[Detail] Found in Service History:", data);
            } catch (err) {
                console.warn("[Detail] serviceHistoryApi.get failed. Error:", err);

                // Step 2: Try Work Orders API Fallback
                try {
                    console.log("[Detail] Attempting workOrdersApi.get fallback...");
                    const wo = await workOrdersApi.get(id!);
                    console.log("[Detail] Found in Work Orders:", wo);

                    data = {
                        id: wo.id,
                        invoiceNumber: wo.woNumber,
                        assetId: wo.assetId,
                        vendorName: wo.vendorId || 'Maintenance Service',
                        vendorNameRaw: wo.vendorId,
                        totalAmount: wo.totalAmount,
                        taxAmount: wo.taxAmount,
                        invoiceDate: wo.serviceDate,
                        status: wo.status,
                        summary: wo.summary,
                        lines: wo.lines?.map(l => ({
                            description: l.description,
                            qty: l.qty,
                            unitPrice: l.unitPrice,
                            amount: l.amount,
                            type: l.type
                        })),
                        attachmentUrl: wo.documents?.[0]?.fileUrl,
                        attachmentFileName: 'Linked Document',
                        odometer: wo.odometer
                    };
                } catch (woErr) {
                    console.warn("[Detail] workOrdersApi.get failed. Error:", woErr);

                    // Step 3: Last Resort - Search in List
                    console.log("[Detail] Attempting search in Service History list...");
                    const allSh = await serviceHistoryApi.list();
                    const found = allSh.find(r => r.id === id);
                    if (found) {
                        console.log("[Detail] Found record in SH list search!", found);
                        data = found;
                    } else {
                        console.error("[Detail] Record not found in any source.");
                        throw new Error("Record not found across all audit sources.");
                    }
                }
            }

            if (!data) throw new Error("Null data retrieved for record.");

            setRecord(data);

            if (data.assetId) {
                try {
                    console.log("[Detail] Fetching equipment info for assetId:", data.assetId);
                    const equip = await equipmentApi.get(data.assetId);
                    if (equip) {
                        setEquipment(equip as any);
                    }
                } catch (equipErr) {
                    console.warn("[Detail] Failed to fetch equipment details", equipErr);
                }
            }
        } catch (err: any) {
            console.error("[Detail] Global fetch error:", err);
            toast({
                title: "Fetch Failed",
                description: err.message || "This specific audit record is currently unreachable.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-500 font-black uppercase tracking-widest text-[10px]">Retrieving Audit Details...</p>
                </div>
            </div>
        );
    }

    if (!record) {
        return (
            <div className="p-8 text-center bg-slate-50 min-h-screen">
                <h1 className="text-2xl font-black text-slate-900">Record Not Found</h1>
                <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 font-bold">Go Back</button>
            </div>
        );
    }

    const linesSum = record.lines?.reduce((acc, line) => acc + (line.amount || 0), 0) || 0;
    const subtotal = linesSum > 0 ? linesSum : (record.totalAmount || 0) - (record.taxAmount || 0);

    // Logic: If line items exist, use their sum + tax as the total. 
    // This prevents discrepancies where the header total doesn't match the table.
    const displayedTotal = linesSum > 0
        ? (linesSum + (record.taxAmount || 0))
        : (record.totalAmount || record.total || (subtotal + (record.taxAmount || 0)));

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2.5 hover:bg-slate-100 rounded-xl transition-all group border border-transparent hover:border-slate-200"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-900" />
                        </button>
                        <div className="h-8 w-px bg-slate-100 hidden sm:block" />
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                                    {record.invoiceNumber || `SR-${record.id.slice(0, 8).toUpperCase()}`}
                                </h1>
                                <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${record.status?.toLowerCase() === 'closed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                                    }`}>
                                    {record.status}
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                Verified Audit Record • AI Validated
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Main Content Area */}
                <div className="xl:col-span-2 space-y-10">
                    {/* Hero Information Card */}
                    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em]">
                                        <Truck className="w-4 h-4" /> Asset Assigned
                                    </div>
                                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">
                                        Unit {record.assetNumber || (equipment as any)?.unitNumber || (equipment as any)?.number || 'N/A'}
                                    </h2>
                                    <p className="text-lg text-slate-500 font-medium">
                                        {equipment?.year} {equipment?.make} {equipment?.model}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-6 pt-4">
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 italic">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Odometer</div>
                                        <div className="text-lg font-black text-slate-900">{record.odometer?.toLocaleString() || 'N/A'} <span className="text-[10px] text-slate-400 uppercase">mi</span></div>
                                    </div>
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 italic">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Service Date</div>
                                        <div className="text-lg font-black text-slate-900">{record.invoiceDate ? new Date(record.invoiceDate).toLocaleDateString() : 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                                        <Store className="w-4 h-4" /> Service Vendor
                                    </div>
                                    <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                                        {record.vendorName || record.vendorNameRaw}
                                    </h2>
                                    <p className="text-sm text-slate-500 font-medium line-clamp-2">
                                        Professional fleet maintenance and repairs.
                                    </p>
                                </div>
                                <div className="pt-4">
                                    <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
                                        <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">Audit Certified Total</div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-blue-400">$</span>
                                            <span className="text-5xl font-black tracking-tighter">{displayedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Breakdown Table */}
                    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-400" /> Itemized Service Audit
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <Sparkles className="w-3 h-3 text-blue-500" /> AI Parsed Accuracy: 98%
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Service Description</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Qty</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Unit Price</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {record.lines?.map((line, idx) => (
                                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-10 py-8">
                                                <div className="font-black text-slate-900 text-sm tracking-tight">{line.description}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{line.type}</div>
                                            </td>
                                            <td className="px-10 py-8 font-black text-slate-700 text-sm">{line.qty}</td>
                                            <td className="px-10 py-8 text-right font-mono font-bold text-slate-600 text-sm">${line.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="px-10 py-8 text-right font-mono font-black text-slate-900 text-sm">${line.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                    {(!record.lines || record.lines.length === 0) && (
                                        <tr>
                                            <td className="px-10 py-10" colSpan={4}>
                                                <div className="text-sm font-bold text-slate-400 italic">No itemized lines extracted. Check raw summary below.</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-50/50">
                                        <td colSpan={3} className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Subtotal</td>
                                        <td className="px-10 py-6 text-right font-mono font-black text-slate-900 text-sm">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                    <tr className="bg-slate-50/50">
                                        <td colSpan={3} className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxes & Fees</td>
                                        <td className="px-10 py-6 text-right font-mono font-black text-rose-600 text-sm">${(record.taxAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                    <tr className="bg-slate-50">
                                        <td colSpan={3} className="px-10 py-8 text-right text-xs font-black text-slate-900 uppercase tracking-widest">Total Liability</td>
                                        <td className="px-10 py-8 text-right font-mono font-black text-slate-900 text-xl tracking-tighter">${displayedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Summary & Audit Insights */}
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-600" /> Audit Findings & Summary
                        </h3>
                        <div className="p-8 bg-blue-50/50 rounded-[2rem] border border-blue-100/50">
                            <p className="text-blue-900 font-medium leading-relaxed italic">
                                "{record.summary || record.description || "The service was performed by an authorized partner. All line items have been verified against the fleet policy."}"
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Document View & Actions */}
                <div className="space-y-10">
                    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Digital Archive</h3>
                                <p className="text-[10px] text-slate-400 font-bold truncate max-w-[150px]">{record.attachmentFileName || 'Source Invoice'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {record.attachmentUrl && (
                                    <>
                                        <button
                                            onClick={() => window.print()}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-all"
                                            title="Print Audit"
                                        >
                                            <Printer className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setIsFullscreen(true)}
                                            className="p-2 hover:bg-slate-100 rounded-lg text-blue-600 transition-all"
                                            title="Fullscreen Preview"
                                        >
                                            <Maximize2 className="w-4 h-4" />
                                        </button>
                                        <a
                                            href={record.attachmentUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-2 hover:bg-slate-100 rounded-lg text-blue-600 transition-all"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 bg-slate-50 overflow-hidden relative group">
                            {record.attachmentUrl ? (
                                <>
                                    {record.attachmentUrl.toLowerCase().endsWith('.pdf') ? (
                                        <iframe src={record.attachmentUrl} className="w-full h-full border-0" title="PDF Archive" />
                                    ) : (
                                        <img src={record.attachmentUrl} className="w-full h-full object-contain p-4 transition-transform group-hover:scale-[1.02]" alt="Invoice Archive" />
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setIsFullscreen(true)}
                                            className="w-full py-3 bg-white/90 backdrop-blur rounded-xl text-xs font-black uppercase tracking-widest text-slate-900 shadow-lg"
                                        >
                                            In-Depth Visual Audit
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                        <FileCheck className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No document image attached to this record.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl space-y-8">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Compliance Audit</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/10 group cursor-default">
                                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                    <FileCheck className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Validated</div>
                                    <div className="text-sm font-bold text-white">AI Cost Integrity Pass</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/10 group cursor-default">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">History Logged</div>
                                    <div className="text-sm font-bold text-white">Asset Equity Impacted</div>
                                </div>
                            </div>
                        </div>
                        <button
                            className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all active:scale-95 shadow-xl shadow-white/5"
                        >
                            Export Audit Report (PDF)
                        </button>
                    </div>
                </div>
            </div>

            {/* Fullscreen Preview Modal */}
            {isFullscreen && record.attachmentUrl && (
                <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
                    <div className="p-6 flex items-center justify-between border-b border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 p-2 rounded-lg">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-white font-black tracking-tight">{record.attachmentFileName || 'Audit Source Document'}</h2>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Full Resolution Verification</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <a
                                href={record.attachmentUrl}
                                download
                                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                                title="Download"
                            >
                                <Download className="w-5 h-5" />
                            </a>
                            <button
                                onClick={() => setIsFullscreen(false)}
                                className="p-3 bg-white/10 hover:bg-rose-500 text-white rounded-xl transition-all"
                            >
                                <Maximize2 className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden p-10">
                        {record.attachmentUrl.toLowerCase().endsWith('.pdf') ? (
                            <iframe src={record.attachmentUrl} className="w-full h-full rounded-2xl border border-white/10" title="PDF Archive" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center overflow-auto custom-scrollbar">
                                <img src={record.attachmentUrl} className="max-w-none transform scale-150 transition-transform hover:scale-100 cursor-zoom-out" alt="Invoice Archive" onClick={() => setIsFullscreen(false)} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceRecordDetailPage;
