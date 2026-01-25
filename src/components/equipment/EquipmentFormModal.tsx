import React, { useState, useEffect } from 'react';
import {
    X,
    Truck as TruckIcon,
    AlertCircle,
    Loader2,
    CheckCircle2,
    Sparkles,
    Zap,
    Lock,
    Pencil
} from 'lucide-react';
import { Equipment, EquipmentStatus, EquipmentOperationalStatus, FleetType } from '@/lib/types';
import { EquipmentCreatePayload } from '@/lib/equipmentApi';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FLEET_TYPES, getManufacturers, getSpecificTypes, US_STATES } from '@/lib/fleetData';
import { decodeVin, validateVin } from '@/lib/nhtsaApi';

interface EquipmentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<EquipmentCreatePayload>) => Promise<void>;
    mode: 'create' | 'edit';
    initialData?: Partial<EquipmentCreatePayload> & { id?: string; fleetType?: FleetType; specificType?: string; licenseState?: string };
}

const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({
    isOpen,
    onClose,
    onSave,
    mode,
    initialData
}) => {
    const [formData, setFormData] = useState<Partial<EquipmentCreatePayload> & { fleetType?: FleetType; specificType?: string; licenseState?: string; operationalStatus?: EquipmentOperationalStatus }>(() => {
        if (initialData) {
            return {
                unitNumber: initialData.unitNumber || '',
                type: initialData.type || 'Truck',
                fleetType: initialData.fleetType || 'TRUCK',
                specificType: initialData.specificType || '',
                make: initialData.make || '',
                model: initialData.model || '',
                year: initialData.year || new Date().getFullYear(),
                status: initialData.status || EquipmentStatus.ACTIVE,
                vin: initialData.vin || '',
                serialNumber: initialData.serialNumber || '',
                licensePlate: initialData.licensePlate || '',
                licenseState: initialData.licenseState || '',
                mileage: (initialData.mileage !== undefined && initialData.mileage !== null) ? initialData.mileage : 0,
                engineType: initialData.engineType || '',
                length: initialData.length || 53,
                weightCapacity: initialData.weightCapacity || 45000,
                fleetCategoryId: initialData.fleetCategoryId || undefined,
                initialOdometer: 0,
                initialHours: 0
            };
        }

        return {
            unitNumber: '',
            type: 'Truck',
            fleetType: 'TRUCK',
            specificType: '',
            make: '',
            model: '',
            year: new Date().getFullYear(),
            status: EquipmentStatus.ACTIVE,
            operationalStatus: EquipmentOperationalStatus.Active,
            vin: '',
            serialNumber: '',
            licensePlate: '',
            licenseState: '',
            lastServiceDate: undefined,
            mileage: 0,
            engineType: '',
            length: 53,
            weightCapacity: 45000,
            fleetCategoryId: undefined,
            initialOdometer: 0,
            initialHours: 0
        };
    });

    // Reset when mode changes effectively, or if initialData updates while open (though we remount usually)
    useEffect(() => {
        if (isOpen && initialData) {
            // Optional: If we want to support switching data without remounting. 
            // But for now lazy init covers the main case.
            // We can keep a simplified effect just in case props update.
            setFormData(prev => ({
                ...prev,
                ...initialData,
                unitNumber: initialData.unitNumber || prev.unitNumber // Ensure precedence
            }));
        }
    }, [initialData]); // Only re-run if DATA changes

    const [isDecoding, setIsDecoding] = useState(false);
    const [decodeError, setDecodeError] = useState<string | null>(null);
    const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleVinChange = async (val: string) => {
        const vin = val.toUpperCase();
        setFormData(prev => ({ ...prev, vin }));
        setDecodeError(null);

        if (val.length < 17) setAutoFilledFields([]);

        if (validateVin(vin)) {
            setIsDecoding(true);
            try {
                const decoded = await decodeVin(vin);
                if (decoded) {
                    setFormData(prev => ({
                        ...prev,
                        vin,
                        make: decoded.make || prev.make,
                        model: decoded.model || prev.model,
                        year: decoded.year || prev.year
                    }));

                    const newAutoFilled = [];
                    if (decoded.make) newAutoFilled.push('make');
                    if (decoded.model) newAutoFilled.push('model');
                    if (decoded.year) newAutoFilled.push('year');
                    setAutoFilledFields(newAutoFilled);
                } else {
                    setDecodeError("Could not decode VIN details. Please enter manually.");
                    setAutoFilledFields([]);
                }
            } catch (err) {
                setDecodeError("VIN service unavailable.");
            } finally {
                setIsDecoding(false);
            }
        }
    };

    const getStatusColor = (status: number) => {
        if (status === EquipmentOperationalStatus.Active) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (status === EquipmentOperationalStatus.InShop) return 'bg-amber-100 text-amber-700 border-amber-200';
        if (status === EquipmentOperationalStatus.OutOfService) return 'bg-rose-100 text-rose-700 border-rose-200';
        if (status === EquipmentOperationalStatus.Sold) return 'bg-slate-100 text-slate-700 border-slate-200';
        return 'bg-slate-100 text-slate-700 border-slate-200';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        setIsSubmitting(true);

        try {
            await onSave(formData);
            onClose();
        } catch (err: any) {
            console.error(err);
            setSubmitError(err.message || "Failed to save equipment");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-300">
                <div className="flex-none flex items-center justify-between px-10 py-8 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className={`${mode === 'create' ? 'bg-blue-600' : 'bg-amber-500'} p-2.5 rounded-2xl shadow-lg`}>
                            {mode === 'create' ? <TruckIcon className="w-6 h-6 text-white" /> : <Pencil className="w-6 h-6 text-white" />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{mode === 'create' ? 'Onboard Asset' : 'Edit Asset'}</h2>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                                {mode === 'create' ? 'Register new unit to fleet' : `Update details for ${formData.unitNumber}`}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-all"><X className="w-6 h-6" /></button>
                </div>
                <div className="overflow-y-auto flex-1">
                    <form className="p-10 space-y-6" onSubmit={handleSubmit}>
                        <style>{`
                            .auto-filled-field {
                                background: linear-gradient(to right, #F0F4FF 0%, transparent 100%);
                                border-left: 3px solid #6366F1;
                            }
                            .auto-filled-badge {
                                font-size: 9px;
                                color: #6366F1;
                                display: flex;
                                align-items: center;
                                gap: 3px;
                                margin-bottom: 2px;
                            }
                        `}</style>

                        {submitError && (
                            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2 duration-200">
                                <div className="bg-rose-100 p-2 rounded-full shrink-0">
                                    <AlertCircle className="w-5 h-5 text-rose-600" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-rose-700">Action Required</h4>
                                    <p className="text-sm font-medium text-rose-600/90 mt-0.5">{submitError}</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* 1. Unit Number */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Number</label>
                                <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="T-100" value={formData.unitNumber} onChange={e => setFormData({ ...formData, unitNumber: e.target.value })} />
                            </div>

                            {/* 2. VIN with Decoder */}
                            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                                <div className="space-y-2 relative">
                                    <div className="flex justify-between items-end px-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                            VIN (17 Characters)
                                        </label>
                                    </div>
                                    <div className="relative group">
                                        <input
                                            required
                                            type="text"
                                            className={`w-full px-5 py-4 bg-white border rounded-2xl text-sm font-mono font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none uppercase pr-12 transition-all shadow-sm group-hover:border-blue-300 ${decodeError ? 'border-rose-300 focus:ring-rose-200 bg-rose-50/30' : 'border-slate-200'} ${autoFilledFields.length > 0 ? 'border-emerald-500/50 bg-emerald-50/10' : ''}`}
                                            placeholder="ENTER 17-DIGIT VIN"
                                            value={formData.vin}
                                            maxLength={17}
                                            onChange={e => handleVinChange(e.target.value)}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                            {isDecoding && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
                                            {!isDecoding && autoFilledFields.length > 0 && <div className="bg-emerald-100 text-emerald-700 p-1 rounded-full"><CheckCircle2 className="w-4 h-4" /></div>}
                                            {!isDecoding && decodeError && <div className="bg-rose-100 text-rose-600 p-1 rounded-full"><AlertCircle className="w-4 h-4" /></div>}
                                        </div>
                                    </div>

                                    {autoFilledFields.length > 0 && (
                                        <div className="flex items-center gap-2 px-2 py-1">
                                            <Sparkles className="w-3 h-3 text-emerald-500" />
                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Vehicle Details Decoded</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 3. Fleet Classification */}
                            <div className="space-y-4 pt-2">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fleet Classification</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    {(Object.keys(FLEET_TYPES) as FleetType[]).map(type => (
                                        <div
                                            key={type}
                                            onClick={() => setFormData({ ...formData, fleetType: type, specificType: '', make: '' })}
                                            className={`cursor-pointer rounded-2xl border-2 p-4 text-center transition-all ${formData.fleetType === type ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 hover:border-slate-200'}`}
                                        >
                                            <div className="text-xs font-black text-slate-800">{FLEET_TYPES[type]}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 4. Specific Type & Make */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Specific Type <span className="text-red-500">*</span></Label>
                                    <Select
                                        value={formData.specificType}
                                        onValueChange={(val) => setFormData({ ...formData, specificType: val, type: val })}
                                    >
                                        <SelectTrigger className="w-full bg-slate-50 border-slate-200 py-4 h-auto text-sm font-bold">
                                            <SelectValue placeholder="Select Type" />
                                        </SelectTrigger>
                                        <SelectContent className="z-[200] max-h-[300px]">
                                            {formData.fleetType ? getSpecificTypes(formData.fleetType).map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            )) : (
                                                <SelectItem value="none" disabled>Select Fleet Type First</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    {autoFilledFields.includes('make') ? (
                                        <div className="auto-filled-badge"><Zap className="w-3 h-3" /> Auto-filled from VIN</div>
                                    ) : (
                                        <Label>Make</Label>
                                    )}
                                    <div className="relative">
                                        <Input
                                            list="make-suggestions"
                                            className={`w-full bg-slate-50 border-slate-200 py-4 h-auto text-sm font-bold transition-all ${autoFilledFields.includes('make') ? 'auto-filled-field' : ''}`}
                                            placeholder="Select or Type Make"
                                            value={formData.make}
                                            onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                                        />
                                        {autoFilledFields.includes('make') && <Lock className="w-3 h-3 text-indigo-400 absolute right-3 top-1/2 -translate-y-1/2 opacity-50" />}
                                        <datalist id="make-suggestions">
                                            {formData.fleetType && getManufacturers(formData.fleetType).map(m => (
                                                <option key={m} value={m} />
                                            ))}
                                        </datalist>

                                    </div>
                                </div>
                            </div>

                            {/* 5. Status, Model, Year */}
                            <div className="grid grid-cols-3 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</label>
                                    <select
                                        className={`w-full px-5 py-4 border rounded-2xl text-sm font-black outline-none appearance-none cursor-pointer transition-all ${getStatusColor(formData.operationalStatus || EquipmentOperationalStatus.Active)}`}
                                        value={formData.operationalStatus}
                                        onChange={e => setFormData({ ...formData, operationalStatus: Number(e.target.value) })}
                                    >
                                        {Object.keys(EquipmentOperationalStatus)
                                            .filter(k => isNaN(Number(k))) // Filter out numeric keys to get string names
                                            .map(key => {
                                                const val = EquipmentOperationalStatus[key as keyof typeof EquipmentOperationalStatus];
                                                return (
                                                    <option key={val} value={val} className="bg-white text-slate-900">
                                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                                    </option>
                                                );
                                            })}
                                    </select>
                                </div>

                                <div className="space-y-1.5 relative">
                                    {autoFilledFields.includes('model') ? (
                                        <div className="auto-filled-badge"><Zap className="w-3 h-3" /> Auto-filled</div>
                                    ) : (
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Model</label>
                                    )}
                                    <div className="relative">
                                        <input
                                            required
                                            type="text"
                                            className={`w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${autoFilledFields.includes('model') ? 'auto-filled-field' : ''}`}
                                            placeholder="Model"
                                            value={formData.model}
                                            onChange={e => setFormData({ ...formData, model: e.target.value })}
                                        />
                                        {autoFilledFields.includes('model') && <Lock className="w-3 h-3 text-indigo-400 absolute right-3 top-1/2 -translate-y-1/2 opacity-50" />}
                                    </div>
                                </div>

                                <div className="space-y-1.5 relative">
                                    {autoFilledFields.includes('year') ? (
                                        <div className="auto-filled-badge"><Zap className="w-3 h-3" /> Auto-filled</div>
                                    ) : (
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Model Year</label>
                                    )}
                                    <div className="relative">
                                        <input
                                            required
                                            type="number"
                                            className={`w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${autoFilledFields.includes('year') ? 'auto-filled-field' : ''}`}
                                            placeholder="Year"
                                            value={formData.year}
                                            onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                                        />
                                        {autoFilledFields.includes('year') && <Lock className="w-3 h-3 text-indigo-400 absolute right-3 top-1/2 -translate-y-1/2 opacity-50" />}
                                    </div>
                                </div>
                            </div>

                            {/* 6. License Details (Moved to Bottom) */}
                            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100/50">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">License Number (Optional)</label>
                                    <input
                                        type="text"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none uppercase placeholder:text-slate-300 transition-all"
                                        placeholder="ABC-1234"
                                        value={formData.licensePlate}
                                        onChange={e => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Issuing State (Optional)</label>
                                    <Select
                                        value={formData.licenseState}
                                        onValueChange={(val) => setFormData({ ...formData, licenseState: val })}
                                    >
                                        <SelectTrigger className="w-full bg-slate-50 border-slate-200 rounded-2xl px-5 py-4 h-auto text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none">
                                            <SelectValue placeholder="Select State" />
                                        </SelectTrigger>
                                        <SelectContent className="z-[200] max-h-[300px]">
                                            {US_STATES.map(state => (
                                                <SelectItem key={state.code} value={state.code}>
                                                    <span className="font-mono w-6 inline-block text-slate-400">{state.code}</span>
                                                    {state.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
                            <button type="button" onClick={onClose} className="px-8 py-4 text-sm font-black text-slate-400 hover:text-slate-800 transition-colors">Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="px-12 py-4 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </span>
                                ) : (
                                    mode === 'create' ? 'Onboard Asset' : 'Save Changes'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div >
    );
};

export default EquipmentFormModal;
