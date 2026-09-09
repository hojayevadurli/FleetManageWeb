import React, { useMemo, useState } from 'react';
import { WorkOrder } from '@/lib/types';
import { TollRecord } from '@/lib/tollsApi';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingUp, DollarSign, Calendar, BarChart3, Receipt } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { format, subDays, parseISO, differenceInMonths, startOfMonth, endOfMonth, eachMonthOfInterval, min, max } from 'date-fns';

interface SpendAnalyticsProps {
    data: WorkOrder[];
    tollRecords?: TollRecord[];
    equipmentInServiceDate?: string;
    onAddRecord?: () => void;
}

const PERIOD_OPTIONS = [
    { label: 'Last 30 days',  value: '30'  },
    { label: 'Last 90 days',  value: '90'  },
    { label: 'Last 12 months', value: '365' },
    { label: 'All time',      value: 'all' },
];

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const fmt$ = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const SpendAnalytics: React.FC<SpendAnalyticsProps> = ({ data, tollRecords = [], equipmentInServiceDate, onAddRecord }) => {
    const [period, setPeriod] = useState('365');

    // ── Date cutoff ─────────────────────────────────────────────────────────
    const since: Date | null = useMemo(() => {
        if (period === 'all') return null;
        return subDays(new Date(), Number(period));
    }, [period]);

    // ── Filter by period ─────────────────────────────────────────────────────
    const filteredWOs = useMemo(() =>
        since ? data.filter(wo => new Date(wo.date) >= since) : data
    , [data, since]);

    const filteredTolls = useMemo(() =>
        since ? tollRecords.filter(r => new Date(r.tripDate) >= since) : tollRecords
    , [tollRecords, since]);

    // ── Core totals ──────────────────────────────────────────────────────────
    const maintenanceTotal = useMemo(() => filteredWOs.reduce((s, wo) => s + (wo.totalCost || 0), 0), [filteredWOs]);
    const tollTotal        = useMemo(() => filteredTolls.reduce((s, r) => s + r.totalCostCash, 0), [filteredTolls]);
    const combinedTotal    = maintenanceTotal + tollTotal;

    // Lifetime (all time regardless of period selector)
    const lifetimeMaint = useMemo(() => data.reduce((s, wo) => s + (wo.totalCost || 0), 0), [data]);
    const lifetimeTolls = useMemo(() => tollRecords.reduce((s, r) => s + r.totalCostCash, 0), [tollRecords]);
    const lifetimeTotal = lifetimeMaint + lifetimeTolls;

    // Monthly avg
    const monthsActive = useMemo(() => {
        if (equipmentInServiceDate) return Math.max(1, differenceInMonths(new Date(), parseISO(equipmentInServiceDate)));
        const allDates = [
            ...data.map(wo => new Date(wo.date)),
            ...tollRecords.map(r => new Date(r.tripDate))
        ];
        if (allDates.length === 0) return 1;
        return Math.max(1, differenceInMonths(new Date(), min(allDates)));
    }, [data, tollRecords, equipmentInServiceDate]);

    const avgMonthly = lifetimeTotal / monthsActive;

    // ── Monthly trend (stacked) ───────────────────────────────────────────────
    const monthlyData = useMemo(() => {
        const allDates = [
            ...filteredWOs.map(wo => new Date(wo.date)),
            ...filteredTolls.map(r => new Date(r.tripDate))
        ];
        if (allDates.length === 0) return [];

        const earliest = min(allDates);
        const latest   = new Date();
        const months   = eachMonthOfInterval({ start: startOfMonth(earliest), end: startOfMonth(latest) });

        return months.map(monthStart => {
            const label = format(monthStart, 'MMM yy');
            const mEnd  = endOfMonth(monthStart);

            const maint = filteredWOs
                .filter(wo => { const d = new Date(wo.date); return d >= monthStart && d <= mEnd; })
                .reduce((s, wo) => s + (wo.totalCost || 0), 0);

            const tolls = filteredTolls
                .filter(r => { const d = new Date(r.tripDate); return d >= monthStart && d <= mEnd; })
                .reduce((s, r) => s + r.totalCostCash, 0);

            return { name: label, Maintenance: Math.round(maint), Tolls: Math.round(tolls) };
        });
    }, [filteredWOs, filteredTolls]);

    // ── Category breakdown ────────────────────────────────────────────────────
    const getCategory = (wo: WorkOrder): string => {
        if (wo.items?.length) {
            const top = [...wo.items].sort((a, b) => b.cost - a.cost)[0];
            if (top.serviceType) return top.serviceType;
        }
        const t = (wo.title || '').toLowerCase();
        if (t.includes('oil') || t.includes('pm') || t.includes('service')) return 'PM Service';
        if (t.includes('tire') || t.includes('brake')) return 'Wearables';
        if (t.includes('inspection')) return 'Inspection';
        if (t.includes('engine') || t.includes('transmission')) return 'Powertrain';
        return 'General Repair';
    };

    const categoryData = useMemo(() => {
        const map = new Map<string, number>();
        filteredWOs.forEach(wo => {
            const cat = getCategory(wo);
            map.set(cat, (map.get(cat) || 0) + (wo.totalCost || 0));
        });
        if (tollTotal > 0) map.set('Tolls', tollTotal);
        return Array.from(map.entries())
            .map(([name, value]) => ({ name, value: Math.round(value) }))
            .sort((a, b) => b.value - a.value);
    }, [filteredWOs, tollTotal]);

    // ── Vendor breakdown ──────────────────────────────────────────────────────
    const vendorData = useMemo(() => {
        const map = new Map<string, number>();
        filteredWOs.forEach(wo => {
            const v = wo.vendor || wo.vendorId || 'Unknown';
            map.set(v, (map.get(v) || 0) + (wo.totalCost || 0));
        });
        return Array.from(map.entries())
            .map(([name, value]) => ({ name, value: Math.round(value) }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [filteredWOs]);

    const hasData = data.length > 0 || tollRecords.length > 0;

    if (!hasData) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 md:p-12 text-center animate-in fade-in zoom-in duration-300">
                <div className="bg-slate-50 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-inner">
                    <BarChart3 className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">No Spend Data Yet</h3>
                <p className="text-slate-500 font-medium max-w-md mx-auto mb-6 leading-relaxed text-sm">
                    Add work orders or toll records to unlock financial insights for this unit.
                </p>
                {onAddRecord && (
                    <Button onClick={onAddRecord} className="h-11 px-6 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Add First Record
                    </Button>
                )}
            </div>
        );
    }

    const maintPct = combinedTotal > 0 ? (maintenanceTotal / combinedTotal) * 100 : 0;
    const tollPct  = combinedTotal > 0 ? (tollTotal  / combinedTotal) * 100 : 0;

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-300">

            {/* Period selector */}
            <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">Expense Summary</h3>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="h-9 w-[160px] bg-white border-slate-200 text-sm font-medium rounded-lg">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {PERIOD_OPTIONS.map(o => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* KPI tiles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Lifetime */}
                <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-bl-full blur-2xl pointer-events-none group-hover:bg-blue-500/30 transition-all" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-slate-800 rounded-xl"><DollarSign className="w-5 h-5 text-blue-400" /></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lifetime Spend</span>
                        </div>
                        <div className="text-3xl font-black tracking-tighter mb-1">{fmt$(lifetimeTotal)}</div>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] text-blue-300 font-bold">Maint {fmt$(lifetimeMaint)}</span>
                            <span className="text-slate-700">·</span>
                            <span className="text-[10px] text-amber-300 font-bold">Tolls {fmt$(lifetimeTolls)}</span>
                        </div>
                    </div>
                </div>

                {/* Period spend */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-50 rounded-xl"><Calendar className="w-5 h-5 text-emerald-500" /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {PERIOD_OPTIONS.find(o => o.value === period)?.label ?? 'Period'}
                        </span>
                    </div>
                    <div className="text-3xl font-black tracking-tighter mb-1 text-slate-900">{fmt$(combinedTotal)}</div>
                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-blue-600 font-bold">Maint {fmt$(maintenanceTotal)}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-[10px] text-amber-600 font-bold">Tolls {fmt$(tollTotal)}</span>
                    </div>
                </div>

                {/* Monthly avg */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-50 rounded-xl"><TrendingUp className="w-5 h-5 text-purple-500" /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Avg</span>
                    </div>
                    <div className="text-3xl font-black tracking-tighter mb-1 text-slate-900">{fmt$(avgMonthly)}</div>
                    <p className="text-xs text-slate-500 font-medium">Combined burn rate</p>
                </div>
            </div>

            {/* Maintenance vs Tolls breakdown bar */}
            {combinedTotal > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Cost Breakdown</p>
                        <p className="text-xs text-slate-400">{PERIOD_OPTIONS.find(o => o.value === period)?.label}</p>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                                    <span className="text-sm font-bold text-slate-700">Maintenance</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-black text-slate-900">{fmt$(maintenanceTotal)}</span>
                                    <span className="text-xs text-slate-400 ml-2">{maintPct.toFixed(0)}%</span>
                                </div>
                            </div>
                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${maintPct}%` }} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                                    <span className="text-sm font-bold text-slate-700">Tolls</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-black text-slate-900">{fmt$(tollTotal)}</span>
                                    <span className="text-xs text-slate-400 ml-2">{tollPct.toFixed(0)}%</span>
                                </div>
                            </div>
                            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${tollPct}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Monthly trend — stacked */}
            {monthlyData.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-black text-slate-900">Spending Trend</h3>
                            <p className="text-xs text-slate-500 font-medium">Monthly maintenance + toll costs</p>
                        </div>
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                            <SparklesIcon className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                                {combinedTotal > avgMonthly ? 'Above avg period' : 'Spending stable'}
                            </span>
                        </div>
                    </div>
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gMaint" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.7} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gToll" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.7} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false}
                                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false}
                                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                                    tickFormatter={v => `$${v}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                                />
                                <Legend iconType="square" iconSize={8}
                                    formatter={v => <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{v}</span>} />
                                <Area type="monotone" dataKey="Maintenance" stackId="1"
                                    stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#gMaint)" />
                                <Area type="monotone" dataKey="Tolls" stackId="1"
                                    stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#gToll)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Bottom charts row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

                {/* Category breakdown */}
                {categoryData.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-base font-black text-slate-900 mb-1">Spend by Category</h3>
                        <p className="text-xs text-slate-500 font-medium mb-6">Cost distribution across service types + tolls</p>
                        <div className="h-[260px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 30, left: 50, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false}
                                        width={80} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total']} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28}>
                                        {categoryData.map((entry, i) => (
                                            <Cell key={i} fill={entry.name === 'Tolls' ? '#f59e0b' : COLORS[i % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Top vendors */}
                {vendorData.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-base font-black text-slate-900 mb-1">Top Vendors</h3>
                        <p className="text-xs text-slate-500 font-medium mb-6">Highest spend service providers</p>
                        <div className="h-[260px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={vendorData} cx="50%" cy="50%"
                                        innerRadius={55} outerRadius={90} paddingAngle={5} dataKey="value">
                                        {vendorData.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Spent']} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute bottom-0 w-full flex justify-center gap-3 flex-wrap">
                                {vendorData.slice(0, 3).map((e, i) => (
                                    <div key={i} className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[80px]">{e.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const SparklesIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715l.805-2.525a4.5 4.5 0 012.62-2.62l2.525-.805-2.525-.805a4.5 4.5 0 01-2.62-2.62l-.805-2.525-.805 2.525a4.5 4.5 0 01-2.62 2.62l-2.525.805 2.525.805a4.5 4.5 0 012.62 2.62l.805 2.525z" />
    </svg>
);

export default SpendAnalytics;
