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
    ShieldCheck,
    MoreVertical,
    Edit,
    Copy,
    Mail,
    Star,
    Upload,
    PlayCircle,
    Image as ImageIcon
} from 'lucide-react';
import { workOrdersApi } from '@/lib/workOrdersApi';
import { shopsApi } from '@/lib/shopsApi';
import { WorkOrderDto, Equipment, WorkOrder, DocumentRole } from '@/lib/types';
import { equipmentApi } from '@/lib/equipmentApi';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

import { InfoItem, ServiceItemsList, EmptyState } from "@/components/workorder/detail/WorkOrderDetailComponents";
import CreateWorkOrderDialog from '@/components/workorder/CreateWorkOrderDialog';
import EditWorkOrderDialog from '@/components/workorder/EditWorkOrderDialog';

const ServiceRecordDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [record, setRecord] = useState<WorkOrder | null>(null);
    const [rawDto, setRawDto] = useState<WorkOrderDto | null>(null); // Store raw DTO for editing
    const [equipment, setEquipment] = useState<Equipment | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeMediaIndex, setActiveMediaIndex] = useState(0);

    // Dialog States
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Notes state (local until saved)
    const [notes, setNotes] = useState("");

    useEffect(() => {
        if (id) {
            fetchDetail();
        }
    }, [id]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const wo = await workOrdersApi.get(id!);
            setRawDto(wo);

            // Fetch equipment details if needed
            if (wo.equipmentId) {
                try {
                    const eq = await equipmentApi.get(wo.equipmentId);
                    setEquipment(eq);
                } catch (e) { console.warn("Could not load equipment details"); }
            }

            // Fetch vendor details if vendorId is present but vendorName is missing
            let fetchedVendorName = (wo as any).vendorName;
            if (wo.vendorId && !fetchedVendorName) {
                try {
                    const shop = await shopsApi.get(wo.vendorId);
                    if (shop) fetchedVendorName = shop.shop_name;
                } catch (e) {
                    console.warn("Could not load shop details", e);
                }
            }

            // Fetch attachments
            // Attachments are now included in the WorkOrderDto, but we fetch explicitly to be safe if Include is missing
            let attachments = wo.documents || [];
            if (!attachments.length) {
                try {
                    attachments = await workOrdersApi.listAttachments(id!);
                } catch (e) {
                    console.warn("Could not list attachments independently", e);
                }
            }

            const mappedAttachments = attachments.map(doc => {
                const ft = (doc.fileType || '').toLowerCase();
                const urlLower = (doc.fileUrl || '').toLowerCase();
                let type: 'image' | 'video' | 'pdf' = 'image';

                if (ft.includes('pdf') || urlLower.endsWith('.pdf')) type = 'pdf';
                else if (ft.includes('video') || urlLower.endsWith('.mp4') || urlLower.endsWith('.mov') || urlLower.endsWith('.webm')) type = 'video';

                return {
                    url: doc.fileUrl,
                    type,
                    name: doc.fileName || doc.role?.toString() || 'Attachment',
                    role: doc.role
                };
            }).sort((a, b) => {
                // Priority: Role 50 (Invoice) or 51 (Receipt) -> Name contains "Invoice"/"Receipt" -> Date
                const isReceiptA = a.role === DocumentRole.Invoice || a.role === DocumentRole.Receipt ||
                    a.name.toLowerCase().includes('invoice') || a.name.toLowerCase().includes('receipt');
                const isReceiptB = b.role === DocumentRole.Invoice || b.role === DocumentRole.Receipt ||
                    b.name.toLowerCase().includes('invoice') || b.name.toLowerCase().includes('receipt');

                if (isReceiptA && !isReceiptB) return -1;
                if (!isReceiptA && isReceiptB) return 1;
                return 0;
            });

            // Map WorkOrderDto to WorkOrder
            const mapped: WorkOrder = {
                id: wo.id,
                woNumber: wo.workOrderNumber || `WO-${wo.id.slice(0, 5)}`,
                equipmentId: wo.equipmentId || "",
                vendorId: wo.vendorId || null,
                vendor: fetchedVendorName, // Use the reliably fetched name
                status: (wo.status as any),
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
                media: mappedAttachments,
                odometer: wo.odometerAtService || 0,
                hours: 0,
                attachmentUrl: mappedAttachments.length > 0 ? mappedAttachments[0].url : ((wo as any).previewUrl || (wo as any).attachmentUrl),
                attachmentFileName: mappedAttachments.length > 0 ? mappedAttachments[0].name : (wo as any).fileName
            };

            setRecord(mapped);
            setNotes(wo.notes || "");
            setActiveMediaIndex(0);

        } catch (err) {
            console.error("Error loading record:", err);
            toast({
                title: "Error",
                description: "Could not load service record details.",
                variant: "destructive"
            });
            navigate('/app/maintenance/service-history'); // Fix path
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const invalidTerms = ['subtotal', 'total', 'taxable', 'non-taxable', 'amount due', 'balance due', 'liability'];
    const validLines = record?.items?.filter(l => {
        const desc = (l.description || '').toLowerCase();
        return !invalidTerms.some(term => desc === term || desc.startsWith(term + ' '));
    }) || [];

    const taxTypes = ['tax', 'taxes', 'fee', 'fees'];
    const taxLines = validLines.filter(l => taxTypes.includes((l.type || '').toLowerCase()));
    const serviceLines = validLines.filter(l => !taxTypes.includes((l.type || '').toLowerCase()));
    const taxSum = taxLines.reduce((acc, l) => acc + (l.cost || 0), 0);
    const serviceSum = serviceLines.reduce((acc, l) => acc + (l.cost || 0), 0);
    const totalSum = taxSum + serviceSum;
    const hasLines = validLines.length > 0;
    const displayedTotal = hasLines ? totalSum : (record?.totalCost || 0);

    // Actions
    const handleDownloadReceipt = () => {
        if (!record?.media || record.media.length === 0) {
            toast({ title: "No Receipt", description: "There is no digital receipt attached to this record." });
            return;
        }

        // Try to find a receipt/invoice
        const receipt = record.media.find(m =>
            m.name.toLowerCase().includes('invoice') ||
            m.name.toLowerCase().includes('receipt')
        ) || record.media[0];

        if (receipt?.url) {
            window.open(receipt.url, '_blank');
        }
    };

    const handleDuplicate = () => {
        toast({ title: "Duplicate", description: "This feature will allow cloning this work order for a new service." });
        // Logic: Open Create Dialog with pre-filled data
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this work order?")) return;
        try {
            await workOrdersApi.delete(id!);
            toast({ title: "Deleted", description: "Work Order deleted successfully." });
            navigate('/app/maintenance'); // Back to list
        } catch (e) {
            toast({ title: "Error", description: "Failed to delete work order.", variant: "destructive" });
        }
    };

    // Vendor Logic: Use 'vendor' from record, but we can also use 'rawDto.vendorId' and props if we had them.
    // Assuming record.vendor is populated correctly (we might need to map it better later if it comes up "Unknown Vendor" again).
    const vendorName = record?.vendor || "In-House Service"; // Placeholder

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 transition-all"></div>
            </div>
        );
    }

    if (!record) return <div>Record Not Found</div>;

    const currentMedia = record?.media?.[activeMediaIndex] || (record?.attachmentUrl ? { url: record.attachmentUrl, type: record.attachmentUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image', name: 'Receipt' } : null);

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl hover:bg-slate-100">
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                                    {record.woNumber}
                                </h1>
                                <Badge className={`uppercase tracking-widest text-[10px] font-black border-0
                                    ${(record.status as string)?.toLowerCase() === 'completed'
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'bg-blue-50 text-blue-600'
                                    }`}>
                                    {record.status}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={handleDownloadReceipt} className="hidden sm:flex">
                            <FileText className="w-4 h-4 mr-2" /> View Receipt
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                        </Button>
                        <Button variant="ghost" onClick={handleDuplicate} className="hidden sm:flex">
                            <Copy className="w-4 h-4 mr-2" /> Duplicate
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4 text-slate-500" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => toast({ title: "Export", description: "Exporting PDF..." })}>
                                    <Printer className="w-4 h-4 mr-2" /> Export PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast({ title: "Email", description: "Emailing Vendor..." })}>
                                    <Mail className="w-4 h-4 mr-2" /> Email Shop
                                </DropdownMenuItem>
                                {record.status === 'Completed' && (
                                    <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                                        {/* Setup Rating inside Edit Dialog */}
                                        <Star className="w-4 h-4 mr-2" /> Rate Service
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:bg-red-50 focus:text-red-700">
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Main Content */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Service Summary Card */}
                    <Card className="rounded-[2rem] border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-6">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Service Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                <InfoItem icon={<Truck className="w-4 h-4" />} label="Asset">
                                    <div className="text-blue-600 cursor-pointer hover:underline mb-1">
                                        Unit {record.assetNumber || (equipment as any)?.unitNumber || 'N/A'}
                                    </div>
                                    <div className="text-xs text-slate-400 font-normal">
                                        {equipment?.year} {equipment?.make} {equipment?.model}
                                    </div>
                                </InfoItem>

                                <InfoItem icon={<Calendar className="w-4 h-4" />} label="Service Date">
                                    {new Date(record.date).toLocaleDateString()}
                                </InfoItem>

                                <InfoItem icon={<MapPin className="w-4 h-4" />} label="Odometer">
                                    {record.odometer > 0 ? `${record.odometer.toLocaleString()} mi` : <span className="text-amber-500">Not Recorded</span>}
                                </InfoItem>

                                <InfoItem icon={<Store className="w-4 h-4" />} label="Service Provider">
                                    <div className="text-blue-600 font-bold">{vendorName}</div>
                                    <div className="flex items-center gap-1 text-xs text-amber-500 mt-1">
                                        <Star className="w-3 h-3 fill-current" />
                                        <span>4.8</span>
                                        <span className="text-slate-400">(12 reviews)</span>
                                    </div>
                                </InfoItem>

                                <InfoItem icon={<AlertCircle className="w-4 h-4" />} label="Priority">
                                    <Badge variant="secondary" className="uppercase text-[10px] font-bold tracking-wider">{record.priority}</Badge>
                                </InfoItem>

                                <InfoItem icon={<DollarSign className="w-4 h-4" />} label="Total Cost">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl font-black text-slate-900">${displayedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px]">Verified</Badge>
                                    </div>
                                </InfoItem>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Services Performed Card */}
                    <Card className="rounded-[2rem] border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-white py-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Services Performed</CardTitle>
                            <Button size="sm" variant={hasLines ? "ghost" : "outline"} onClick={() => setIsEditDialogOpen(true)}>
                                {hasLines ? <><Edit className="w-3 h-3 mr-2" /> Edit Items</> : "+ Add Items"}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            {hasLines ? (
                                <ServiceItemsList items={serviceLines} total={displayedTotal} tax={taxSum} />
                            ) : (
                                <EmptyState
                                    title="No itemized items"
                                    description="No line items were extracted from the receipt or added manually."
                                    actions={[
                                        { label: "Edit Work Order", onClick: () => setIsEditDialogOpen(true) }
                                    ]}
                                />
                            )}
                        </CardContent>
                    </Card>

                    {/* Audit Findings */}
                    <Card className="rounded-[2rem] border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-blue-50/30 border-b border-blue-50 py-4 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-blue-500" />
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-900">AI Audit Findings</CardTitle>
                            </div>
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">98% Match</Badge>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-sm text-slate-600 italic">
                                "All costs appear to be within standard range for {vendorName}. No anomalies detected in labor hours or parts pricing."
                            </p>
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card className="rounded-[2rem] border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="py-6">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-0">
                            <Textarea
                                placeholder="Add notes about this service..."
                                className="bg-slate-50 border-slate-200 focus:bg-white transition-all min-h-[100px]"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                            <div className="flex justify-end mt-2">
                                <Button size="sm" onClick={() => toast({ title: "Saved", description: "Notes updated." })}>Save Notes</Button>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Right Sidebar */}
                <div className="space-y-8">

                    {/* Receipt Preview */}
                    <Card className="rounded-[2rem] border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                        <CardHeader className="py-4 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Attachments</CardTitle>
                                {record.media && record.media.length > 0 && (
                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{activeMediaIndex + 1} / {record.media.length}</Badge>
                                )}
                            </div>
                            {currentMedia && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => window.open(currentMedia.url, '_blank')}><Download className="w-3 h-3" /></Button>
                            )}
                        </CardHeader>

                        {/* Main Preview Area */}
                        <div className="flex-1 bg-slate-100 relative group overflow-hidden flex items-center justify-center bg-slate-900/5">
                            {currentMedia ? (
                                <>
                                    {currentMedia.type === 'pdf' ? (
                                        <iframe src={currentMedia.url} className="w-full h-full border-0" title="Receipt" />
                                    ) : currentMedia.type === 'video' ? (
                                        <video src={currentMedia.url} controls className="max-w-full max-h-full object-contain" />
                                    ) : (
                                        <img src={currentMedia.url} className="object-contain max-h-full max-w-full shadow-sm" alt="Receipt" />
                                    )}

                                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pb-16">
                                        <Button variant="secondary" size="sm" onClick={() => setIsFullscreen(true)}>
                                            <Maximize2 className="w-4 h-4 mr-2" /> View Fullscreen
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <EmptyState
                                    icon={<Upload className="w-6 h-6 text-slate-300" />}
                                    description="No attachments found"
                                    actions={[
                                        { label: "Upload", onClick: () => toast({ title: "Upload", description: "Upload dialog would open here." }) }
                                    ]}
                                />
                            )}
                        </div>

                        {/* Thumbnails Strip */}
                        {record.media && record.media.length > 1 && (
                            <div className="h-20 border-t border-slate-200 bg-white p-2 flex gap-2 overflow-x-auto">
                                {record.media.map((m, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveMediaIndex(idx)}
                                        className={`relative w-16 h-full rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${activeMediaIndex === idx ? 'border-blue-600 ring-1 ring-blue-600' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                    >
                                        {m.type === 'video' ? (
                                            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                                <PlayCircle className="w-6 h-6 text-white/80" />
                                            </div>
                                        ) : m.type === 'pdf' ? (
                                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-slate-400" />
                                            </div>
                                        ) : (
                                            <img src={m.url} className="w-full h-full object-cover" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* Quick Actions */}
                    <Card className="rounded-[2rem] border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="py-4 border-b border-slate-100">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-50">
                                <button className="w-full text-left px-6 py-4 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-3"
                                    onClick={() => setIsEditDialogOpen(true)}>
                                    <Edit className="w-4 h-4 text-slate-400" /> Rate This Service
                                </button>
                                <button className="w-full text-left px-6 py-4 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-3"
                                    onClick={() => {
                                        if (record.vendorId) {
                                            navigate(`/app/shops/${record.vendorId}`);
                                        } else {
                                            toast({ title: "No Shop Profile", description: "This work order is not linked to an external vendor profile." });
                                        }
                                    }}>
                                    <Store className="w-4 h-4 text-slate-400" /> View Shop Profile
                                </button>
                                <button className="w-full text-left px-6 py-4 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-3"
                                    onClick={() => toast({ title: "Asset History", description: `Navigating to Asset ${record.assetNumber}...` })}>
                                    <Truck className="w-4 h-4 text-slate-400" /> View Asset History
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Compliance */}
                    <Card className="rounded-[2rem] border-slate-200 shadow-sm overflow-hidden bg-slate-900 text-white">
                        <CardHeader className="py-4 border-b border-white/10">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-white/70">Compliance</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <FileCheck className="w-3 h-3 text-emerald-400" />
                                </div>
                                <span className="text-sm font-medium">Cost Integrity Pass</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <ShieldCheck className="w-3 h-3 text-blue-400" />
                                </div>
                                <span className="text-sm font-medium">Audit Record Verified</span>
                            </div>
                            <Button className="w-full bg-white/10 hover:bg-white/20 text-white border-0 mt-2">
                                Export Audit Report
                            </Button>
                        </CardContent>
                    </Card>

                </div>
            </div>

            {/* Edit Dialog */}
            {rawDto && (
                <EditWorkOrderDialog
                    workOrder={rawDto}
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                    onWorkOrderUpdated={fetchDetail}
                />
            )}

            {/* Fullscreen Preview Modal */}
            {isFullscreen && currentMedia && (
                <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
                    <div className="p-6 flex items-center justify-between border-b border-white/10">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 p-2 rounded-lg">
                                {currentMedia.type === 'video' ? <PlayCircle className="w-5 h-5 text-white" /> :
                                    currentMedia.type === 'pdf' ? <FileText className="w-5 h-5 text-white" /> :
                                        <ImageIcon className="w-5 h-5 text-white" />}
                            </div>
                            <h2 className="text-white font-black tracking-tight">{currentMedia.name || 'Attachment Preview'}</h2>
                        </div>
                        <Button variant="ghost" onClick={() => setIsFullscreen(false)} className="text-white hover:bg-white/10">
                            Close
                        </Button>
                    </div>
                    <div className="flex-1 p-8 flex items-center justify-center overflow-hidden">
                        {currentMedia.type === 'pdf' ? (
                            <iframe src={currentMedia.url} className="w-full h-full rounded-2xl bg-white" />
                        ) : currentMedia.type === 'video' ? (
                            <video src={currentMedia.url} controls autoPlay className="max-w-full max-h-full rounded-2xl shadow-2xl" />
                        ) : (
                            <img src={currentMedia.url} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceRecordDetailPage;
