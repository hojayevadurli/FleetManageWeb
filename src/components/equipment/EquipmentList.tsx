import React, { useState, useMemo, useEffect } from 'react';
import {
    Search,
    Plus,
    Truck as TruckIcon,
    Container,
    AlertCircle,
    X,
    Sparkles,
    Layers,
    ChevronDown,
    ClipboardList,
    Loader2,
    MapPin,
    Map as MapIcon,
    ChevronRight,
    Trash2
} from 'lucide-react';
import { Equipment, EquipmentStatus, EquipmentType, WorkOrder, WorkOrderStatus } from '@/lib/types';
import { verifyVendorAddress, searchVendorSuggestions } from '@/lib/gemini';
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EquipmentListProps {
    equipment: Equipment[];
    onSelect: (e: Equipment, openAi?: boolean) => void;
    onAddEquipment: (e: Omit<Equipment, 'id'>) => void;
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
    const [typeFilter, setTypeFilter] = useState<'ALL' | EquipmentType>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | EquipmentStatus>(initialStatusFilter);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Bulk Selection
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // New Work Order Modal State
    const [isWOModalOpen, setIsWOModalOpen] = useState(false);
    const [woFormData, setWoFormData] = useState<Partial<WorkOrder>>({
        woNumber: '',
        status: WorkOrderStatus.OPEN,
        date: new Date().toISOString().split('T')[0],
        totalCost: 0,
        partsCost: 0,
        laborCost: 0,
        description: '',
        vendor: '',
        vendorAddress: '',
        technician: '',
        equipmentId: ''
    });
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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
        setWoFormData({
            woNumber: `WO-${Math.floor(Math.random() * 10000)}`,
            status: WorkOrderStatus.OPEN,
            date: new Date().toISOString().split('T')[0],
            totalCost: 0,
            partsCost: 0,
            laborCost: 0,
            description: '',
            vendor: '',
            vendorAddress: '',
            technician: '',
            equipmentId: equip.id
        });
        setIsVerified(false);
        setMapsLink(null);
        setSelectedFiles([]);
        setIsWOModalOpen(true);
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

    const handleWOSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddWorkOrder(woFormData as any, selectedFiles);
        setIsWOModalOpen(false);
        setSelectedFiles([]);
    };

    const [newEquip, setNewEquip] = useState<Partial<Equipment>>({
        unitNumber: '',
        type: EquipmentType.TRUCK,
        make: '',
        model: '',
        year: new Date().getFullYear(),
        status: EquipmentStatus.ACTIVE,
        vin: '',
        licensePlate: '',
        lastServiceDate: new Date().toISOString().split('T')[0],
        mileage: 0,
        engineType: '',
        trailerType: 'Dry Van',
        length: 53,
        weightCapacity: 45000
    });

    const getStatusColor = (status: string) => {
        const s = status?.toLowerCase();
        if (s === 'active') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (s === 'in shop' || s === 'in_shop') return 'bg-amber-100 text-amber-700 border-amber-200';
        if (s === 'out of service' || s === 'out_of_service' || s === 'oos') return 'bg-rose-100 text-rose-700 border-rose-200';
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    const filteredEquipment = useMemo(() => {
        return equipment.filter(e => {
            const matchesSearch = (
                e.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.model.toLowerCase().includes(searchTerm.toLowerCase())
            );
            const matchesType = typeFilter === 'ALL' || e.type === typeFilter;
            const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [equipment, searchTerm, typeFilter, statusFilter]);

    // Bulk Handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) setSelectedIds(filteredEquipment.map(e => e.id));
        else setSelectedIds([]);
    };

    const handleToggleOne = (id: string, checked: boolean) => {
        setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
    };

    const handleBulkDeleteConfirm = async () => {
        if (onBulkDelete) {
            setIsBulkDeleting(true);
            await onBulkDelete(selectedIds);
            setIsBulkDeleting(false);
            setSelectedIds([]);
        }
    };

    const handleAddSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddEquipment(newEquip as any);
        setIsAddModalOpen(false);
        setNewEquip({
            unitNumber: '',
            type: EquipmentType.TRUCK,
            make: '',
            model: '',
            year: new Date().getFullYear(),
            status: EquipmentStatus.ACTIVE,
            vin: '',
            licensePlate: '',
            lastServiceDate: new Date().toISOString().split('T')[0],
            mileage: 0,
            engineType: '',
            trailerType: 'Dry Van',
            length: 53,
            weightCapacity: 45000
        });
        setShowAdvanced(false);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div className="flex-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Fleet Control Center</h1>
                        <p className="text-slate-500 font-medium">Manage assets and service history.</p>
                    </div>
                    <div className="flex gap-3">
                        {selectedIds.length > 0 && onBulkDelete && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button className="bg-rose-50 text-rose-600 px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-100 transition-all font-black border border-rose-100">
                                        <Trash2 className="w-5 h-5" /> Delete {selectedIds.length} Selected
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete {selectedIds.length} Assets?</AlertDialogTitle>
                                        <AlertDialogDescription>This action cannot be undone. Historical work orders will be preserved but the units will be removed from active fleet.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleBulkDeleteConfirm} disabled={isBulkDeleting} className="bg-rose-600 hover:bg-rose-700">
                                            {isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Delete'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-blue-600 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all font-black shadow-xl shadow-blue-500/20 active:scale-95 shrink-0"
                        >
                            <Plus className="w-5 h-5" /> Onboard Equipment
                        </button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-center gap-2 px-2">
                        <Checkbox
                            checked={filteredEquipment.length > 0 && selectedIds.length === filteredEquipment.length}
                            onCheckedChange={(c) => handleSelectAll(c === true)}
                            className="data-[state=checked]:bg-blue-600 border-slate-300 w-5 h-5 rounded-md"
                        />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select All</span>
                    </div>

                    <div className="relative flex-1 min-w-[320px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by Unit #, VIN, or Make..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white transition-all shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1">
                            {(['ALL', EquipmentType.TRUCK, EquipmentType.TRAILER] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${typeFilter === type ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    {type === 'ALL' ? 'All' : type + 's'}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1">
                            {(['ALL', ...Object.values(EquipmentStatus)] as const).map(status => {
                                let activeClass = 'bg-blue-600 text-white shadow-md';
                                if (status === EquipmentStatus.ACTIVE) activeClass = 'bg-emerald-600 text-white shadow-md';
                                if (status === EquipmentStatus.IN_SHOP) activeClass = 'bg-amber-500 text-white shadow-md';
                                if (status === EquipmentStatus.OUT_OF_SERVICE) activeClass = 'bg-rose-600 text-white shadow-md';
                                if (status === 'ALL') activeClass = 'bg-slate-900 text-white shadow-md';

                                return (
                                    <button
                                        key={status}
                                        onClick={() => setStatusFilter(status)}
                                        className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${statusFilter === status ? activeClass : 'text-slate-500 hover:text-slate-800'}`}
                                    >
                                        {status === 'ALL' ? 'All Status' : status}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {filteredEquipment.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredEquipment.map((e) => {
                        const isSelected = selectedIds.includes(e.id);
                        return (
                            <div
                                key={e.id}
                                className={`group relative bg-white rounded-[2rem] border transition-all cursor-pointer flex flex-col overflow-hidden ${isSelected ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-xl' : 'border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-300'}`}
                                onClick={() => onSelect(e)}
                            >
                                <div className="absolute top-4 right-4 z-10" onClick={(evt) => evt.stopPropagation()}>
                                    <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(c) => handleToggleOne(e.id, c === true)}
                                        className="data-[state=checked]:bg-blue-600 border-slate-300 w-5 h-5 rounded-md bg-white/80 shadow-sm"
                                    />
                                </div>

                                <div className="p-6 pb-2 flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 group-hover:bg-blue-50 transition-colors">
                                            {e.type === EquipmentType.TRUCK ? <TruckIcon className="w-5 h-5 text-slate-400 group-hover:text-blue-600" /> : <Container className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />}
                                        </div>
                                        <h3 className="font-black text-xl text-slate-900 tracking-tight">{e.unitNumber}</h3>
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
                                            <span className="text-slate-600">{e.lastServiceDate}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto p-3 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2">
                                    <button
                                        onClick={(evt) => { evt.stopPropagation(); handleOpenWOModal(e); }}
                                        className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white hover:text-amber-600 text-slate-400 transition-all group/btn border border-transparent hover:border-amber-100"
                                    >
                                        <ClipboardList className="w-4 h-4" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">New WO</span>
                                    </button>
                                    <button
                                        onClick={(evt) => { evt.stopPropagation(); onSelect(e, true); }}
                                        className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white hover:text-blue-600 text-slate-400 transition-all group/btn border border-transparent hover:border-blue-100"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">AI Audit</span>
                                    </button>
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
            )}

            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg">
                                    <TruckIcon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Onboard Asset</h2>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Register new unit to fleet</p>
                                </div>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-all"><X className="w-6 h-6" /></button>
                        </div>

                        <form className="p-10 space-y-6" onSubmit={handleAddSubmit}>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Number</label>
                                    <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="T-100" value={newEquip.unitNumber} onChange={e => setNewEquip({ ...newEquip, unitNumber: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">VIN (17 Digits)</label>
                                    <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Required" value={newEquip.vin} onChange={e => setNewEquip({ ...newEquip, vin: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Type</label>
                                    <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" value={newEquip.type} onChange={e => setNewEquip({ ...newEquip, type: e.target.value as EquipmentType })}>
                                        <option value={EquipmentType.TRUCK}>Truck</option>
                                        <option value={EquipmentType.TRAILER}>Trailer</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</label>
                                    <select
                                        className={`w-full px-5 py-4 border rounded-2xl text-sm font-black outline-none appearance-none cursor-pointer transition-all ${getStatusColor(newEquip.status as EquipmentStatus || EquipmentStatus.ACTIVE)}`}
                                        value={newEquip.status}
                                        onChange={e => setNewEquip({ ...newEquip, status: e.target.value as EquipmentStatus })}
                                    >
                                        {Object.values(EquipmentStatus).map(s => (
                                            <option key={s} value={s} className="bg-white text-slate-900">
                                                {s.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Make</label>
                                    <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Freightliner" value={newEquip.make} onChange={e => setNewEquip({ ...newEquip, make: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Model</label>
                                    <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Cascadia" value={newEquip.model} onChange={e => setNewEquip({ ...newEquip, model: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Model Year</label>
                                    <input required type="number" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="2025" value={newEquip.year} onChange={e => setNewEquip({ ...newEquip, year: parseInt(e.target.value) || new Date().getFullYear() })} />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100/50 mt-6">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Type Specific Specifications</h3>
                                <div className="grid grid-cols-2 gap-6">
                                    {newEquip.type === EquipmentType.TRUCK ? (
                                        <>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">License Plate</label>
                                                <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="ABC-1234" value={newEquip.licensePlate} onChange={e => setNewEquip({ ...newEquip, licensePlate: e.target.value })} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Engine Type</label>
                                                <input type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Cummins X15" value={newEquip.engineType} onChange={e => setNewEquip({ ...newEquip, engineType: e.target.value })} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Mileage</label>
                                                <input type="number" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" value={newEquip.mileage} onChange={e => setNewEquip({ ...newEquip, mileage: parseInt(e.target.value) || 0 })} />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trailer Category</label>
                                                <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" value={newEquip.trailerType} onChange={e => setNewEquip({ ...newEquip, trailerType: e.target.value })}>
                                                    <option value="Dry Van">Dry Van</option>
                                                    <option value="Reefer">Reefer</option>
                                                    <option value="Flatbed">Flatbed</option>
                                                    <option value="Step Deck">Step Deck</option>
                                                    <option value="Tanker">Tanker</option>
                                                    <option value="Chassis">Chassis</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Length (ft)</label>
                                                <input type="number" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="53" value={newEquip.length} onChange={e => setNewEquip({ ...newEquip, length: parseInt(e.target.value) || 0 })} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacity (lbs)</label>
                                                <input type="number" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="45000" value={newEquip.weightCapacity} onChange={e => setNewEquip({ ...newEquip, weightCapacity: parseInt(e.target.value) || 0 })} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-8 py-4 text-sm font-black text-slate-400 hover:text-slate-800 transition-colors">Cancel</button>
                                <button type="submit" className="px-12 py-4 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95">Onboard Asset</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isWOModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-500 p-2.5 rounded-2xl shadow-lg">
                                    <ClipboardList className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">New Maintenance Record</h2>
                                    <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mt-0.5">Quick creation for {equipment.find(e => e.id === woFormData.equipmentId)?.unitNumber}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsWOModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-all"><X className="w-6 h-6" /></button>
                        </div>

                        <form className="p-10 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar" onSubmit={handleWOSubmit}>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Number</label>
                                    <input readOnly type="text" className="w-full px-5 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-black text-slate-500 cursor-not-allowed outline-none" value={equipment.find(e => e.id === woFormData.equipmentId)?.unitNumber || ''} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Date</label>
                                    <input type="date" required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" value={woFormData.date} onChange={e => setWoFormData({ ...woFormData, date: e.target.value })} />
                                </div>
                                <div className="space-y-1.5 relative">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner Vendor</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            required
                                            autoComplete="off"
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="Search Shop Name..."
                                            value={woFormData.vendor}
                                            onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                            onChange={e => {
                                                setWoFormData({ ...woFormData, vendor: e.target.value });
                                                setIsVerified(false);
                                            }}
                                        />
                                        {isSearchingSuggestions && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                            </div>
                                        )}
                                    </div>
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 z-[120] mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            <div className="max-h-60 overflow-y-auto">
                                                {suggestions.map((s, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => handleSelectSuggestion(s)}
                                                        className="w-full text-left px-5 py-4 hover:bg-blue-50 border-b border-slate-50 last:border-0 transition-all flex items-start gap-3 group"
                                                    >
                                                        <MapPin className="w-4 h-4 text-slate-300 mt-0.5 group-hover:text-blue-500" />
                                                        <div className="flex-1">
                                                            <div className="text-xs font-black text-slate-800 group-hover:text-blue-700">{s.title}</div>
                                                        </div>
                                                        <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-blue-400 self-center" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1.5 relative">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</label>
                                        {mapsLink && <a href={mapsLink} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 font-black flex items-center gap-1 hover:underline"><MapIcon className="w-3 h-3" /> View</a>}
                                    </div>
                                    <input type="text" className={`w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${isVerified ? 'border-emerald-200' : ''}`} placeholder="Address" value={woFormData.vendorAddress} onChange={e => { setWoFormData({ ...woFormData, vendorAddress: e.target.value }); setIsVerified(false); }} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Technician</label>
                                <input type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Assigned Tech Name" value={woFormData.technician} onChange={e => setWoFormData({ ...woFormData, technician: e.target.value })} />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Description</label>
                                <textarea required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] transition-all" placeholder="Details of the service performed..." value={woFormData.description} onChange={e => setWoFormData({ ...woFormData, description: e.target.value })} />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attachments (Images/PDF)</label>
                                <div className="p-8 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50 hover:bg-white hover:border-blue-400 transition-all group flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden">
                                    <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                        <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                                    </div>
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                        {selectedFiles.length > 0 ? `${selectedFiles.length} files selected` : 'Click or drag files to upload'}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Receipts, photos of damage, etc.</p>

                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,application/pdf"
                                        className="absolute inset-0 opacity-0 cursor-pointer z-[20]"
                                        onChange={(e) => {
                                            if (e.target.files) {
                                                setSelectedFiles(Array.from(e.target.files));
                                            }
                                        }}
                                    />
                                </div>
                                {selectedFiles.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {selectedFiles.map((f, i) => (
                                            <div key={i} className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl text-[10px] font-black text-blue-600 flex items-center gap-2">
                                                <span className="truncate max-w-[120px]">{f.name}</span>
                                                <X className="w-3 h-3 cursor-pointer hover:text-blue-800" onClick={(e) => { e.stopPropagation(); setSelectedFiles(prev => prev.filter((_, idx) => idx !== i)); }} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-6 p-8 bg-slate-900 rounded-[2.5rem] shadow-xl">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parts Cost</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">$</span>
                                        <input type="number" step="0.01" className="w-full pl-8 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-mono text-white font-black focus:ring-2 focus:ring-blue-500 outline-none" value={woFormData.partsCost} onChange={e => setWoFormData({ ...woFormData, partsCost: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Labor Cost</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">$</span>
                                        <input type="number" step="0.01" className="w-full pl-8 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-mono text-white font-black focus:ring-2 focus:ring-blue-500 outline-none" value={woFormData.laborCost} onChange={e => setWoFormData({ ...woFormData, laborCost: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Total Cost</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500/50 font-black text-sm">$</span>
                                        <input type="number" step="0.01" className="w-full pl-8 pr-4 py-4 bg-slate-800 border border-amber-900/30 rounded-2xl text-sm font-mono font-black text-amber-500 focus:ring-2 focus:ring-blue-500 outline-none" value={woFormData.totalCost} onChange={e => setWoFormData({ ...woFormData, totalCost: parseFloat(e.target.value) || 0 })} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
                                <button type="button" onClick={() => setIsWOModalOpen(false)} className="px-8 py-4 text-sm font-black text-slate-400 hover:text-slate-800 transition-colors">Discard</button>
                                <button type="submit" className="px-12 py-4 text-sm font-black text-white bg-amber-500 hover:bg-amber-600 rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-95">Create Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquipmentList;
