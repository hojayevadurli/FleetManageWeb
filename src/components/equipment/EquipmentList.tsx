import React, { useState, useMemo, useEffect } from 'react';
import { PageHeader } from "@/components/layout/Page";
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
    Map as MapIcon,
    Bus,
    User
} from 'lucide-react';
import { equipmentApi, EquipmentCreatePayload } from '@/lib/equipmentApi';
import { fleetCategoriesApi, FleetCategory } from '@/lib/fleetCategoriesApi';
import { equipmentTypesApi } from '@/lib/equipmentTypesApi';
import { tenantsApi } from '@/lib/tenantsApi';
import { Equipment, EquipmentOperationalStatus, WorkOrder, WorkOrderStatus, WorkOrderPriority, WorkOrderCostSource, EquipmentTypeDto } from '@/lib/types';
import { US_STATES } from '@/lib/fleetData';
import { decodeVin, validateVin } from '@/lib/nhtsaApi'; // Import VIN helpers

import { verifyVendorAddress, searchVendorSuggestions } from '@/lib/gemini';

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EquipmentFormModal from './EquipmentFormModal';
import WorkOrderDialog from "@/components/workorder/WorkOrderDialog";


interface EquipmentListProps {
    equipment: Equipment[];
    onSelect: (e: Equipment, openAi?: boolean) => void;
    onAddEquipment: (e: EquipmentCreatePayload) => Promise<{ status: number; message: string } | null>;
    onNewWorkOrder: (unitId: string) => void;
    onAddWorkOrder: (wo: Omit<WorkOrder, 'id'>, files?: File[]) => void;
    onBulkDelete?: (ids: string[]) => Promise<void>;
    initialStatusFilter?: 'ALL' | EquipmentOperationalStatus;
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
    const [typeFilter, setTypeFilter] = useState<'ALL' | number | string>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | EquipmentOperationalStatus>(initialStatusFilter);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [categories, setCategories] = useState<FleetCategory[]>([]);
    const [companyName, setCompanyName] = useState("Fleet Company");

    useEffect(() => {
        const fetchCategoriesAndTenant = async () => {
            try {
                const [cats, tenant] = await Promise.all([
                    fleetCategoriesApi.list(),
                    tenantsApi.getCurrent()
                ]);
                setCategories(cats);
                if (tenant?.name) {
                    setCompanyName(tenant.name);
                }
            } catch (err) {
                console.error("Failed to fetch initial data", err);
            }
        };
        fetchCategoriesAndTenant();
    }, []);

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
            setWoFormData((prev: any) => ({ ...prev, totalCost: total }));
        }
    }, [woFormData.partsCost, woFormData.laborCost, woFormData.totalCost]);

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
            ...data,
            unitNumber: data.unitNumber!,
            type: data.type || 'Asset',
            specificType: data.specificType || '',
            make: data.make || '',
            model: data.model || '',
            year: data.year || new Date().getFullYear(),
            status: data.status || EquipmentOperationalStatus.Active,
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

    const getStatusColor = (status: EquipmentOperationalStatus | string) => {
        // Handle both number (Enum) and string (Backend DTO) cases
        const statusStr = typeof status === 'string' ? status : EquipmentOperationalStatus[status];
        if (!statusStr) return 'bg-slate-100 text-slate-700 border-slate-200';

        if (status === EquipmentOperationalStatus.Active || statusStr === 'Active') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (status === EquipmentOperationalStatus.InShop || statusStr === 'InShop') return 'bg-amber-100 text-amber-700 border-amber-200';
        if (status === EquipmentOperationalStatus.OutOfService || statusStr === 'OutOfService') return 'bg-rose-100 text-rose-700 border-rose-200';
        if (status === EquipmentOperationalStatus.Sold || statusStr === 'Sold') return 'bg-slate-100 text-slate-700 border-slate-200';
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
                if (typeof typeFilter === 'number') {
                    matchesType = e.fleetCategoryId === typeFilter;
                } else {
                    // Filter fallback for legacy data if needed, but simplified
                    const t = (e.type || '').toLowerCase();
                    const filterStr = String(typeFilter).toLowerCase();
                    matchesType = t.includes(filterStr);
                }
            }

            const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [equipment, searchTerm, typeFilter, statusFilter]);



    return (
        <div className="space-y-6">
            <PageHeader
                title="Fleet Control Center"
                subtitle="Manage assets and service history"
            >
                <div className="flex gap-3">
                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-blue-600 text-white h-10 px-6 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all font-bold shadow-sm active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Add Equipment
                    </Button>
                </div>
            </PageHeader>

            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1 min-w-[320px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        type="text"
                        placeholder="Search by Unit #, VIN, or Make..."
                        className="w-full pl-10 h-10 bg-white border-slate-200 rounded-lg text-sm font-medium focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {/* Type Filters */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setTypeFilter('ALL')}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all h-8 ${typeFilter === 'ALL'
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm hover:bg-blue-700 hover:text-white"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                }`}
                        >
                            All Types
                        </Button>
                        {categories.map(cat => {
                            const displayName = cat.name === 'School Bus' ? 'Bus' : cat.name;
                            const isActive = typeFilter === cat.id;
                            return (
                                <Button
                                    key={cat.id}
                                    variant="ghost"
                                    onClick={() => setTypeFilter(cat.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all h-8 ${isActive
                                        ? "bg-blue-600 text-white border-blue-600 shadow-sm hover:bg-blue-700 hover:text-white"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                        }`}
                                >
                                    {displayName}
                                </Button>
                            );
                        })}
                    </div>

                    <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

                    {/* Status Filters */}
                    <div className="flex items-center gap-2">
                        {(['ALL', ...Object.values(EquipmentOperationalStatus).filter(v => typeof v === 'number')] as const).map(status => {
                            const isActive = statusFilter === status;

                            // Status Display Name logic
                            const label = status === 'ALL' ? 'All Status' : EquipmentOperationalStatus[status as number].replace(/([A-Z])/g, ' $1').trim();

                            return (
                                <Button
                                    key={status}
                                    variant="ghost"
                                    onClick={() => setStatusFilter(status as any)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all h-8 ${isActive
                                        ? "bg-blue-600 text-white border-blue-600 shadow-sm hover:bg-blue-700 hover:text-white"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                        }`}
                                >
                                    {label}
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
                                            <div className={`p-2.5 rounded-xl border border-slate-100 group-hover:bg-blue-50 transition-colors ${e.fleetCategoryId === 4 ? 'bg-amber-50' : 'bg-slate-50'}`}>
                                                {e.fleetCategoryId === 1 ? <TruckIcon className="w-5 h-5 text-slate-400 group-hover:text-blue-600" /> :
                                                    e.fleetCategoryId === 2 ? <Container className="w-5 h-5 text-slate-400 group-hover:text-blue-600" /> :
                                                        e.fleetCategoryId === 4 ? <Hammer className="w-5 h-5 text-amber-500 group-hover:text-amber-600" /> :
                                                            e.fleetCategoryId === 3 ? <Bus className="w-5 h-5 text-slate-400 group-hover:text-blue-600" /> :
                                                                <TruckIcon className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-xl text-slate-900 tracking-tight">{e.unitNumber}</h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">
                                                    {categories.find(c => c.id === e.fleetCategoryId)?.name === 'School Bus' ? 'Bus' :
                                                        categories.find(c => c.id === e.fleetCategoryId)?.name || 'Unknown'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase border tracking-widest flex items-center gap-1.5 ${getStatusColor(e.status)}`}>
                                            {(e.status === EquipmentOperationalStatus.OutOfService || String(e.status) === 'OutOfService') && <AlertCircle className="w-3 h-3" />}
                                            {(() => {
                                                const rawLabel = typeof e.status === 'string' ? e.status : EquipmentOperationalStatus[e.status];
                                                return rawLabel ? rawLabel.replace(/([A-Z])/g, ' $1').trim() : 'Unknown';
                                            })()}
                                        </span>
                                    </div>

                                    <div className="px-6 py-2 flex-1 space-y-4">
                                        <div>
                                            <p className="text-sm font-black text-slate-800 line-clamp-1">{e.year} {e.make} {e.model}</p>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                                <span className="font-mono">VIN: {e.vin.slice(-8)}</span>
                                            </div>
                                            {e.assignedOperatorName && (
                                                <div className="flex items-center gap-1.5 mt-2 p-1.5 bg-blue-50/50 rounded-lg w-fit border border-blue-100/50">
                                                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                        <User className="w-3 h-3" />
                                                    </div>
                                                    <div>
                                                        <span className="block text-[9px] text-blue-400 font-black uppercase tracking-widest leading-none">Driver</span>
                                                        <span className="block text-xs font-bold text-slate-700 leading-none mt-0.5">{e.assignedOperatorName}</span>
                                                    </div>
                                                </div>
                                            )}
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
                                            disabled={e.status === EquipmentOperationalStatus.OutOfService || e.status === EquipmentOperationalStatus.Sold}
                                            onClick={(evt) => {
                                                evt.stopPropagation();
                                                if (e.status !== EquipmentOperationalStatus.OutOfService && e.status !== EquipmentOperationalStatus.Sold) {
                                                    handleOpenWOModal(e);
                                                }
                                            }}
                                            className={`flex flex-col items-center gap-1 p-2 h-auto rounded-xl transition-all group/btn border border-transparent ${e.status === EquipmentOperationalStatus.OutOfService || e.status === EquipmentOperationalStatus.Sold
                                                ? 'opacity-40 cursor-not-allowed text-slate-300'
                                                : 'hover:bg-white hover:text-amber-600 text-slate-400 hover:border-amber-100 hover:shadow-sm'
                                                }`}
                                        >
                                            {(e.status === EquipmentOperationalStatus.OutOfService || String(e.status) === 'OutOfService' || e.status === EquipmentOperationalStatus.Sold || String(e.status) === 'Sold') ? (
                                                <Lock className="w-4 h-4" />
                                            ) : (
                                                <ClipboardList className="w-4 h-4" />
                                            )}
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

            <WorkOrderDialog
                open={createWoDialogState.open}
                onOpenChange={(isOpen) => setCreateWoDialogState(prev => ({ ...prev, open: isOpen }))}
                initialCompanyName={companyName}
                initialVehicleId={createWoDialogState.initialVehicleId}
                initialVehicleType={createWoDialogState.initialVehicleType}
                initialUnitNumber={createWoDialogState.initialUnitNumber}
                onAfterCreated={() => {
                    // refresh equipment list ? nothing needed unless status changes
                }}
            />
        </div>
    );
};

export default EquipmentList;
