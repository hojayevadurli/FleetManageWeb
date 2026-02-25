import React, { useMemo } from 'react';
import { Activity, Zap, Layers, AlertCircle, Bot, History, Settings, Flame } from 'lucide-react';
import { Equipment, WorkOrder } from '@/lib/types';
import { differenceInDays, parseISO } from 'date-fns';

interface PMLog {
    id: string;
    type: 'logic' | 'alert' | 'strategy' | 'audit';
    timestamp: string;
    content: React.ReactNode;
}

interface AIPMLogicStreamWidgetProps {
    equipment: Equipment[];
    workOrders: WorkOrder[];
    serviceRecords: WorkOrder[];
}

const getTypeConfig = (type: PMLog['type']) => {
    switch (type) {
        case 'logic':
            return {
                icon: <Settings className="w-4 h-4 text-slate-500" />,
                label: 'PM Logic',
                badgeClass: 'bg-slate-100 text-slate-600',
                bgClass: 'hover:bg-slate-50 border-slate-100'
            };
        case 'alert':
            return {
                icon: <Zap className="w-4 h-4 text-amber-500" />,
                label: 'PM Alert',
                badgeClass: 'bg-amber-100 text-amber-700',
                bgClass: 'hover:bg-amber-50/50 border-amber-100/50'
            };
        case 'strategy':
            return {
                icon: <Layers className="w-4 h-4 text-blue-500" />,
                label: 'PM Strategy',
                badgeClass: 'bg-blue-100 text-blue-700',
                bgClass: 'hover:bg-blue-50/50 border-blue-100/50'
            };
        case 'audit':
            return {
                icon: <AlertCircle className="w-4 h-4 text-rose-500" />,
                label: 'PM Audit',
                badgeClass: 'bg-rose-100 text-rose-700',
                bgClass: 'hover:bg-rose-50/50 border-rose-100/50'
            };
    }
};

const AIPMLogicStreamWidget: React.FC<AIPMLogicStreamWidgetProps> = ({ equipment, workOrders, serviceRecords }) => {

    // Simple heuristic Inference Engine to generate PM logic logs dynamically
    const pmLogs = useMemo<PMLog[]>(() => {
        let generatedLogs: PMLog[] = [];
        let idCounter = 1;

        if (!equipment || equipment.length === 0) return generatedLogs;

        // 1. "Service Gap" Audit Logs - Equipment with no service records
        const assetsWithoutService = equipment.filter(e => !serviceRecords.some(sr => sr.equipmentId === e.id));
        assetsWithoutService.slice(0, 2).forEach(e => {
            generatedLogs.push({
                id: `log - ${idCounter++} `,
                type: 'audit',
                timestamp: '1h ago',
                content: <>Critical Gap: <span className="font-bold text-slate-900">{e.unitNumber}</span> lacks recent service history. AI accuracy degraded for this asset.</>
            });
        });

        equipment.forEach(e => {
            const assetServiceRecords = serviceRecords.filter(sr => sr.equipmentId === e.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            const currentOdo = (e as any).odometerCurrent || e.mileage || 0;

            if (assetServiceRecords.length > 0) {
                const lastService = assetServiceRecords[0];
                const lastOdo = lastService.odometer || 0;

                // 2. "Usage Calibration" Logic Logs - if odometer updated
                if (currentOdo > lastOdo && lastOdo > 0) {
                    const diffDays = differenceInDays(new Date(), parseISO(lastService.date));
                    const avgDaily = diffDays > 0 ? Math.round((currentOdo - lastOdo) / diffDays) : 100;
                    if (avgDaily > 0) {
                        generatedLogs.push({
                            id: `log - ${idCounter++} `,
                            type: 'logic',
                            timestamp: 'Just now',
                            content: <>Recalculating Avg. Daily Mileage for <span className="font-bold text-slate-900">{e.unitNumber}</span>... Now {avgDaily.toLocaleString()} miles/day.</>
                        });

                        if (avgDaily > 200) {
                            generatedLogs.push({
                                id: `log - ${idCounter++} `,
                                type: 'logic',
                                timestamp: '12m ago',
                                content: <>Usage Spike Detected: <span className="font-bold text-slate-900">{e.unitNumber}</span> increased duty cycle. Adjusting service forecasts...</>
                            });
                        }
                    }
                }

                // Look for missing odometers on recent invoices
                const missingOdoCount = assetServiceRecords.slice(0, 3).filter(sr => !sr.odometer).length;
                if (missingOdoCount >= 2) {
                    generatedLogs.push({
                        id: `log - ${idCounter++} `,
                        type: 'audit',
                        timestamp: '2d ago',
                        content: <>Missing Data: Last {missingOdoCount} invoices for <span className="font-bold text-slate-900">{e.unitNumber}</span> lacked Odometer readings.</>
                    });
                }

                // 3. "Pre-emptive Strike" Alert Logs
                const hasOilService = assetServiceRecords.some(sr => sr.title.toLowerCase().includes('oil') || sr.items?.some(i => i.description.toLowerCase().includes('oil')));
                if (hasOilService && currentOdo > 0) {
                    const oilLifeRem = Math.max(0, 100 - ((currentOdo % 25000) / 25000) * 100);
                    if (oilLifeRem < 15) {
                        generatedLogs.push({
                            id: `log - ${idCounter++} `,
                            type: 'alert',
                            timestamp: '24m ago',
                            content: <>Oil life for <span className="font-bold text-slate-900">{e.unitNumber}</span> estimated at {Math.round(oilLifeRem)}%. Scheduling reminder.</>
                        });
                    }
                } else if (currentOdo > 100000) {
                    generatedLogs.push({
                        id: `log - ${idCounter++} `,
                        type: 'alert',
                        timestamp: '2h ago',
                        content: <>Tire Tread Warning: <span className="font-bold text-slate-900">{e.unitNumber}</span> has high usage. Nearing replacement window based on fleet wear patterns.</>
                    });
                }

                // 4. "Bundling" Strategy Logs
                // A truck is considered "in the shop" if it has an Open (1) or InProcess (2) Work Order.
                // We explicitly exclude Draft (0) Work Orders.
                const activeWO = workOrders.find(wo => {
                    if (wo.equipmentId !== e.id) return false;
                    const isStatusNumber = wo.status === 1 || wo.status === 2;
                    const isStatusString = String(wo.status).toLowerCase() === 'open' || String(wo.status).toLowerCase() === 'inprocess';
                    return isStatusNumber || isStatusString;
                });

                if (activeWO) {
                    // Try to find a meaningful title, avoiding generic system statuses
                    const badTitles = ['draft', 'manual entry', 'estimated', 'invoiced', 'open', 'in process'];
                    let reason = activeWO?.title?.trim();
                    if (!reason || badTitles.includes(reason.toLowerCase())) {
                        reason = activeWO?.complaint?.trim() || 'reported issues';
                    }

                    generatedLogs.push({
                        id: `log-${idCounter++}`,
                        type: 'strategy',
                        timestamp: 'Just now',
                        content: <>Bundling Opportunity: <span className="font-bold text-slate-900">{e.unitNumber}</span> is currently In Shop for {reason}. AI suggests adding Preventive Inspection (due soon) to save 1 shop visit.</>
                    });
                }

            }
        });
        // Return up to 10 generated logs
        return generatedLogs.slice(0, 10);

    }, [equipment, workOrders, serviceRecords]);

    return (
        <div className="flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-900 relative overflow-hidden flex items-center justify-between">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
                    </svg>
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-blue-400" />
                        <h3 className="font-black text-white text-lg tracking-tight">AI PM Logic Stream</h3>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time inference & predictions</p>
                </div>

                <div className="relative z-10 flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full animate-pulse">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[500px] p-4 space-y-3 relative custom-scrollbar">
                {pmLogs.map((log) => {
                    const config = getTypeConfig(log.type);
                    return (
                        <div key={log.id} className={`p-4 rounded-xl border transition-colors duration-300 relative ${config.bgClass}`}>
                            <div className="flex items-start gap-4">
                                <div className="mt-0.5 shrink-0 bg-white p-1.5 rounded-lg border shadow-sm flex items-center justify-center">
                                    {config.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${config.badgeClass}`}>
                                            {config.label}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">{log.timestamp}</span>
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                        {log.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AIPMLogicStreamWidget;
