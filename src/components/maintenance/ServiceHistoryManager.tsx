import React, { useState, useEffect, useRef } from 'react';
import {
    Plus,
    X,
    Loader2,
    Sparkles,
    Truck as TruckIcon,
    CheckCircle2,
    ChevronRight,
    Upload,
    DollarSign,
    ClipboardList,
    Search,
    Store,
    Trash2,
    ShieldCheck,
    Clock,
    Gauge,
    AlertTriangle
} from 'lucide-react';
import VehicleSelector from '../workorder/VehicleSelector';
import {
    WorkOrder,
    WorkOrderStatus,
    Equipment,
    WorkOrderPriority,
    Vendor,
    VendorStatus,
    WorkOrderItem,
    WorkOrderMedia,
    ReceiptParsedData,
    WorkOrderDto
} from '@/lib/types';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';
import { parseReceipt, fetchDetailedVendorInfo, searchVendorSuggestions } from '@/lib/gemini';

interface ServiceHistoryManagerProps {
    records: WorkOrder[];
    equipmentList: Equipment[];
    vendors: Vendor[];
    onAdd: (record: Omit<WorkOrder, 'id'>, files?: File[], rawAiData?: any) => void;
    onUpdate: (id: string, updates: Partial<WorkOrder>, files?: File[]) => void;
    onUpdateVendors: (vendors: Vendor[]) => void;
    prefilledEquipmentId?: string;
    initialSelectedRecordId?: string | null;
    availableWorkOrders?: WorkOrderDto[];
}

interface SmartSuggestion {
    id?: string;
    name: string;
    address: string;
    uri?: string;
    rating?: number;
    source: 'trusted' | 'google';
}

interface MatchConfidence {
    score: number;
    reasons: string[];
    warnings: string[];
}

const NAME_ALIASES: Record<string, string[]> = {
    'TA': ['TravelCenters of America', 'TA Travel Center', 'TA Truck Service'],
    'Petro': ['Petro Stopping Centers', 'TA Petro', 'Petro Truck Service'],
    'Loves': ["Love's Travel Stops", "Love's Truck Stop", "Loves Travel Stops"],
    'Pilot': ['Pilot Flying J', 'Pilot Travel Centers', 'Flying J Travel Center']
};

const ServiceHistoryManager: React.FC<ServiceHistoryManagerProps> = ({
    records,
    equipmentList,
    vendors,
    onAdd,
    onUpdate,
    onUpdateVendors,
    prefilledEquipmentId,
    initialSelectedRecordId,
    availableWorkOrders = []
}) => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<WorkOrder | null>(null);
    const [isParsingReceipt, setIsParsingReceipt] = useState(false);
    const [parsingError, setParsingError] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState(false);
    const [statusFilter, setStatusFilter] = useState<WorkOrderStatus | 'ALL'>('ALL');

    const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [combinedSuggestions, setCombinedSuggestions] = useState<SmartSuggestion[]>([]);
    const [selectedVendorCard, setSelectedVendorCard] = useState<Partial<Vendor> | null>(null);
    const [matchConfidence, setMatchConfidence] = useState<MatchConfidence | null>(null);

    const [aiPopulatedFields, setAiPopulatedFields] = useState<Set<string>>(new Set());
    const [rawAiData, setRawAiData] = useState<any>(null);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [newItemValue, setNewItemValue] = useState('');
    const [editingItemId, setEditingItemId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<WorkOrder> & { workOrderId?: string }>({
        woNumber: `SR-${Math.floor(Math.random() * 100000)}`,
        status: WorkOrderStatus.Completed,
        priority: WorkOrderPriority.Normal,
        date: new Date().toISOString().split('T')[0],
        totalCost: 0,
        description: '',
        vendor: '',
        vendorAddress: '',
        equipmentId: '',
        items: [],
        media: [],
        notes: '',
        payer: 'Company',
        odometer: 0,
        hours: 0,
        vehicle_type: 'truck',
        workOrderId: undefined
    });

    const normalizeDate = (dateStr: string): string => {
        if (!dateStr) return '';

        // Trim and remove any hidden chars
        const cleanDate = dateStr.trim();

        // If already yyyy-MM-dd
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) return cleanDate;

        try {
            const d = new Date(cleanDate);
            if (!isNaN(d.getTime())) {
                const normalized = d.toISOString().split('T')[0];
                console.log(`Normalized date: ${cleanDate} -> ${normalized}`);
                return normalized;
            }
        } catch (e) { }

        // Manual fallback for MM/DD/YYYY
        const md = cleanDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (md) {
            const m = md[1].padStart(2, '0');
            const day = md[2].padStart(2, '0');
            const y = md[3];
            return `${y}-${m}-${day}`;
        }

        console.warn(`Could not normalize date: ${cleanDate}`);
        return cleanDate;
    };

    const receiptInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (prefilledEquipmentId) {
            setFormData(prev => ({
                ...prev,
                equipmentId: prefilledEquipmentId,
                woNumber: `SR-${Math.floor(Math.random() * 100000)}`,
                status: WorkOrderStatus.Completed,
            }));
            setIsModalOpen(true);
        }
    }, [prefilledEquipmentId]);

    useEffect(() => {
        if (initialSelectedRecordId && records.length > 0) {
            const record = records.find(r => r.id === initialSelectedRecordId);
            if (record) {
                setSelectedRecord(record);
                setFormData(record);
                setIsModalOpen(true);
            }
        }
    }, [initialSelectedRecordId, records]);

    // Auto-sync total cost from items if items changed and total is 0 (manual entry helper)
    useEffect(() => {
        if (!isParsingReceipt && formData.items && formData.items.length > 0) {
            const sumOfItems = formData.items.reduce((sum, it) => sum + (it.cost || 0), 0);
            if (formData.totalCost === 0 && sumOfItems > 0) {
                setFormData(prev => ({ ...prev, totalCost: sumOfItems }));
            }
        }
    }, [formData.items, isParsingReceipt, formData.totalCost]);

    useEffect(() => {
        const input = formData.vendor;
        if (!input || input.length < 2 || isVerified) {
            setCombinedSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearchingSuggestions(true);
            const trustedMatches: SmartSuggestion[] = vendors
                .filter(v => v.name.toLowerCase().includes(input.toLowerCase()))
                .map(v => ({ id: v.id, name: v.name, address: v.address, rating: v.rating, source: 'trusted' }));

            let googleMatches: SmartSuggestion[] = [];
            if (input.length >= 3) {
                try {
                    const results = await searchVendorSuggestions(input);
                    if (Array.isArray(results)) {
                        googleMatches = results
                            .filter(r => !trustedMatches.some(tm => tm.name.toLowerCase() === (r.title).toLowerCase()))
                            .map(r => ({ name: r.title, address: r.address, uri: r.uri, source: 'google' }));
                    }
                } catch (err) { console.error("Vendor search error:", err); }
            }
            setCombinedSuggestions([...trustedMatches, ...googleMatches]);
            setShowSuggestions(combinedSuggestions.length > 0);
            setIsSearchingSuggestions(false);
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.vendor, isVerified, vendors]);

    const normalize = (str?: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    const calculateMatchConfidence = (extracted: ReceiptParsedData, googleResult: any): MatchConfidence => {
        let score = 0;
        const reasons: string[] = [];
        const warnings: string[] = [];

        const extractedAddr = normalize(extracted.businessAddress.street + extracted.businessAddress.zip);
        const googleAddr = normalize(googleResult.address);

        if (googleAddr.includes(normalize(extracted.businessAddress.street))) {
            score += 50;
            reasons.push("Address matches receipt exactly");
        } else {
            warnings.push("Address does not match receipt exactly");
        }

        if (extracted.businessContact?.phone && googleResult.phone && normalize(extracted.businessContact.phone) === normalize(googleResult.phone)) {
            score += 30;
            reasons.push("Phone number matches receipt");
        }

        const eName = extracted.businessName.toLowerCase();
        const gName = googleResult.name.toLowerCase();

        let nameMatch = gName.includes(eName) || eName.includes(gName);
        let aliasDetected = false;

        for (const [alias, variations] of Object.entries(NAME_ALIASES)) {
            if (eName.includes(alias.toLowerCase())) {
                if (variations.some(v => gName.includes(v.toLowerCase()))) {
                    nameMatch = true;
                    aliasDetected = true;
                    break;
                }
            }
        }

        if (nameMatch) {
            score += 20;
            if (aliasDetected) {
                reasons.push(`Name variation detected (${extracted.businessName} → ${googleResult.name})`);
            } else {
                reasons.push("Business name similarity verified");
            }
        } else {
            warnings.push("Business name mismatch");
        }

        return { score, reasons, warnings };
    };

    const processAIParsing = async (file: File, base64: string) => {
        setIsParsingReceipt(true);
        setParsingError(null);
        try {
            const result: ReceiptParsedData | null = await parseReceipt(base64, file.type);
            if (result) {
                const newAiFields = new Set<string>();
                const updates: Partial<WorkOrder> = {};

                const searchString = `${result.businessAddress.street}, ${result.businessAddress.city}, ${result.businessAddress.state} ${result.businessAddress.zip}`;
                const verifyResults = await searchVendorSuggestions(searchString);

                if (verifyResults && verifyResults.length > 0) {
                    const googleTop = verifyResults[0];
                    const details = await fetchDetailedVendorInfo(googleTop.title, googleTop.address);

                    if (details) {
                        const confidence = calculateMatchConfidence(result, {
                            name: details.name,
                            address: details.street + details.zip,
                            phone: details.phone
                        });
                        setMatchConfidence(confidence);

                        const fullAddress = [details.street, details.city, details.state].filter(Boolean).join(', ') || googleTop.address;

                        setSelectedVendorCard({
                            name: details.name,
                            address: fullAddress,
                            phone: details.phone,
                            email: result.businessContact?.email,
                            website: details.website,
                            rating: details.rating,
                            reviewCount: details.reviewCount
                        });

                        updates.vendor = details.name;
                        updates.vendorAddress = fullAddress;
                        setIsVerified(true);
                    }
                } else {
                    setMatchConfidence({ score: 0, reasons: [], warnings: ["No exact location found via Google Maps"] });
                    const extractedAddr = `${result.businessAddress.street}, ${result.businessAddress.city}, ${result.businessAddress.state} ${result.businessAddress.zip}`;
                    updates.vendor = result.businessName;
                    updates.vendorAddress = extractedAddr;
                    setSelectedVendorCard({
                        name: result.businessName,
                        address: extractedAddr,
                        phone: result.businessContact?.phone,
                        email: result.businessContact?.email,
                        website: result.businessContact?.website
                    });
                }

                newAiFields.add('vendor');
                newAiFields.add('vendorAddress');

                if (result.date) {
                    updates.date = normalizeDate(result.date);
                    newAiFields.add('date');
                }
                if (result.total) {
                    updates.totalCost = result.total;
                    newAiFields.add('totalCost');
                }
                if (result.notes) {
                    updates.notes = result.notes;
                    newAiFields.add('notes');
                }
                if (result.items && result.items.length > 0) {
                    updates.items = result.items
                        .filter(it => {
                            const desc = (it.description || "").toLowerCase();
                            // Filter out redundant summary lines from AI
                            const isSummary = desc.includes("subtotal") ||
                                desc.includes("total") ||
                                (desc.includes("taxable") && !desc.includes("part")) ||
                                desc.includes("amount due") ||
                                desc.includes("balance due") ||
                                desc.includes("liability");
                            return !isSummary;
                        })
                        .map((it, idx) => ({
                            id: `ai-item-${Date.now()}-${idx}`,
                            description: it.description,
                            cost: it.cost,
                            type: it.type as any,
                            serviceType: 'General'
                        }));
                    newAiFields.add('items');
                }

                if (result.unitNumber) {
                    const matchedEquip = equipmentList.find(e =>
                        e.unitNumber.toLowerCase().includes(result.unitNumber!.toLowerCase())
                    );
                    if (matchedEquip) {
                        updates.equipmentId = matchedEquip.id;
                        (updates as any).vehicle_type = matchedEquip.type.toLowerCase();
                        newAiFields.add('equipmentId');
                    }
                }

                setFormData(prev => ({ ...prev, ...updates }));
                setAiPopulatedFields(newAiFields);
                setRawAiData(result);
            } else {
                setParsingError("Could not parse receipt. Please enter details manually.");
            }
        } catch (err: any) {
            setParsingError(err.message || "AI parsing failed.");
        } finally {
            setIsParsingReceipt(false);
        }
    };

    const handleFileUpload = async (file: File) => {
        if (!file) return;
        setAttachedFiles(prev => [...prev, file]);
        const reader = new FileReader();
        reader.onloadend = async () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            const newMedia: WorkOrderMedia = {
                url: dataUrl,
                type: file.type.includes('pdf') ? 'pdf' : 'image',
                name: file.name,
                size: file.size,
                uploadedAt: new Date().toISOString()
            };
            setFormData(prev => ({
                ...prev,
                media: [...(prev.media || []), newMedia]
            }));
            if (file.type.includes('image') || file.type.includes('pdf')) {
                await processAIParsing(file, base64);
            }
        };
        reader.readAsDataURL(file);
    };

    const removeMedia = (index: number) => {
        if (window.confirm("Delete this attachment?")) {
            setFormData(prev => ({
                ...prev,
                media: prev.media?.filter((_, i) => i !== index)
            }));
            setAttachedFiles(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleSelectSmartSuggestion = async (suggestion: SmartSuggestion) => {
        setFormData(prev => ({ ...prev, vendor: suggestion.name, vendorAddress: suggestion.address }));
        setIsVerified(true);
        setShowSuggestions(false);
        const details = await fetchDetailedVendorInfo(suggestion.name, suggestion.address);
        if (details) {
            const fullAddress = [details.street, details.city, details.state].filter(Boolean).join(', ') || suggestion.address;
            setSelectedVendorCard({
                name: details.name,
                address: fullAddress,
                phone: details.phone,
                rating: details.rating,
                website: details.website
            });
            setFormData(prev => ({ ...prev, vendorAddress: fullAddress }));
        }
    };

    const handleCommitItem = () => {
        if (!newItemValue.trim()) return;
        const newItem: WorkOrderItem = {
            id: `item-${Date.now()}`,
            serviceType: 'General',
            description: newItemValue,
            cost: 0
        };
        const updatedItems = [...(formData.items || []), newItem];
        setFormData(prev => ({
            ...prev,
            items: updatedItems
        }));
        setNewItemValue('');
        setIsAddingItem(false);
    };

    const syncTotalFromItems = () => {
        const total = formData.items?.reduce((sum, it) => sum + (it.cost || 0), 0) || 0;
        setFormData(prev => ({ ...prev, totalCost: total }));
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.equipmentId) {
            alert("Please select an asset.");
            return;
        }

        console.log("Submitting Service Record with Data:", formData);
        onAdd(formData as any, attachedFiles, rawAiData);
        setIsModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            woNumber: `SR-${Math.floor(Math.random() * 100000)}`,
            status: WorkOrderStatus.Completed,
            priority: WorkOrderPriority.Normal,
            date: new Date().toISOString().split('T')[0],
            totalCost: 0,
            items: [],
            media: [],
            vendor: '',
            vendorAddress: '',
            equipmentId: '',
            notes: '',
            payer: 'Company',
            odometer: 0,
            hours: 0
        });
        setAttachedFiles([]);
        setRawAiData(null);
        setSelectedVendorCard(null);
        setMatchConfidence(null);
        setIsVerified(false);
        setIsAddingItem(false);
        setAiPopulatedFields(new Set());
        setParsingError(null);
    };

    const getStatusBadgeClass = (status: WorkOrderStatus) => {
        switch (status) {
            case WorkOrderStatus.Completed: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case WorkOrderStatus.InProcess: return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const AiBadge = () => (
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ml-2 border border-blue-100 animate-in zoom-in duration-300">
            <Sparkles className="w-2 h-2" /> AI
        </span>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Service Records</h1>
                    <p className="text-sm text-slate-500 font-medium">Audit and manage professional fleet maintenance history.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => { resetForm(); setIsModalOpen(true); }}
                        className="bg-slate-900 text-white px-8 py-4 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> Add Service Record
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset & Records</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Vendor</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Cost</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {records.map((wo) => (
                                <tr key={wo.id} className="hover:bg-slate-50/50 transition-all cursor-pointer group" onClick={() => navigate(`/app/service/${wo.id}`)}>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                <TruckIcon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900">{equipmentList.find(e => e.id === wo.equipmentId)?.unitNumber || 'Unit'}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{wo.woNumber}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 font-bold text-slate-700">{wo.vendor || 'Internal Service'}</td>
                                    <td className="px-8 py-6">
                                        <span className={`px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${getStatusBadgeClass(wo.status)}`}>
                                            {wo.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right font-mono font-black text-slate-900">${wo.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="p-2 text-slate-300 hover:text-blue-600 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-[3.5rem] w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col my-auto max-h-[95vh]">
                        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className="bg-slate-900 p-3 rounded-2xl shadow-lg">
                                    <ClipboardList className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Audit Service Record</h2>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">AI-assisted maintenance verification</p>
                                </div>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100"><X className="w-6 h-6" /></button>
                        </div>

                        <div className={`flex-1 overflow-hidden flex flex-col md:flex-row ${formData.media && formData.media.length > 0 ? '' : 'justify-center'}`}>
                            <form className={`flex-1 overflow-y-auto p-10 space-y-12 ${formData.media && formData.media.length > 0 ? 'md:w-1/2 border-r border-slate-100' : 'max-w-4xl mx-auto w-full'}`} onSubmit={handleAddSubmit}>
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                            <Sparkles className="w-6 h-6 text-blue-600" /> AI SCAN
                                        </h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Instant extraction of vendor, costs, and tasks</p>
                                    </div>

                                    <div
                                        onClick={() => receiptInputRef.current?.click()}
                                        className={`border-4 border-dashed rounded-[3rem] p-16 transition-all group flex flex-col items-center justify-center text-center cursor-pointer relative ${isParsingReceipt ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 bg-slate-50/30 hover:bg-blue-50/30 hover:border-blue-300'}`}
                                    >
                                        {isParsingReceipt ? (
                                            <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                                        ) : (
                                            <>
                                                <Upload className="w-12 h-12 text-slate-400 group-hover:text-blue-500 mb-4" />
                                                <p className="text-lg font-bold text-slate-700">Audit Invoice/Receipt</p>
                                            </>
                                        )}
                                        <input type="file" ref={receiptInputRef} className="hidden" accept="image/*,application/pdf" onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload(file);
                                        }} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <VehicleSelector
                                        selectedVehicleId={formData.equipmentId || ""}
                                        selectedVehicleType={(formData as any).vehicle_type || ""}
                                        equipment={equipmentList}
                                        onVehicleSelect={(vehicleId: string, vehicleType: string) => {
                                            console.log("Vehicle Selected:", vehicleId, vehicleType);
                                            setFormData(prev => ({
                                                ...prev,
                                                equipmentId: vehicleId,
                                                vehicle_type: vehicleType
                                            } as any));
                                            setAiPopulatedFields(prev => {
                                                const next = new Set(prev);
                                                next.delete('equipmentId');
                                                return next;
                                            });
                                        }}
                                    />
                                    <div className="space-y-1.5 flex flex-col justify-end">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                            Service Date * {aiPopulatedFields.has('date') && <AiBadge />}
                                        </label>
                                        <input type="date" required className="w-full px-5 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-bold text-slate-900 outline-none" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                    </div>

                                    <div className="space-y-1.5 flex flex-col justify-end">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                            Link Work Order (Optional)
                                        </label>
                                        <Select
                                            value={formData.workOrderId || "none"}
                                            onValueChange={(val) => setFormData(prev => ({ ...prev, workOrderId: val === "none" ? undefined : val }))}
                                            disabled={!formData.equipmentId}
                                        >
                                            <SelectTrigger className="w-full px-5 py-8 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-bold text-slate-900 outline-none ring-0 focus:ring-0">
                                                <SelectValue placeholder={formData.equipmentId ? "Select Work Order..." : "Select Asset First"} />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border border-slate-100 rounded-xl shadow-xl z-[99999]">
                                                <SelectItem value="none" className="font-medium text-slate-500">All / None</SelectItem>
                                                {availableWorkOrders
                                                    .filter(wo => wo.equipmentId === formData.equipmentId)
                                                    .map(wo => (
                                                        <SelectItem key={wo.id} value={wo.id} className="font-bold text-slate-700">
                                                            {wo.workOrderNumber || "WO"} - {wo.title}
                                                        </SelectItem>
                                                    ))
                                                }
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                        <Store className="w-4 h-4 text-blue-500" /> Professional Service Partner {aiPopulatedFields.has('vendor') && <AiBadge />}
                                    </h3>
                                    <div className="relative">
                                        <Search className={`absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 ${isSearchingSuggestions ? 'text-blue-500 animate-pulse' : 'text-slate-400'}`} />
                                        <input
                                            required
                                            type="text"
                                            placeholder="Search shop or address..."
                                            className={`w-full pl-16 pr-12 py-6 bg-white border ${isVerified ? 'border-emerald-500' : 'border-slate-200'} rounded-[2.5rem] font-black text-slate-900 outline-none shadow-sm`}
                                            value={formData.vendor}
                                            onChange={e => { setFormData({ ...formData, vendor: e.target.value }); setIsVerified(false); setSelectedVendorCard(null); }}
                                            onFocus={() => combinedSuggestions.length > 0 && setShowSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                        />
                                        {isVerified && <CheckCircle2 className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500" />}

                                        {showSuggestions && combinedSuggestions.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 z-[110] mt-2 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden">
                                                {combinedSuggestions.map((s, idx) => (
                                                    <button key={idx} type="button" onClick={() => handleSelectSmartSuggestion(s)} className="w-full text-left px-8 py-5 hover:bg-blue-50 border-b border-slate-50 last:border-0 flex items-center justify-between">
                                                        <div>
                                                            <div className="text-sm font-black text-slate-900">{s.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-bold">{s.address}</div>
                                                        </div>
                                                        <span className="text-[8px] font-black px-3 py-1 rounded-lg uppercase tracking-widest bg-blue-50 text-blue-600">{s.source}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Odometer Reading</label>
                                        <div className="relative group">
                                            <Gauge className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                            <input
                                                type="number"
                                                className="w-full pl-16 pr-16 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-bold text-slate-900 outline-none"
                                                value={formData.odometer || ''}
                                                onChange={e => setFormData({ ...formData, odometer: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Engine Run Hours</label>
                                        <div className="relative group">
                                            <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                            <input
                                                type="number"
                                                className="w-full pl-16 pr-16 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-bold text-slate-900 outline-none"
                                                value={formData.hours ? formData.hours.toString() : ''}
                                                onChange={e => setFormData({ ...formData, hours: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                            <ClipboardList className="w-4 h-4 text-blue-500" /> Line Items {aiPopulatedFields.has('items') && <AiBadge />}
                                        </h3>
                                        {formData.items && formData.items.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={syncTotalFromItems}
                                                className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                                            >
                                                Sync Total from Items
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        {formData.items?.map((item, idx) => (
                                            <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-[2rem] border border-slate-100 group">
                                                <div className="flex-1 w-full">
                                                    <input
                                                        className="bg-transparent font-bold text-slate-900 outline-none w-full px-2"
                                                        value={item.description}
                                                        placeholder="Description"
                                                        onChange={(e) => {
                                                            const newItems = [...(formData.items || [])];
                                                            newItems[idx] = { ...item, description: e.target.value };
                                                            setFormData({ ...formData, items: newItems });
                                                        }}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 flex-1 sm:flex-none">
                                                        <span className="text-slate-400 font-bold">$</span>
                                                        <input
                                                            type="number"
                                                            className="w-full sm:w-24 bg-transparent font-black text-slate-900 outline-none"
                                                            value={item.cost || 0}
                                                            onChange={(e) => {
                                                                const newItems = [...(formData.items || [])];
                                                                newItems[idx] = { ...item, cost: parseFloat(e.target.value) || 0 };
                                                                setFormData({ ...formData, items: newItems });
                                                            }}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newItems = formData.items?.filter((_, i) => i !== idx);
                                                            setFormData({ ...formData, items: newItems });
                                                        }}
                                                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}

                                        {!isAddingItem ? (
                                            <button
                                                type="button"
                                                onClick={() => setIsAddingItem(true)}
                                                className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest px-6 py-3 hover:bg-blue-50 rounded-xl transition-all"
                                            >
                                                <Plus className="w-3 h-3" /> Add Item
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-[2rem] border border-blue-100 animate-in slide-in-from-top-2">
                                                <input
                                                    autoFocus
                                                    placeholder="Describe service (e.g. Oil Change)..."
                                                    className="flex-1 bg-transparent font-bold text-slate-900 outline-none px-2"
                                                    value={newItemValue}
                                                    onChange={e => setNewItemValue(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCommitItem())}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleCommitItem}
                                                    className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest"
                                                >Add</button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setIsAddingItem(false); setNewItemValue(''); }}
                                                    className="text-slate-400"
                                                ><X className="w-4 h-4" /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl text-white">
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                                        <h3 className="text-3xl font-black tracking-tight">Financial Audit Total {aiPopulatedFields.has('totalCost') && <AiBadge />}</h3>
                                        <div className="relative">
                                            <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 text-blue-400" />
                                            <input
                                                type="number"
                                                className="pl-16 pr-8 py-8 bg-slate-800 border-2 border-blue-900 rounded-[2.5rem] text-5xl font-black text-blue-400 outline-none w-full md:w-[350px]"
                                                value={formData.totalCost || ''}
                                                onChange={e => setFormData({ ...formData, totalCost: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-5 pt-8 border-t border-slate-100 sticky bottom-0 bg-white">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-12 py-5 text-sm font-black text-slate-400 uppercase tracking-widest">Discard</button>
                                    <button type="submit" className="px-20 py-5 bg-blue-600 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl hover:bg-blue-700 active:scale-95 transition-all">Save Service Record</button>
                                </div>
                            </form>

                            {formData.media && formData.media.length > 0 && (
                                <div className="hidden md:flex flex-1 bg-slate-50 border-l border-slate-100 items-center justify-center p-8 overflow-hidden">
                                    <div className="w-full h-full bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden relative">
                                        {formData.media[formData.media.length - 1].type === 'image' ? (
                                            <img
                                                src={formData.media[formData.media.length - 1].url}
                                                alt="Invoice Preview"
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <iframe
                                                src={formData.media[formData.media.length - 1].url}
                                                className="w-full h-full border-0"
                                                title="PDF Preview"
                                            />
                                        )}
                                        <div className="absolute top-6 right-6 flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => removeMedia(formData.media!.length - 1)}
                                                className="bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg text-slate-400 hover:text-rose-500 transition-all border border-slate-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div >
            )}
        </div >
    );
};

export default ServiceHistoryManager;
