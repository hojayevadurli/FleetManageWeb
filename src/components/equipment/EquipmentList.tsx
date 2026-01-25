import React, { useState, useMemo, useEffect } from 'react';
import {
    CheckCircle2,
    Calendar,
    ArrowUpRight,
    MapPin,
    AlertCircle,
    ClipboardList,
    Sparkles,
    Layers,
    ChevronRight,
    Loader2,
    Plus,
    Search,
    Truck as TruckIcon,
    Container,
    X,
    ChevronDown,
    Hammer,
    Lock,
    Zap,
    Map as MapIcon
} from 'lucide-react';
import { equipmentApi, EquipmentCreatePayload } from '@/lib/equipmentApi';
import { fleetCategoriesApi, FleetCategory } from '@/lib/fleetCategoriesApi';
import { equipmentTypesApi } from '@/lib/equipmentTypesApi';
import { tenantsApi } from '@/lib/tenantsApi';
import { Equipment, EquipmentStatus, WorkOrder, WorkOrderStatus, WorkOrderPriority, WorkOrderCostSource, EquipmentTypeDto, FleetType } from '@/lib/types';
import { FLEET_TYPES, getSpecificTypes, getManufacturers, TRUCK_TYPES, TRAILER_TYPES, HEAVY_EQUIPMENT_TYPES, US_STATES } from '@/lib/fleetData';
import { decodeVin, validateVin } from '@/lib/nhtsaApi'; // Import VIN helpers

import { verifyVendorAddress, searchVendorSuggestions } from '@/lib/gemini';

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EquipmentFormModal from './EquipmentFormModal';
import CreateWorkOrderDialog from "@/components/workorder/CreateWorkOrderDialog";


interface EquipmentListProps {
    equipment: Equipment[];
    onSelect: (e: Equipment, openAi?: boolean) => void;
    onAddEquipment: (e: Omit<Equipment, 'id'>) => Promise<{ status: number; message: string } | null>;
    onNewWorkOrder: (unitId: string) => void;
    onAddWorkOrder: (wo: Omit<WorkOrder, 'id'>, files?: File[]) => void;
    onBulkDelete?: (ids: string[]) => Promise<void>;
    initialStatusFilter?: 'ALL' | EquipmentStatus;
}

const EquipmentList: React.FC<EquipmentListProps> = ({
    equipment,
    onSelect,
    onAddEquipment,
    onNewWorkOrder,
    onAddWorkOrder,
    onBulkDelete,
    initialStatusFilter = 'ALL'
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'ALL' | FleetType>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | EquipmentStatus>(initialStatusFilter);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Filter Logic

    // Simplified state for the global dialog
    const [createWoDialogState, setCreateWoDialogState] = useState<{
        open: boolean;
        initialVehicleId?: string;
        initialVehicleType?: string;
        initialUnitNumber?: string;
    }>({ open: false });

    // Suggestion State (Legacy kept if used elsewhere, otherwise could be cleaned up)
    // Removed legacy woFormData and local modal state logic
    const [woFormData, setWoFormData] = useState<any>({}); // kept as empty object to minimize diff if referenced elsewhere 

    // Suggestion State
    const [isVerifyingAddress, setIsVerifyingAddress] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [mapsLink, setMapsLink] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<{ title: string, uri: string }[]>([]);
    const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const total = (woFormData.partsCost || 0) + (woFormData.laborCost || 0);
        if (total !== woFormData.totalCost) {
            setWoFormData(prev => ({ ...prev, totalCost: total }));
        }
    }, [woFormData.partsCost, woFormData.laborCost]);

    useEffect(() => {
        const input = woFormData.vendor;
        if (!input || input.length < 3 || isVerified) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearchingSuggestions(true);
            try {
                let latLng;
                const pos: any = await new Promise((resolve) => {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 5000 });
                    } else {
                        resolve(null);
                    }
                });
                if (pos) latLng = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };

                const results = await searchVendorSuggestions(input, latLng);
                setSuggestions(results);
                setShowSuggestions(results.length > 0);
            } catch (err: any) {
                // Silently fail if quota exceeded to avoid console clutter for user
                if (err?.message?.includes('429')) return;
                console.error("Suggestion error:", err);
            } finally {
                setIsSearchingSuggestions(false);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [woFormData.vendor, isVerified]);

    const handleOpenWOModal = (equip: Equipment) => {
        setCreateWoDialogState({
            open: true,
            initialVehicleId: equip.id,
            initialVehicleType: equip.type?.toLowerCase() || 'truck', // fallback
            initialUnitNumber: equip.unitNumber
        });
    };

    const handleSelectSuggestion = (suggestion: { title: string; uri: string }) => {
        setWoFormData(prev => ({
            ...prev,
            vendor: suggestion.title.split(',')[0],
            vendorAddress: suggestion.title
        }));
        setMapsLink(suggestion.uri);
        setIsVerified(true);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    // Legacy handles removed - using global dialog now

    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddSubmit = async (data: Partial<EquipmentCreatePayload>) => {
        // Pass to parent
        // Just minimal transform if needed, but EquipmentFormModal returns correct shape
        const payload = {
            unitNumber: data.unitNumber!,
            type: data.type || 'Truck',
            fleetType: data.fleetType || 'TRUCK',
            specificType: data.specificType || '',
            make: data.make || '',
            model: data.model || '',
            year: data.year || new Date().getFullYear(),
            status: data.status || EquipmentStatus.ACTIVE,
            vin: data.vin || '',
            serialNumber: data.serialNumber || '',
            licensePlate: data.licensePlate || '',

            lastServiceDate: undefined,
            mileage: Number(data.mileage) || 0,
            engineType: data.engineType || '',
            length: Number(data.length) || 53,
            weightCapacity: Number(data.weightCapacity) || 45000,
            fleetCategoryId: data.fleetCategoryId,
            initialOdometer: Number(data.initialOdometer) || 0,
            initialHours: Number(data.initialHours) || 0
        };

        await onAddEquipment(payload as any);
        setIsAddModalOpen(false);
    };

    const getStatusColor = (status: string) => {
        const s = status?.toLowerCase();
        if (s === EquipmentStatus.ACTIVE) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (s === EquipmentStatus.IN_SHOP) return 'bg-amber-100 text-amber-700 border-amber-200';
        if (s === EquipmentStatus.OUT_OF_SERVICE) return 'bg-rose-100 text-rose-700 border-rose-200';
        if (s === EquipmentStatus.SOLD) return 'bg-slate-100 text-slate-700 border-slate-200';
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    const filteredEquipment = useMemo(() => {
        return equipment.filter(e => {
            const matchesSearch = (
                e.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (e.vin && e.vin.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (e.make && e.make.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (e.model && e.model.toLowerCase().includes(searchTerm.toLowerCase()))
            );

            let matchesType = true;
            if (typeFilter !== 'ALL') {
                if (e.fleetType) {
                    matchesType = e.fleetType === typeFilter;
                } else {
                    // Fallback for legacy data
                    const t = e.type.toLowerCase();
                    if (typeFilter === 'TRUCK') matchesType = t.includes('truck') || t.includes('tractor') || t.includes('van');
                    else if (typeFilter === 'TRAILER') matchesType = t.includes('trailer') || t.includes('chassis') || t.includes('dolly');
                    else if (typeFilter === 'HEAVY_EQUIPMENT') matchesType = t.includes('dozer') || t.includes('crane') || t.includes('excavator') || t.includes('lift');
                }
            }

            const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [equipment, searchTerm, typeFilter, statusFilter]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div className="flex-1">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Fleet Control Center</h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Manage assets and service history</p>
                    </div>
                    <div className="flex gap-3">

                        <div className="flex gap-3">
                            <Button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-blue-600 text-white px-6 py-6 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all font-black shadow-xl shadow-blue-500/20 active:scale-95 shrink-0 h-auto"
                            >
                                <Plus className="w-5 h-5" /> Add Equipment
                            </Button>
                        </div>
                    </div>
                </div >

                <div className="flex flex-col lg:flex-row lg:items-center gap-4">


                    <div className="relative flex-1 min-w-[320px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            type="text"
                            placeholder="Search by Unit #, VIN, or Make..."
                            className="w-full pl-11 pr-4 py-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:bg-white transition-all shadow-inner h-auto"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1">
                            <Button
                                variant={typeFilter === 'ALL' ? 'default' : 'ghost'}
                                onClick={() => setTypeFilter('ALL')}
                                className={`px-4 py-1.5 h-auto text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${typeFilter === 'ALL' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-transparent'}`}
                            >
                                All
                            </Button>
                            {(Object.keys(FLEET_TYPES) as FleetType[]).map(type => (
                                <Button
                                    key={type}
                                    variant={typeFilter === type ? 'default' : 'ghost'}
                                    onClick={() => setTypeFilter(type)}
                                    className={`px-4 py-1.5 h-auto text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${typeFilter === type ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-transparent'
                                        }`}
                                >
                                    {FLEET_TYPES[type]}
                                </Button>
                            ))}
                        </div>

                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1">
                            {((['ALL', ...Object.values(EquipmentStatus)] as const).filter(s => s !== EquipmentStatus.ARCHIVED) as ('ALL' | EquipmentStatus)[]).map(status => {
                                let activeClass = 'bg-blue-600 text-white shadow-md';
                                if (status === EquipmentStatus.ACTIVE) activeClass = 'bg-emerald-600 text-white shadow-md';
                                if (status === EquipmentStatus.IN_SHOP) activeClass = 'bg-amber-500 text-white shadow-md';
                                if (status === EquipmentStatus.OUT_OF_SERVICE) activeClass = 'bg-rose-600 text-white shadow-md';
                                if (status === 'ALL') activeClass = 'bg-slate-900 text-white shadow-md';

                                return (
                                    <Button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-4 py-1.5 h-auto text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${statusFilter === status ? activeClass : 'text-slate-500 hover:text-slate-800 bg-transparent hover:bg-transparent'}`}
                                    >
                                        {status === 'ALL' ? 'All Status' : status}
                                    </Button>
                                );
                            })}
                        </div>


                    </div>
                </div>


                {
                    filteredEquipment.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredEquipment.map((e) => {
                                return (
                                    <div
                                        key={e.id}
                                        className="group relative bg-white rounded-[2rem] border transition-all cursor-pointer flex flex-col overflow-hidden border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300"
                                        onClick={() => onSelect(e)}
                                    >

                                        <div className="p-6 pb-2 flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2.5 rounded-xl border border-slate-100 group-hover:bg-blue-50 transition-colors ${e.fleetType === 'HEAVY_EQUIPMENT' ? 'bg-amber-50' : 'bg-slate-50'}`}>
                                                    {e.fleetType === 'TRUCK' ? <TruckIcon className="w-5 h-5 text-slate-400 group-hover:text-blue-600" /> :
                                                        e.fleetType === 'TRAILER' ? <Container className="w-5 h-5 text-slate-400 group-hover:text-blue-600" /> :
                                                            e.fleetType === 'HEAVY_EQUIPMENT' ? <Hammer className="w-5 h-5 text-amber-500 group-hover:text-amber-600" /> :
                                                                <TruckIcon className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-xl text-slate-900 tracking-tight">{e.unitNumber}</h3>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                                                        {e.fleetType ? FLEET_TYPES[e.fleetType] : 'Unknown'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border tracking-widest flex items-center gap-1.5 ${getStatusColor(e.status)}`}>
                                                {e.status === EquipmentStatus.OUT_OF_SERVICE && <AlertCircle className="w-3 h-3" />}
                                                {e.status}
                                            </span>
                                        </div>

                                        <div className="px-6 py-2 flex-1 space-y-4">
                                            <div>
                                                <p className="text-sm font-black text-slate-800 line-clamp-1">{e.year} {e.make} {e.model}</p>
                                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                                    <span className="font-mono">VIN: {e.vin.slice(-8)}</span>
                                                </div>
                                            </div>

                                            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                                    <span>Last Service</span>
                                                    <span className="text-slate-600">{e.lastServiceDate?.split('T')[0] || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-auto p-3 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={(evt) => { evt.stopPropagation(); handleOpenWOModal(e); }}
                                                className="flex flex-col items-center gap-1 p-2 h-auto rounded-xl hover:bg-white hover:text-amber-600 text-slate-400 transition-all group/btn border border-transparent hover:border-amber-100 hover:shadow-sm"
                                            >
                                                <ClipboardList className="w-4 h-4" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">New WO</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={(evt) => { evt.stopPropagation(); onSelect(e, true); }}
                                                className="flex flex-col items-center gap-1 p-2 h-auto rounded-xl hover:bg-white hover:text-blue-600 text-slate-400 transition-all group/btn border border-transparent hover:border-blue-100 hover:shadow-sm"
                                            >
                                                <Sparkles className="w-4 h-4" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">AI Audit</span>
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white p-20 rounded-[3rem] border border-slate-200 shadow-sm text-center">
                            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <Layers className="w-12 h-12 text-slate-200" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">No assets found</h3>
                            <p className="text-slate-500 font-medium">Try adjusting your filters or search query.</p>
                        </div>
                    )
                }

                < EquipmentFormModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSave={handleAddSubmit}
                    mode="create"
                />

                <CreateWorkOrderDialog
                    open={createWoDialogState.open}
                    onOpenChange={(isOpen) => setCreateWoDialogState(prev => ({ ...prev, open: isOpen }))}
                    initialCompanyName="Fleet Company"
                    initialVehicleId={createWoDialogState.initialVehicleId}
                    initialVehicleType={createWoDialogState.initialVehicleType}
                    initialUnitNumber={createWoDialogState.initialUnitNumber}
                    onAfterCreated={() => {
                        // refresh equipment list ? nothing needed unless status changes
                    }}
                />
            </div >
        </div>
    );
};

export default EquipmentList;
