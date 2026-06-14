import React, { useState, useRef, useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
    Container,
    Bot,
    Send,
    History,
    Cpu,
    Wrench,
    ShieldCheck,
    ChevronRight,
    X,
    Loader2,
    ExternalLink,
    MapPin,
    Sparkles,
    FileText,
    FileCheck,
    Pencil,
    Trash2,
    Plus,
    Lock,
    User,
    AlertCircle,
    ClipboardCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import AddWarrantyDialog from './AddWarrantyDialog';
import EquipmentFormModal from './EquipmentFormModal';
import EquipmentDocumentsTab from './EquipmentDocumentsTab';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Equipment, EquipmentOperationalStatus, WorkOrder, ChatMessage, Warranty, EquipmentDocRole, DocumentRole } from '@/lib/types';
import { getEquipmentChatResponse } from '@/lib/gemini';
import SpendAnalytics from './SpendAnalytics';
import { getMaintenancePredictions, getRiskLevelText } from '@/lib/maintenanceApi';
import type { PredictedMaintenanceEvent } from '@/types/maintenance';
import equipmentApi, { DiagnosticAlert } from '@/lib/equipmentApi';
import { integrationService } from '@/services/integrationService';
import { toast } from 'sonner';

interface ExtendedChatMessage extends ChatMessage {
    sources?: any[];
}

interface ChatSession {
    id: string;
    title: string;
    timestamp: Date;
    preview: string;
    messages: ExtendedChatMessage[];
}

interface EquipmentDetailProps {
    equipment: Equipment;
    workOrders: WorkOrder[];
    onBack: () => void;
    onUpdateStatus?: (status: EquipmentOperationalStatus) => Promise<void>;
    onUpdate?: (data: any) => Promise<void>;
    onRefresh?: () => Promise<void>;
    onDelete?: () => Promise<void>;
    initialAiOpen?: boolean;
}

const EquipmentDetail: React.FC<EquipmentDetailProps> = ({ equipment, workOrders, onBack, onUpdateStatus, onUpdate, onRefresh, onDelete, initialAiOpen }) => {
    const navigate = useNavigate();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddWarrantyOpen, setIsAddWarrantyOpen] = useState(false);

    const isReadOnly = equipment.status === EquipmentOperationalStatus.OutOfService || equipment.status === EquipmentOperationalStatus.Sold;

    const handleEditSave = async (data: any) => {
        if (onUpdate) {
            await onUpdate(data);
            setIsEditModalOpen(false);
        }
    };

    const handleDeleteClick = async () => {
        if (onDelete && window.confirm(`Are you sure you want to delete ${equipment.unitNumber}? This action cannot be undone.`)) {
            await onDelete();
        }
    };

    const [isAiPanelOpen, setIsAiPanelOpen] = useState(initialAiOpen || false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [warranties, setWarranties] = useState<Warranty[]>([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

    // Derived messages for the UI
    const messages = useMemo(() => {
        if (!currentSessionId) return [];
        return sessions.find(s => s.id === currentSessionId)?.messages || [];
    }, [sessions, currentSessionId]);

    const [isLoaded, setIsLoaded] = useState(false);

    const [predictions, setPredictions] = useState<PredictedMaintenanceEvent[]>([]);
    const [loadingPredictions, setLoadingPredictions] = useState(false);

    useEffect(() => {
        let mounted = true;
        const loadPredictions = async () => {
            if (!equipment?.id) return;
            try {
                setLoadingPredictions(true);
                const data = await getMaintenancePredictions({
                    equipmentId: equipment.id,
                    take: 5,
                });
                if (mounted) setPredictions(data);
            } catch (err) {
                console.error('Failed to load predictions for equipment', err);
            } finally {
                if (mounted) setLoadingPredictions(false);
            }
        };
        void loadPredictions();
        return () => { mounted = false; };
    }, [equipment?.id]);

    // PERSISTENCE: Save/Load Sessions
    useEffect(() => {
        setIsLoaded(false);
        const savedSessions = localStorage.getItem(`fleet_chat_sessions_${equipment.id}`);

        let loadedSessions: ChatSession[] = [];

        // 1. Load Sessions if exist
        if (savedSessions) {
            try {
                const parsed = JSON.parse(savedSessions);
                loadedSessions = parsed.map((s: any) => ({
                    ...s,
                    timestamp: new Date(s.timestamp),
                    messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
                }));
            } catch (err) {
                console.warn("Failed to parse sessions", err);
            }
        }

        // 2. Migration Check: Do we have legacy messages but NO sessions?
        // Only run migration if we found NO new sessions to avoid overwriting.
        if (loadedSessions.length === 0) {
            const legacy = localStorage.getItem(`fleet_chat_${equipment.id}`);
            if (legacy) {
                try {
                    const parsedLegacy = JSON.parse(legacy);
                    if (parsedLegacy.length > 0) {
                        const restoredMsg = parsedLegacy.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
                        const migratedSession: ChatSession = {
                            id: 'migrated_legacy',
                            title: 'Previous Consultation',
                            timestamp: new Date(),
                            preview: 'Restored history...',
                            messages: restoredMsg
                        };
                        loadedSessions = [migratedSession];
                        // Clear legacy key to mark migration done
                        localStorage.removeItem(`fleet_chat_${equipment.id}`);
                    }
                } catch (e) {
                    console.warn("Legacy migration failed", e);
                }
            }
        }

        setSessions(loadedSessions);
        // Default to opening the most recent session if exists
        if (loadedSessions.length > 0) {
            setCurrentSessionId(loadedSessions[0].id);
        } else {
            setCurrentSessionId(null);
        }

        setIsLoaded(true);
    }, [equipment.id]);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem(`fleet_chat_sessions_${equipment.id}`, JSON.stringify(sessions));
    }, [sessions, isLoaded, equipment.id]);

    // Tab State
    const [activeTab, setActiveTab] = useState<'dashboard' | 'diagnostics' | 'inspections' | 'history' | 'documents' | 'ai' | 'spend' | 'warranty'>('dashboard');

    // Diagnostics
    const [diagnostics, setDiagnostics] = useState<DiagnosticAlert[]>([]);
    const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
    const [diagnosticsSyncing, setDiagnosticsSyncing] = useState(false);

    useEffect(() => {
        if (activeTab !== 'diagnostics') return;
        setDiagnosticsLoading(true);
        equipmentApi.getDiagnostics(equipment.id)
            .then(async (stored) => {
                setDiagnostics(stored);
                // Auto-sync on first open — only call the provider this equipment belongs to
                try {
                    await syncFaultsForEquipment();
                    const fresh = await equipmentApi.getDiagnostics(equipment.id);
                    setDiagnostics(fresh);
                } catch {
                    // Provider not connected — silently ignore
                }
            })
            .catch(() => {})
            .finally(() => setDiagnosticsLoading(false));
    }, [activeTab, equipment.id]);

    const syncFaultsForEquipment = () => {
        const provider = equipment.externalProvider;
        if (provider === 'Samsara') return integrationService.syncSamsaraFaults();
        if (provider === 'Motive')  return integrationService.syncFaults();
        // No provider linked — try both silently
        return Promise.allSettled([
            integrationService.syncFaults(),
            integrationService.syncSamsaraFaults(),
        ]);
    };

    const handleSyncFaults = async () => {
        setDiagnosticsSyncing(true);
        try {
            await syncFaultsForEquipment();
            const fresh = await equipmentApi.getDiagnostics(equipment.id);
            setDiagnostics(fresh);
            const active = fresh.filter(d => d.status === 'Active').length;
            if (active > 0) {
                toast.warning(`${active} active fault code${active > 1 ? 's' : ''} found.`);
            } else {
                toast.success('Sync complete — no active fault codes.');
            }
        } catch {
            const provider = equipment.externalProvider ?? 'integration';
            toast.error(`Failed to sync fault codes. Check ${provider} connection.`);
        } finally {
            setDiagnosticsSyncing(false);
        }
    };

    const equipmentHistory = workOrders.filter(wo => wo.equipmentId === equipment.id);

    const [historyWarrantyFilter, setHistoryWarrantyFilter] = useState(false);
    const filteredHistory = useMemo(() => {
        if (!historyWarrantyFilter) return equipmentHistory;
        return equipmentHistory.filter(wo => wo.items && wo.items.some(l => l.isWarrantyClaim));
    }, [equipmentHistory, historyWarrantyFilter]);

    // Suggested prompts for immediate utility
    const suggestedPrompts = [
        { text: `Summarize the last 3 repairs for Unit ${equipment.unitNumber}`, icon: History },
        { text: `What are common failure points for ${equipment.year} ${equipment.model} models?`, icon: ShieldCheck },
        { text: "Find nearby Peterbilt authorized service centers", icon: MapPin }
    ];

    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping]);

    const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
        if (e) e.preventDefault();
        const textToSend = overrideText || input;
        if (!textToSend.trim()) return;

        const userMsg: ExtendedChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: textToSend,
            timestamp: new Date()
        };

        // If no session active, create one
        let activeSessionId = currentSessionId;
        if (!activeSessionId) {
            const newId = Date.now().toString();
            activeSessionId = newId;
            const newSession: ChatSession = {
                id: newId,
                title: textToSend.length > 30 ? textToSend.substring(0, 30) + '...' : textToSend,
                timestamp: new Date(),
                preview: textToSend,
                messages: [userMsg]
            };
            setSessions(prev => [newSession, ...prev]);
            setCurrentSessionId(newId);
        } else {
            // Append to existing
            setSessions(prev => prev.map(s => {
                if (s.id === activeSessionId) {
                    return {
                        ...s,
                        messages: [...s.messages, userMsg],
                        preview: textToSend, // Update preview to latest
                        timestamp: new Date()
                    };
                }
                return s;
            }));
        }

        setInput('');
        setIsTyping(true);

        const { text, sources } = await getEquipmentChatResponse(equipment, equipmentHistory, textToSend, warranties);

        const aiMsg: ExtendedChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: text,
            sources,
            timestamp: new Date()
        };

        setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
                return {
                    ...s,
                    messages: [...s.messages, aiMsg]
                };
            }
            return s;
        }));
        setIsTyping(false);
    };

    const handleNewChat = () => {
        setCurrentSessionId(null);
    };

    const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (window.confirm("Delete this conversation?")) {
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            if (currentSessionId === sessionId) {
                setCurrentSessionId(null);
            }
        }
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 bg-slate-50 p-4 md:p-6 lg:p-8 overflow-y-auto">
            {/* Header & Navigation */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 w-full">
                <div className="flex flex-wrap items-center gap-3 min-w-0">
                    <Button variant="outline" size="icon" onClick={onBack} className="h-10 w-10 rounded-2xl border-slate-200 shadow-sm hover:bg-slate-50 shrink-0">
                        <X className="w-4 h-4 text-slate-400 transition-colors" />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight break-words">Unit {equipment.unitNumber} Intel</h1>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Verified asset diagnostics & service timeline</p>
                    </div>
                    {onUpdate && (
                        <div className="flex items-center gap-2 mt-2 md:mt-0">
                            <Button
                                variant="secondary"
                                onClick={() => setIsEditModalOpen(true)}
                                className="h-10 px-4 rounded-xl gap-2 font-bold text-xs uppercase tracking-wider text-slate-600 bg-slate-100 hover:bg-slate-200"
                            >
                                <Pencil className="w-4 h-4" /> Edit
                            </Button>
                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    onClick={handleDeleteClick}
                                    className="h-10 px-3 rounded-xl hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>



                {/* Read Only Banner */}
                {isReadOnly && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 mb-8 w-full">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-xl shrink-0">
                                <Lock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="font-black text-amber-800 text-sm">Read-Only Mode Active</h4>
                                <p className="text-[10px] md:text-xs font-bold text-amber-600/80 mt-0.5">
                                    This asset is marked as {equipment.status === EquipmentOperationalStatus.OutOfService ? 'Out of Service' : 'Sold'}. creating new records is disabled.
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditModalOpen(true)}
                            className="text-amber-700 hover:text-amber-800 hover:bg-amber-100 font-bold text-[10px] md:text-xs uppercase tracking-wider shrink-0"
                        >
                            Change Status
                        </Button>
                    </div>
                )}

                <div className="w-full min-w-0">
                    <div className="flex p-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-x-auto">
                        {(['dashboard', 'diagnostics', 'inspections', 'history', 'documents', 'ai', 'spend', 'warranty'] as const).map(tab => (
                            <Button
                                key={tab}
                                variant={activeTab === tab ? "default" : "ghost"}
                                onClick={() => setActiveTab(tab)}
                                className={`px-3 md:px-5 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all h-auto shrink-0 ${activeTab !== tab ? 'text-slate-500 hover:bg-slate-50 hover:text-slate-900' : ''}`}
                            >
                                <span className="flex items-center gap-1.5">
                                    {tab === 'dashboard' && <Container className="w-3.5 h-3.5 hidden md:block" />}
                                    {tab === 'diagnostics' && <AlertCircle className="w-3.5 h-3.5 hidden md:block" />}
                                    {tab === 'inspections' && <ClipboardCheck className="w-3.5 h-3.5 hidden md:block" />}
                                    {tab === 'history' && <History className="w-3.5 h-3.5 hidden md:block" />}
                                    {tab === 'documents' && <FileText className="w-3.5 h-3.5 hidden md:block" />}
                                    {tab === 'ai' && <Sparkles className="w-3.5 h-3.5 hidden md:block" />}
                                    {tab === 'spend' && <Cpu className="w-3.5 h-3.5 hidden md:block" />}
                                    {tab === 'warranty' && <FileCheck className="w-3.5 h-3.5 hidden md:block" />}
                                    {tab}
                                </span>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 space-y-6 md:space-y-8">

                {/* DASHBOARD VIEW */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                        {/* Top Row: Specs + Spend */}
                        <div className="flex flex-col xl:flex-row gap-5 lg:gap-6 w-full">

                            {/* LEFT: Main Spec Card */}
                            <div className="flex-1 w-full min-w-0 bg-white rounded-2xl p-5 md:p-6 lg:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="mb-6">
                                    <Select
                                        value={(() => {
                                            const s = equipment.status;
                                            if (typeof s === 'number') return s.toString();
                                            if (typeof s === 'string') {
                                                // If backend returns "Active", map to 1
                                                const val = EquipmentOperationalStatus[s as keyof typeof EquipmentOperationalStatus];
                                                return val ? val.toString() : '';
                                            }
                                            return '';
                                        })()}
                                        onValueChange={(val) => onUpdateStatus && onUpdateStatus(Number(val) as EquipmentOperationalStatus)}
                                    >
                                        <SelectTrigger className={`w-auto min-w-[140px] px-4 py-1.5 h-auto rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${(() => {
                                            const s = equipment.status;
                                            const statusVal = typeof s === 'string' ? EquipmentOperationalStatus[s as keyof typeof EquipmentOperationalStatus] : s;

                                            if (statusVal === EquipmentOperationalStatus.Active) return 'bg-emerald-100/50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300';
                                            if (statusVal === EquipmentOperationalStatus.InShop) return 'bg-amber-100/50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300';
                                            return 'bg-rose-100/50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300';
                                        })()
                                            }`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.keys(EquipmentOperationalStatus)
                                                .filter((key) => isNaN(Number(key))) // Filter out numeric keys
                                                .map((key) => {
                                                    const statusValue = EquipmentOperationalStatus[key as keyof typeof EquipmentOperationalStatus];
                                                    return (
                                                        <SelectItem key={statusValue} value={statusValue.toString()} className="text-xs font-bold uppercase tracking-wide">
                                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                                        </SelectItem>
                                                    );
                                                })}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-6 items-start relative z-10 w-full min-w-0">
                                    <div className="space-y-4 min-w-0 w-full">
                                        <h2 className="text-lg md:text-xl lg:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug break-words">{equipment.year} {equipment.make} {equipment.model}</h2>

                                        <div className="flex flex-wrap gap-4 md:gap-6 pt-4">
                                            <div className="min-w-[100px]">
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">VIN Number</div>
                                                <div className="font-mono font-bold text-slate-800 truncate">{equipment.vin || 'N/A'}</div>
                                            </div>
                                            <div className="min-w-[80px]">
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Plate</div>
                                                <div className="font-bold text-slate-800 truncate">{equipment.licensePlate || 'N/A'}</div>
                                            </div>
                                            <div className="min-w-[80px]">
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 border-b border-dashed border-slate-300 w-fit">Odometer</div>
                                                <div className="font-mono font-bold text-slate-800 truncate">
                                                    {equipment.telematicsOdometerMiles != null
                                                        ? Math.round(equipment.telematicsOdometerMiles).toLocaleString() + ' mi'
                                                        : equipment.mileage
                                                            ? equipment.mileage.toLocaleString() + ' mi'
                                                            : 'N/A'}
                                                </div>
                                            </div>
                                            {equipment.telematicsFuelLevel != null && (
                                                <div className="min-w-[100px]">
                                                    <div className="text-[9px] font-black uppercase tracking-widest mb-1 w-fit" style={{
                                                        color: equipment.telematicsFuelLevel <= 15 ? '#e11d48' :
                                                               equipment.telematicsFuelLevel <= 30 ? '#d97706' : '#64748b'
                                                    }}>Fuel Level</div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 h-2 rounded-full bg-slate-200 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${
                                                                    equipment.telematicsFuelLevel <= 15 ? 'bg-rose-500' :
                                                                    equipment.telematicsFuelLevel <= 30 ? 'bg-amber-400' :
                                                                    'bg-emerald-500'
                                                                }`}
                                                                style={{ width: `${Math.round(equipment.telematicsFuelLevel)}%` }}
                                                            />
                                                        </div>
                                                        <span className={`font-black text-sm ${
                                                            equipment.telematicsFuelLevel <= 15 ? 'text-rose-600' :
                                                            equipment.telematicsFuelLevel <= 30 ? 'text-amber-600' :
                                                            'text-slate-800'
                                                        }`}>{Math.round(equipment.telematicsFuelLevel)}%</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="min-w-[120px]">
                                                <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> Location
                                                </div>
                                                <div className="font-bold text-blue-900 capitalize truncate">
                                                    {equipment.lastKnownLocation || 'Awaiting Sync...'}
                                                </div>
                                                {/* Add a direct link to Google Maps if Lat/Long are available */}
                                                {equipment.latitude && equipment.longitude && (
                                                    <a
                                                        href={`https://www.google.com/maps?q=${equipment.latitude},${equipment.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[9px] font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-1 transition-colors"
                                                    >
                                                        View on Map <ExternalLink className="w-2 h-2" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Assigned Operator</div>
                                            {equipment.assignedOperatorId ? (
                                                <div
                                                    onClick={() => navigate(`/app/drivers/${equipment.assignedOperatorId}`)}
                                                    className="flex items-center gap-3 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50 cursor-pointer hover:bg-blue-100/50 transition-all group w-fit pr-6"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform shadow-sm shadow-blue-200">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-900">{equipment.assignedOperatorName}</div>
                                                        <div className="text-[9px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                                                            View Profile <ExternalLink className="w-2.5 h-2.5" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 w-fit pr-6">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 border-dashed">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-bold text-slate-400">Unassigned</div>
                                                        <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">No Operator</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2x2 Stats Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 w-full min-w-0">
                                        {(() => {
                                            // Robust helper to map any doc role/kind format to our Enum
                                            const getRole = (d: any): DocumentRole | null => {
                                                if (typeof d.docRole === 'number') {
                                                    switch (d.docRole) {
                                                        case 10: return EquipmentDocRole.Insurance;
                                                        case 11: return EquipmentDocRole.Registration;
                                                        case 12: return EquipmentDocRole.Title;
                                                        case 13: return EquipmentDocRole.Warranty;
                                                        case 14: return EquipmentDocRole.Lease;
                                                        case 15: return EquipmentDocRole.DOTInspection;
                                                        case 16: return EquipmentDocRole.ScaleTicket;
                                                        case 0: return EquipmentDocRole.General;
                                                        // Legacy 1-7
                                                        case 1: return EquipmentDocRole.Registration;
                                                        case 2: return EquipmentDocRole.Title;
                                                        case 3: return EquipmentDocRole.Insurance;
                                                        case 4: return EquipmentDocRole.Warranty;
                                                        case 5: return EquipmentDocRole.Lease;
                                                        case 6: return EquipmentDocRole.Other;
                                                        case 7: return EquipmentDocRole.DOTInspection;
                                                        default: return EquipmentDocRole.Other;
                                                    }
                                                }

                                                const k = (d.docRole || d.docKind || '').toString().toLowerCase();

                                                if (k === 'registration' || k.includes('registration')) return EquipmentDocRole.Registration;
                                                if (k === 'title' || k.includes('title')) return EquipmentDocRole.Title;
                                                if (k === 'insurance' || k.includes('insurance')) return EquipmentDocRole.Insurance;
                                                if (k === 'warranty' || k.includes('warranty')) return EquipmentDocRole.Warranty;
                                                if (k === 'lease' || k.includes('lease')) return EquipmentDocRole.Lease;
                                                if (k === 'inspection' || k === 'dotinspection' || k.includes('dot') || k.includes('inspection')) return EquipmentDocRole.DOTInspection;
                                                if (k === 'general' || k.includes('general')) return EquipmentDocRole.General;

                                                // Handle stringified enum values
                                                if (k === '0') return EquipmentDocRole.General;
                                                if (k === '1') return EquipmentDocRole.Registration;
                                                if (k === '2') return EquipmentDocRole.Title;
                                                if (k === '3') return EquipmentDocRole.Insurance;
                                                if (k === '4') return EquipmentDocRole.Warranty;
                                                if (k === '5') return EquipmentDocRole.Lease;
                                                if (k === '6') return EquipmentDocRole.Other;
                                                if (k === '7') return EquipmentDocRole.DOTInspection;

                                                return EquipmentDocRole.Other;
                                            };

                                            const getExpirationDate = (targetRole: DocumentRole) => {
                                                const docs = equipment.documents?.filter(d => getRole(d) === targetRole) || [];
                                                if (docs.length === 0) return null;

                                                // Sort by expiration date descending to find the latest valid one
                                                return docs.sort((a, b) => {
                                                    const da = a.expirationDate ? new Date(a.expirationDate).getTime() : 0;
                                                    const db = b.expirationDate ? new Date(b.expirationDate).getTime() : 0;
                                                    return db - da;
                                                })[0].expirationDate;
                                            };

                                            const formatDate = (dateStr?: string) => {
                                                if (!dateStr) return 'N/A';
                                                try {
                                                    return format(parseISO(dateStr), 'MM/dd/yyyy');
                                                } catch { return 'N/A'; }
                                            };

                                            const getStatusColor = (dateStr?: string) => {
                                                if (!dateStr) return { color: 'text-slate-400', bg: 'bg-slate-50', label: 'Missing' };
                                                const days = (new Date(dateStr).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                                                if (days < 0) return { color: 'text-rose-600', bg: 'bg-rose-50', label: 'Expired' };
                                                if (days < 30) return { color: 'text-amber-600', bg: 'bg-amber-50', label: 'Expiring Soon' };
                                                return { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Active' };
                                            };

                                            // Calculate Last Service Date
                                            // Calculate Last Service Date
                                            let lastServiceDate = equipment.lastServiceDate;

                                            if (!lastServiceDate && equipmentHistory.length > 0) {
                                                const completedOrders = equipmentHistory
                                                    .filter(wo => wo.status === 3 || wo.status === 4 || wo.status === 6) // Completed, Closed, Paid
                                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                                                if (completedOrders.length > 0) {
                                                    lastServiceDate = completedOrders[0].date;
                                                }
                                            }

                                            const insuranceExp = getExpirationDate(EquipmentDocRole.Insurance);
                                            const regExp = getExpirationDate(EquipmentDocRole.Registration);
                                            const dotExp = getExpirationDate(EquipmentDocRole.DOTInspection);

                                            const insStatus = getStatusColor(insuranceExp);
                                            const regStatus = getStatusColor(regExp);
                                            const dotStatus = getStatusColor(dotExp);

                                            return [
                                                {
                                                    label: 'Insurance Expiration',
                                                    val: formatDate(insuranceExp),
                                                    icon: ShieldCheck,
                                                    color: insStatus.color,
                                                    bg: insStatus.bg
                                                },
                                                {
                                                    label: 'Registration Expiration',
                                                    val: formatDate(regExp),
                                                    icon: Sparkles,
                                                    color: regStatus.color,
                                                    bg: regStatus.bg
                                                },
                                                {
                                                    label: 'D.O.T Inspection',
                                                    val: formatDate(dotExp),
                                                    icon: Cpu,
                                                    color: dotStatus.color,
                                                    bg: dotStatus.bg
                                                },
                                                {
                                                    label: 'Last Service',
                                                    val: lastServiceDate ? new Date(lastServiceDate).toLocaleDateString() : 'N/A',
                                                    icon: Wrench,
                                                    color: 'text-amber-600',
                                                    bg: 'bg-amber-50'
                                                }
                                            ].map((s, i) => (
                                                <div key={i} className={`${s.bg} p-4 rounded-xl border border-slate-200 shadow-sm`}>
                                                    <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{s.label}</div>
                                                    <div className="text-lg font-bold text-slate-900 tracking-tight">{s.val}</div>
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                    {/* 
                                    <div className="grid grid-cols-2 gap-4 flex-1 w-full">
                                        {[
                                            { label: 'Compliance', val: 'Pass', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
                                            { label: 'Last Service', val: equipment.lastServiceDate ? equipment.lastServiceDate.split('T')[0] : 'N/A', icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
                                            { label: 'Efficiency', val: '94%', icon: Sparkles, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                            { label: 'System Health', val: 'Stable', icon: Cpu, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                                        ].map((s, i) => (
                                            <div key={i} className={`${s.bg} p-5 rounded-[2rem] border border-slate-100/50`}>
                                                <s.icon className={`w-5 h-5 ${s.color} mb-3`} />
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{s.label}</div>
                                                <div className="text-base font-black text-slate-900">{s.val}</div>
                                            </div>
                                        ))}
                                    </div> 
                                    */}
                                </div>
                            </div>

                            {/* RIGHT: Dark Spend Card */}
                            <div className="w-full xl:w-80 2xl:w-96 shrink-0 bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden group shadow-xl">
                                <div className="relative z-10 h-full flex flex-col justify-between gap-6">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Life-to-Date Spend</div>
                                        <div className="text-4xl font-extrabold tracking-tight text-white">
                                            ${equipmentHistory.reduce((sum, wo) => sum + (wo.totalCost || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </div>
                                    </div>
                                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Maintenance Events</div>
                                        <div className="text-2xl font-black text-white">{equipmentHistory.length}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle Row: Recalls */}
                        {/* Left as placeholder/commented out to match original file state if desired, or kept simplified */}

                        {/* Bottom Row: Predictive */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 mt-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="bg-blue-50 w-10 h-10 rounded-lg flex items-center justify-center shadow-inner">
                                    <Cpu className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">Predictive Uptime Metrics</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">AI-driven maintenance forecasting</p>
                                </div>
                            </div>

                            {loadingPredictions ? (
                                <div className="text-center py-10 opacity-50">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-400 mx-auto mb-4"></div>
                                    <p className="text-xs font-bold text-slate-400">Calibrating models...</p>
                                </div>
                            ) : predictions.length === 0 ? (
                                <div className="text-center py-8 opacity-50">
                                    <div className="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-500">No predictions found.</p>
                                    <p className="text-xs text-slate-400 mt-1">This unit is currently operating without any high-risk forecast patterns.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {predictions.map((pred) => (
                                        <div key={pred.id} className="relative group bg-slate-50 rounded-2xl p-6 border border-slate-200/60 hover:border-blue-200 hover:shadow-md transition-all">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${pred.urgency === 'critical' ? 'bg-rose-100 text-rose-700' :
                                                    pred.urgency === 'high' ? 'bg-amber-100 text-amber-700' :
                                                        pred.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    {pred.urgency} Risk
                                                </div>
                                                <div className="text-xs font-bold text-slate-400">Risk: {getRiskLevelText(pred.riskScore)}</div>
                                            </div>
                                            <h4 className="font-black text-slate-900 text-lg leading-tight mb-2">{pred.title}</h4>
                                            <p className="text-sm text-slate-600 font-medium line-clamp-2 mb-4">{pred.description}</p>

                                            <div className="space-y-2 mt-auto pt-4 border-t border-slate-100">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-500 font-bold uppercase tracking-wider">Est. Cost</span>
                                                    <span className="font-black text-slate-900">${pred.estimatedRepairCost?.toLocaleString() ?? '—'}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-slate-500 font-bold uppercase tracking-wider">Pot. Savings</span>
                                                    <span className="font-black text-emerald-600">${pred.estimatedSavings?.toLocaleString() ?? '—'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* DIAGNOSTICS VIEW */}
                {activeTab === 'diagnostics' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="font-black text-slate-900 flex items-center gap-2 text-xl tracking-tight">
                                        <AlertCircle className="w-5 h-5 text-rose-500" /> Active Faults
                                    </h3>
                                    <p className="text-slate-500 text-xs mt-1">Live telematics codes synced from Motive & Samsara.</p>
                                </div>
                                <Button
                                    onClick={handleSyncFaults}
                                    disabled={diagnosticsSyncing}
                                    className="bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold uppercase tracking-widest text-[10px] gap-2 rounded-xl h-9 px-4"
                                >
                                    {diagnosticsSyncing
                                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing...</>
                                        : <><AlertCircle className="w-3.5 h-3.5" /> Sync Codes</>
                                    }
                                </Button>
                            </div>

                            {diagnosticsLoading ? (
                                <div className="p-10 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto mb-2" />
                                    <p className="text-slate-400 text-xs font-bold">Loading fault codes...</p>
                                </div>
                            ) : diagnostics.filter(d => d.status === 'Active').length > 0 ? (
                                <div className="space-y-3">
                                    {diagnostics.filter(d => d.status === 'Active').map(fault => {
                                        const sev = (fault.severity || '').toLowerCase();
                                        const sevStyle = sev === 'critical' ? 'bg-red-100 text-red-700 border-red-200'
                                            : sev === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200'
                                            : sev === 'medium' ? 'bg-amber-100 text-amber-700 border-amber-200'
                                            : 'bg-slate-100 text-slate-600 border-slate-200';
                                        return (
                                            <div key={fault.id} className="flex items-start gap-4 p-4 rounded-xl border border-rose-100 bg-rose-50/40">
                                                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                                                    <AlertCircle className="w-4 h-4 text-rose-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-black text-slate-900 font-mono text-xs">{fault.code}</span>
                                                        {fault.severity && (
                                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${sevStyle}`}>
                                                                {fault.severity}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {fault.description && (
                                                        <p className="text-xs text-slate-600 mt-1">{fault.description}</p>
                                                    )}
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">
                                                        Detected {format(parseISO(fault.alertAt), "MMM d, yyyy h:mm a")}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                                    <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ShieldCheck className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <h4 className="font-black text-slate-900 text-lg">No Active Fault Codes</h4>
                                    <p className="text-slate-500 text-sm mt-1">Engine is reporting healthy status. Click Sync Codes to pull latest from Motive & Samsara.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* INSPECTIONS VIEW */}
                {activeTab === 'inspections' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 md:p-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h3 className="font-black text-slate-900 flex items-center gap-2 text-xl tracking-tight">
                                        <ClipboardCheck className="w-5 h-5 text-blue-600" /> DOT Inspection Logs
                                    </h3>
                                    <p className="text-slate-500 text-xs mt-1">Operator pre-trip and post-trip compliance records.</p>
                                </div>
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-widest text-[10px] gap-2 rounded-xl h-9 px-4 shadow-sm shadow-blue-200">
                                    <Plus className="w-3.5 h-3.5" /> Log Manual Report
                                </Button>
                            </div>

                            <div className="p-10 text-center border border-slate-100 rounded-xl bg-slate-50">
                                <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
                                    <ClipboardCheck className="w-6 h-6 text-blue-600" />
                                </div>
                                <h4 className="font-black text-slate-900 text-base">Waiting for Initial Sync</h4>
                                <p className="text-slate-500 text-xs mt-1">Inspection reports will populate automatically once operators submit them via Motive App.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* HISTORY VIEW */}
                {activeTab === 'history' && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        {/* Audit History Timeline */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-[10px] tracking-widest">
                                    <History className="w-3.5 h-3.5 text-slate-400" /> Verified Maintenance Audit History
                                </h3>
                                <div className="flex items-center gap-2 px-2">
                                    <input
                                        type="checkbox"
                                        id="historyWarrantyFilter"
                                        checked={historyWarrantyFilter}
                                        onChange={(e) => setHistoryWarrantyFilter(e.target.checked)}
                                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="historyWarrantyFilter" className="text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer">
                                        Has Warranty
                                    </label>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto custom-scrollbar">
                                {filteredHistory.length > 0 ? (
                                    filteredHistory.map(wo => (
                                        <div key={wo.id} className="p-5 md:p-6 flex items-start justify-between hover:bg-slate-50/50 transition-all cursor-pointer group" onClick={() => navigate(`/app/service/${wo.id}`)}>
                                            <div className="space-y-3 flex-1 pr-12">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-base font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">{wo.woNumber || 'Draft'}</div>
                                                    {wo.media && wo.media.length > 0 && (
                                                        <span className="flex items-center gap-1.5 text-[9px] bg-blue-50 px-2 py-0.5 rounded-lg text-blue-600 uppercase font-black tracking-widest border border-blue-100 shadow-sm">
                                                            <FileText className="w-3 h-3" /> Invoice Attached
                                                        </span>
                                                    )}
                                                    {wo.items?.some(l => l.isWarrantyClaim) && (
                                                        <span className="flex items-center gap-1.5 text-[9px] bg-purple-50 px-2 py-0.5 rounded-lg text-purple-600 uppercase font-black tracking-widest border border-purple-100 shadow-sm">
                                                            <ShieldCheck className="w-3 h-3" /> Warranty Claim
                                                        </span>
                                                    )}
                                                    <span className="text-[9px] bg-emerald-50 px-2 py-0.5 rounded-lg text-emerald-600 uppercase font-black tracking-widest border border-emerald-100">Audit Pass</span>
                                                </div>
                                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">{wo.vendor || wo.vendorId || 'Unknown Vendor'}</div>
                                                <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-2xl">{wo.title || wo.description}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-xl font-mono font-black text-slate-900 tracking-tighter">${wo.totalCost?.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? '0.00'}</div>
                                                <div className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest">{new Date(wo.date).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center">
                                        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                            <History className="w-8 h-8 text-slate-200" />
                                        </div>
                                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No verified maintenance logs for this unit.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'spend' && (
                    <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                        <SpendAnalytics
                            data={equipmentHistory}
                            equipmentInServiceDate={equipment.inServiceDate}
                            onAddRecord={() => navigate('/app/work-orders')}
                        />
                    </div>
                )}

                {/* DOCUMENTS VIEW */}
                {activeTab === 'documents' && (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <EquipmentDocumentsTab
                            equipment={equipment}
                            onRefresh={() => {
                                if (onRefresh) onRefresh();
                            }}
                        />
                    </div>
                )}

                {/* AI View */}
                {/* AI View */}
                {activeTab === 'ai' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in-95 duration-200">
                        {/* Session History List */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                                    <History className="w-4 h-4 text-slate-400" /> Recent Consultations
                                </h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {sessions.length > 0 ? (
                                    sessions.map(session => (
                                        <div
                                            key={session.id}
                                            onClick={() => {
                                                setCurrentSessionId(session.id);
                                                setIsAiPanelOpen(true);
                                            }}
                                            className="group p-4 bg-white border border-slate-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 cursor-pointer transition-all shadow-sm flex justify-between items-start"
                                        >
                                            <div className="space-y-1">
                                                <div className="font-bold text-slate-800 group-hover:text-blue-700 text-sm line-clamp-1">{session.title}</div>
                                                <div className="text-xs text-slate-500 line-clamp-2">{session.preview}</div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider pt-2">{session.timestamp.toLocaleDateString()}</div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => handleDeleteSession(e, session.id)}
                                                className="opacity-0 group-hover:opacity-100 hover:bg-rose-100 hover:text-rose-600 h-8 w-8 rounded-xl transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 opacity-50">
                                        <div className="bg-slate-50 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                                            <Bot className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-400">No past conversations</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* New Chat CTA */}
                        <div className="bg-blue-600 p-6 md:p-8 rounded-2xl shadow-xl shadow-blue-500/20 text-center flex flex-col items-center justify-center text-white h-full min-h-[400px]">
                            <div className="bg-white/10 w-20 h-20 rounded-full flex items-center justify-center mb-6 backdrop-blur-md">
                                <Sparkles className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Start New Analysis</h3>
                            <p className="text-blue-100 text-sm font-medium mb-6 max-w-xs leading-relaxed">
                                Initialize a fresh diagnostic session with the Unit Intelligence Expert.
                            </p>
                            <Button
                                size="default"
                                disabled={isReadOnly}
                                className={`h-11 px-6 rounded-xl font-black text-blue-600 bg-white hover:bg-blue-50 shadow-lg border-0 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => {
                                    if (isReadOnly) return;
                                    handleNewChat();
                                    setIsAiPanelOpen(true);
                                }}
                            >
                                {isReadOnly ? <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> Disabled</span> : 'New Consultation'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* WARRANTY VIEW */}
                {activeTab === 'warranty' && (
                    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                        {warranties.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 md:p-16 text-center">
                                <div className="bg-slate-50 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <FileCheck className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 mb-2">No Warranty Records</h3>
                                <p className="text-slate-500 font-medium max-w-md mx-auto mb-6 text-sm">
                                    Upload written warranties, extended coverage docs, or capture policy details for AI analysis.
                                </p>

                                <Button
                                    size="default"
                                    disabled={isReadOnly}
                                    onClick={() => !isReadOnly && setIsAddWarrantyOpen(true)}
                                    className="h-11 px-6 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg"
                                >
                                    {isReadOnly ? <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> Disabled</span> : '+ Add Warranty Record'}
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-end">
                                    <Button
                                        disabled={isReadOnly}
                                        onClick={() => !isReadOnly && setIsAddWarrantyOpen(true)}
                                        className="h-12 px-6 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg gap-2"
                                    >
                                        {isReadOnly ? <Lock className="w-4 h-4" /> : <FileCheck className="w-4 h-4" />}
                                        {isReadOnly ? 'Read Only' : 'Add Another'}
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {warranties.map(w => (
                                        <div key={w.id} className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border mb-2 ${w.startDate && w.endDate && new Date() > new Date(w.endDate)
                                                        ? 'bg-rose-50 text-rose-600 border-rose-100'
                                                        : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        }`}>
                                                        {w.startDate && w.endDate && new Date() > new Date(w.endDate) ? 'Expired' : 'Active Coverage'}
                                                    </span>
                                                    <h3 className="font-black text-xl text-slate-900">{w.description}</h3>
                                                </div>
                                                <div className="bg-slate-50 p-2.5 rounded-xl">
                                                    <ShieldCheck className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <Container className="w-4 h-4 text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Provider</div>
                                                        <div className="text-xs font-bold text-slate-900">{w.provider}</div>
                                                    </div>
                                                </div>
                                                {(w.startDate || w.endDate) && (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                            <History className="w-4 h-4 text-slate-500" />
                                                        </div>
                                                        <div>
                                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Coverage Period</div>
                                                            <div className="text-xs font-bold text-slate-900">
                                                                {w.startDate ? new Date(w.startDate).toLocaleDateString() : 'N/A'} - {w.endDate ? new Date(w.endDate).toLocaleDateString() : 'Lifetime'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {w.files && w.files.length > 0 && (
                                                    <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                                            <FileText className="w-4 h-4 text-blue-500" />
                                                        </div>
                                                        <div>
                                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Documents</div>
                                                            <div className="text-xs font-bold text-blue-600 underline cursor-pointer hover:text-blue-800">
                                                                {w.files.length} file{w.files.length !== 1 ? 's' : ''} attached
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )
                }
            </div >

            {/* Dialogs */}
            < AddWarrantyDialog
                open={isAddWarrantyOpen}
                onOpenChange={setIsAddWarrantyOpen}
                onSave={(w) => {
                    setWarranties(prev => [...prev, w]);
                    setIsAddWarrantyOpen(false);
                }}
            />

            {/* AI Chat Expert Panel */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-[150] transform transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] border-l border-slate-200 ${isAiPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="h-full flex flex-col">
                    <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 p-2.5 rounded-xl shadow-md">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-lg tracking-tight">Unit {equipment.unitNumber} Intel</h3>
                                <p className="text-[10px] text-blue-400 font-black tracking-widest uppercase">Autonomous Fleet Advisor</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleNewChat}
                                disabled={isReadOnly}
                                title={isReadOnly ? "New Chat Disabled" : "New Chat"}
                                className={`hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl h-9 w-9 ${isReadOnly ? 'opacity-30 cursor-not-allowed' : ''}`}
                            >
                                <Plus className="w-4.5 h-4.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => setIsAiPanelOpen(false)} className="hover:bg-slate-800 text-white hover:text-white rounded-xl h-9 w-9">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 custom-scrollbar">
                        {messages.length === 0 && (
                            <div className="text-center py-10 px-6">
                                <div className="bg-blue-50 w-20 h-20 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-blue-100">
                                    <Sparkles className="w-10 h-10 text-blue-500 animate-pulse" />
                                </div>
                                <h4 className="font-black text-slate-900 text-xl mb-2 tracking-tight">Consult Unit Intelligence</h4>
                                <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed max-w-xs mx-auto italic">"I have synthesized all repair records and OEM specifications for this asset. How can I help you today?"</p>

                                <div className="grid grid-cols-1 gap-3 max-w-md mx-auto">
                                    {suggestedPrompts.map((p, idx) => (
                                        <Button
                                            key={idx}
                                            variant="outline"
                                            onClick={() => handleSendMessage(undefined, p.text)}
                                            className="w-full h-auto p-4 flex items-center justify-between rounded-xl border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 whitespace-normal text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <p.icon className="w-4 h-4 text-slate-300" />
                                                <span className="text-xs font-black">{p.text}</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-100" />
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((m) => (
                            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                <div className={`flex gap-4 max-w-[92%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`p-5 rounded-2xl text-sm leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white font-bold' : 'bg-white border border-slate-200 text-slate-800 font-medium'}`}>
                                        <div className="whitespace-pre-wrap">{m.content}</div>

                                        {m.sources && m.sources.length > 0 && (
                                            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                                                {m.sources.map((chunk: any, ci: number) => {
                                                    const link = chunk.web?.uri || chunk.maps?.uri;
                                                    const title = chunk.web?.title || chunk.maps?.title || "Reference";
                                                    return link ? (
                                                        <a key={ci} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[10px] bg-slate-50 hover:bg-blue-50 px-3 py-1.5 rounded-xl text-blue-600 font-black border border-slate-100 transition-all shadow-inner">
                                                            <ExternalLink className="w-3.5 h-3.5" /> {title}
                                                        </a>
                                                    ) : null;
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-3 shadow-sm animate-pulse">
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                    <span className="text-sm font-black text-slate-400 tracking-tighter uppercase">Reasoning Engines Active...</span>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="p-5 border-t border-slate-100 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
                        <form onSubmit={handleSendMessage} className="flex gap-4">
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Message Unit Intelligence Expert..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:bg-white outline-none transition-all placeholder-slate-400 shadow-inner"
                            />
                            <Button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                size="icon"
                                className="h-11 w-11 rounded-xl shadow-lg"
                            >
                                <Send className="w-5 h-5" />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>

            {
                isEditModalOpen && (
                    <EquipmentFormModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onSave={handleEditSave}
                        mode="edit"
                        initialData={{
                            ...equipment,
                            specificType: equipment.specificType || equipment.equipmentTypeName
                        }}
                    />
                )
            }
        </div >
    );
};

export default EquipmentDetail;
