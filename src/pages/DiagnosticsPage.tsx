import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ShieldCheck, Loader2, RefreshCw, ArrowLeft, X, Cpu, Network, Clock, Hash, BarChart2, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { Page } from '@/components/layout/Page';
import api from '@/lib/Api';
import { integrationService } from '@/services/integrationService';
import { DiagnosticAlert } from '@/lib/equipmentApi';
import { toast } from 'sonner';

type FleetDiagnostic = DiagnosticAlert & {
    unitNumber?: string;
    equipmentId?: string;
    make?: string;
    model?: string;
    year?: number;
};

const SEV_STYLE: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    low: 'bg-blue-50 text-blue-700 border-blue-100',
};
const sevStyle = (sev?: string) =>
    SEV_STYLE[(sev || '').toLowerCase()] ?? 'bg-slate-100 text-slate-600 border-slate-200';

const fmt = (dt?: string) => dt ? format(parseISO(dt), 'MMM d, yyyy · h:mm a') : '—';

export default function DiagnosticsPage() {
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState<FleetDiagnostic[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'Active' | 'All'>('Active');
    const [selected, setSelected] = useState<FleetDiagnostic | null>(null);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const res = await api.get<FleetDiagnostic[]>('/equipment/diagnostics');
            setAlerts(res.data);
        } catch {
            toast.error('Failed to load diagnostics.');
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            await integrationService.syncFaults();
            await fetchAlerts();
            const active = alerts.filter(a => a.status === 'Active').length;
            active > 0
                ? toast.warning(`${active} active fault code${active > 1 ? 's' : ''} found.`)
                : toast.success('Sync complete — no active fault codes.');
        } catch {
            toast.error('Sync failed. Check Motive connection.');
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => { fetchAlerts(); }, []);

    const filtered = statusFilter === 'Active'
        ? alerts.filter(a => a.status === 'Active')
        : alerts;

    const activeCount = alerts.filter(a => a.status === 'Active').length;

    return (
        <Page>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/app/equipment')}
                            className="rounded-xl border border-slate-200 hover:bg-slate-50">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                <AlertCircle className="w-6 h-6 text-rose-500" /> Fleet Diagnostics
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">Active fault codes synced from Motive across all vehicles</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden">
                            {(['Active', 'All'] as const).map(s => (
                                <button key={s} onClick={() => setStatusFilter(s)}
                                    className={`px-4 py-2 text-xs font-black uppercase tracking-widest transition-colors ${statusFilter === s ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                                    {s === 'Active' ? `Active (${activeCount})` : 'All'}
                                </button>
                            ))}
                        </div>
                        <Button onClick={handleSync} disabled={syncing}
                            className="bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 font-bold text-xs uppercase tracking-widest rounded-xl h-9 px-4 flex items-center gap-2">
                            {syncing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Syncing...</> : <><RefreshCw className="w-3.5 h-3.5" /> Sync Motive</>}
                        </Button>
                    </div>
                </div>

                {/* List + Detail side-by-side when detail is open */}
                <div className={`flex gap-6 items-start transition-all ${selected ? 'flex-col lg:flex-row' : ''}`}>
                    {/* Fault List */}
                    <div className={`bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden ${selected ? 'lg:w-1/2 w-full' : 'w-full'}`}>
                        {loading ? (
                            <div className="p-20 text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-400 font-bold">Loading fault codes...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="p-20 text-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="w-8 h-8 text-emerald-600" />
                                </div>
                                <h3 className="font-black text-slate-900 text-lg">No Fault Codes</h3>
                                <p className="text-slate-500 text-sm mt-1">
                                    {statusFilter === 'Active' ? 'All vehicles reporting healthy. Click Sync Motive to refresh.' : 'No fault codes recorded yet.'}
                                </p>
                            </div>
                        ) : (() => {
                            // Group by unit number, unknowns last
                            const groups = filtered.reduce<Record<string, FleetDiagnostic[]>>((acc, f) => {
                                const key = f.unitNumber ?? '__unknown__';
                                (acc[key] = acc[key] ?? []).push(f);
                                return acc;
                            }, {});
                            const unitKeys = Object.keys(groups).sort((a, b) => {
                                if (a === '__unknown__') return 1;
                                if (b === '__unknown__') return -1;
                                return a.localeCompare(b, undefined, { numeric: true });
                            });

                            return (
                                <>
                                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                            {filtered.length} fault code{filtered.length !== 1 ? 's' : ''} across {unitKeys.length} unit{unitKeys.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>

                                    {unitKeys.map((unitKey, gi) => {
                                        const faults = groups[unitKey];
                                        const sample = faults[0];
                                        const unitLabel = unitKey === '__unknown__' ? 'Unknown Unit' : `Unit ${unitKey}`;
                                        const vehicleLabel = sample.make ? `${sample.year} ${sample.make} ${sample.model}` : '';

                                        return (
                                            <div key={unitKey} className={gi > 0 ? 'border-t-4 border-slate-100' : ''}>
                                                {/* Unit header */}
                                                <div className="flex items-center gap-3 px-6 py-3 bg-slate-50/80 sticky top-0 z-10">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black text-slate-900 text-sm">{unitLabel}</span>
                                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200">
                                                            {faults.length} fault{faults.length !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                    {vehicleLabel && (
                                                        <span className="text-xs text-slate-400 font-medium">{vehicleLabel}</span>
                                                    )}
                                                </div>

                                                {/* Faults for this unit */}
                                                <div className="divide-y divide-slate-100">
                                                    {faults.map(fault => (
                                                        <div key={fault.id}
                                                            onClick={() => setSelected(fault === selected ? null : fault)}
                                                            className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors ${selected?.id === fault.id ? 'bg-rose-50/40 border-l-4 border-rose-400' : 'hover:bg-slate-50/50'}`}>
                                                            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                                                                <AlertCircle className="w-4 h-4 text-rose-600" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="font-black text-slate-900 font-mono text-sm">{fault.code}</span>
                                                                    {fault.severity && (
                                                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${sevStyle(fault.severity)}`}>
                                                                            {fault.severity}
                                                                        </span>
                                                                    )}
                                                                    {fault.network && (
                                                                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                                                                            {fault.network}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {fault.description && <p className="text-sm text-slate-600 mt-0.5">{fault.description}</p>}
                                                                {fault.sourceAddress && (
                                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                                        <span className="font-semibold">Source:</span> {fault.sourceAddress}
                                                                    </p>
                                                                )}
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                                    {fmt(fault.alertAt)}
                                                                </p>
                                                            </div>
                                                            {fault.occurrenceCount != null && (
                                                                <div className="text-right shrink-0">
                                                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Count</p>
                                                                    <p className="font-black text-slate-700 text-lg">{fault.occurrenceCount}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            );
                        })()}
                        )
                    </div>

                    {/* Detail Panel */}
                    {selected && (
                        <div className="lg:w-1/2 w-full bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden sticky top-6">
                            {/* Detail Header */}
                            <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 bg-rose-50/30">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                                        <AlertCircle className="w-5 h-5 text-rose-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 font-mono text-lg">{selected.code}</h3>
                                        {selected.severity && (
                                            <span className={`mt-1 inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${sevStyle(selected.severity)}`}>
                                                {selected.severity}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Description */}
                                {selected.description && (
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</p>
                                        <p className="text-sm text-slate-700 font-medium">{selected.description}</p>
                                    </div>
                                )}
                                {selected.fmiDescription && (
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">FMI Description</p>
                                        <p className="text-sm text-slate-700 font-medium">{selected.fmiDescription}</p>
                                    </div>
                                )}

                                {/* Divider grid */}
                                <div className="grid grid-cols-2 gap-4 pt-1">
                                    {selected.unitNumber && (
                                        <div className="bg-slate-50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Wrench className="w-3.5 h-3.5 text-slate-400" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehicle</p>
                                            </div>
                                            <p className="font-black text-slate-900">Unit {selected.unitNumber}</p>
                                            {selected.make && <p className="text-xs text-slate-500 mt-0.5">{selected.year} {selected.make} {selected.model}</p>}
                                        </div>
                                    )}
                                    {selected.occurrenceCount != null && (
                                        <div className="bg-slate-50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Occurrences</p>
                                            </div>
                                            <p className="font-black text-slate-900 text-xl">{selected.occurrenceCount}</p>
                                        </div>
                                    )}
                                    {selected.network && (
                                        <div className="bg-slate-50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Network className="w-3.5 h-3.5 text-slate-400" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network</p>
                                            </div>
                                            <p className="font-black text-slate-900 uppercase">{selected.network}</p>
                                        </div>
                                    )}
                                    {selected.faultType && (
                                        <div className="bg-slate-50 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</p>
                                            </div>
                                            <p className="font-black text-slate-900 capitalize">{selected.faultType}</p>
                                        </div>
                                    )}
                                    {selected.sourceAddress && (
                                        <div className="bg-slate-50 rounded-xl p-4 col-span-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Hash className="w-3.5 h-3.5 text-slate-400" />
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source Address</p>
                                            </div>
                                            <p className="font-bold text-slate-700 text-sm">{selected.sourceAddress}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Timestamps */}
                                <div className="border-t border-slate-100 pt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">First Detected</span>
                                        </div>
                                        <span className="text-xs font-bold text-slate-700">{fmt(selected.alertAt)}</span>
                                    </div>
                                    {selected.lastObservedAt && (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Last Observed</span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-700">{fmt(selected.lastObservedAt)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Page>
    );
}
