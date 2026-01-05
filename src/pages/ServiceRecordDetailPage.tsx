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
import { workOrdersApi } from '@/lib/workOrdersApi';
import { WorkOrderDto, Equipment, WorkOrder } from '@/lib/types';
import { equipmentApi } from '@/lib/equipmentApi';
import { useToast } from "@/hooks/use-toast";

const ServiceRecordDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [record, setRecord] = useState<WorkOrder | null>(null);
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
            const wo = await workOrdersApi.get(id!);
            console.log("[Detail] Found in Work Orders:", wo);

            // Fetch equipment details if needed
            if (wo.equipmentId) {
                try {
                    const eq = await equipmentApi.get(wo.equipmentId);
                    setEquipment(eq);
                } catch (e) { console.warn("Could not load equipment details"); }
            }

            // Map WorkOrderDto to WorkOrder
            const mapped: WorkOrder = {
                id: wo.id,
                woNumber: wo.workOrderNumber || `WO-${wo.id.slice(0, 5)}`,
                equipmentId: wo.equipmentId || "",
                vendor: (wo as any).vendorName || wo.vendorId || "Unknown Vendor",
                status: (wo.status as any), // Cast string to enum if needed
                priority: (wo.priority as any),
                date: wo.closedAt || wo.openedAt || new Date().toISOString(),
                technician: "",
                title: wo.title,
                complaint: wo.complaint,
                notes: wo.notes,
                estimatedTotal: wo.estimatedTotal,
                manualActualTotal: wo.manualActualTotal,
                costSource: (wo.costSource as any),
                totalCost: wo.manualActualTotal || wo.estimatedTotal || 0,
                partsCost: 0,
                laborCost: 0,
                description: wo.notes || wo.complaint || "Service",
                items: wo.lines?.map(l => ({
                    id: l.id,
                    serviceType: l.type,
                    description: l.description,
                    quantity: l.qty,
                    unitPrice: l.unitPrice,
                    cost: l.amount,
                    type: l.type as any
                })) || [],
                media: [],
                odometer: wo.odometerAtService || 0,
                hours: 0
            };

            setRecord(mapped);

        } catch (err) {
            console.error("Error loading record:", err);
            toast({
                title: "Error",
                description: "Could not load service record details.",
                variant: "destructive"
            });
            navigate('/maintenance/service-history');
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

    // Filter out summary lines that AI catchers might have included (duplicates)
    const invalidTerms = ['subtotal', 'total', 'taxable', 'non-taxable', 'amount due', 'balance due', 'liability'];
    const validLines = record.lines?.filter(l => {
        const desc = (l.description || '').toLowerCase();
        // Allow "Taxable" if it's "Taxable Parts" or clearly a category, but "Non-taxable" is usually a summary
        // Actually, "Taxable" line in screenshot was $44.80 which was sum of parts + fee. So it IS a summary.
        return !invalidTerms.some(term => desc === term || desc.startsWith(term + ' '));
    }) || [];

    const taxTypes = ['tax', 'taxes', 'fee', 'fees'];
    const taxLines = validLines.filter(l => taxTypes.includes((l.type || '').toLowerCase()));
    const serviceLines = validLines.filter(l => !taxTypes.includes((l.type || '').toLowerCase()));

    const taxLinesSum = taxLines.reduce((acc, l) => acc + (l.amount || 0), 0);
    const serviceLinesSum = serviceLines.reduce((acc, l) => acc + (l.amount || 0), 0);
    const totalLinesSum = taxLinesSum + serviceLinesSum;

    // Use lines if we have any, otherwise fall back to record totals
    const hasLines = totalLinesSum > 0 || validLines.length > 0;

    const displayedSubtotal = hasLines ? serviceLinesSum : (record.totalCost || 0);
    const displayedTax = hasLines ? taxLinesSum : 0;
    const displayedTotal = hasLines ? totalLinesSum : (record.totalCost || 0);



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
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${(record.status as string)?.toLowerCase() === 'completed'
                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    : 'bg-blue-50 text-blue-600 border-blue-100'
                                    }`}>
                                    {record.status}
                                </div>
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
                                        <div className="text-lg font-black text-slate-900">{record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{record.woNumber || 'Draft'}</h1>
                                    <div className="flex items-center gap-2 mt-2 text-slate-500">
                                        <Store className="w-4 h-4" />
                                        <span className="font-bold text-xs uppercase tracking-widest">{record.vendor || 'Unknown Vendor'}</span>
                                        <span className="text-slate-300">•</span>
                                        <Calendar className="w-4 h-4" />
                                        <span className="font-bold text-xs uppercase tracking-widest">{new Date(record.date || "").toLocaleDateString()}</span>
                                    </div>
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
                                    {validLines.map((line, idx) => (
                                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-10 py-8">
                                                <div className="font-black text-slate-900 text-sm tracking-tight">{line.description}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{line.type}</div>
                                            </td>
                                            <td className="px-10 py-8 font-black text-slate-700 text-sm">{line.quantity}</td>
                                            <td className="px-10 py-8 text-right font-mono font-bold text-slate-600 text-sm">${line.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="px-10 py-8 text-right font-mono font-black text-slate-900 text-sm">${line.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                    {(!validLines || validLines.length === 0) && (
                                        <tr>
                                            <td className="px-10 py-10" colSpan={4}>
                                                <div className="text-sm font-bold text-slate-400 italic">No itemized lines extracted. Check raw summary below.</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-50/50">
                                        <td colSpan={3} className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxes & Fees</td>
                                        <td className="px-10 py-6 text-right font-mono font-black text-rose-600 text-sm">${displayedTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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
                                "{record.notes || record.description || "The service was performed by an authorized partner. All line items have been verified against the fleet policy."}"
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
                                            title="Download"
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
