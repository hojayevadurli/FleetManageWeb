import React, { useMemo } from 'react';
import { WorkOrder, WorkOrderItem } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, DollarSign, Calendar, PieChart as PieChartIcon, BarChart3, AlertCircle } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area
} from 'recharts';
import { format, subDays, startOfMonth, parseISO, differenceInMonths } from 'date-fns';

interface SpendAnalyticsProps {
    data: WorkOrder[];
    equipmentInServiceDate?: string;
    onAddRecord?: () => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const SpendAnalytics: React.FC<SpendAnalyticsProps> = ({ data, equipmentInServiceDate, onAddRecord }) => {
    // 1. Core Metrics Calculation
    const metrics = useMemo(() => {
        const totalSpend = data.reduce((sum, wo) => sum + (wo.totalCost || 0), 0);

        // Last 30 Days
        const thirtyDaysAgo = subDays(new Date(), 30);
        const last30DaysSpend = data
            .filter(wo => new Date(wo.date) >= thirtyDaysAgo)
            .reduce((sum, wo) => sum + (wo.totalCost || 0), 0);

        // Average Monthly Spend
        let monthsActive = 1;
        if (equipmentInServiceDate) {
            monthsActive = Math.max(1, differenceInMonths(new Date(), parseISO(equipmentInServiceDate)));
        } else if (data.length > 0) {
            // Fallback: Use first WO date
            const sortedDates = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            monthsActive = Math.max(1, differenceInMonths(new Date(), new Date(sortedDates[0].date)));
        }
        const avgMonthly = totalSpend / monthsActive;

        return { totalSpend, last30DaysSpend, avgMonthly };
    }, [data, equipmentInServiceDate]);

    // 2. Data Processing for Charts

    // Helper: Derive Category from WO
    const getCategory = (wo: WorkOrder): string => {
        // Strategy: expensive item type > title keyword > default
        if (wo.items && wo.items.length > 0) {
            const mostExpensive = [...wo.items].sort((a, b) => b.cost - a.cost)[0];
            if (mostExpensive.serviceType) return mostExpensive.serviceType;
        }

        const title = (wo.title || '').toLowerCase();
        if (title.includes('oil') || title.includes('pm') || title.includes('service')) return 'PM Service';
        if (title.includes('tire') || title.includes('brake')) return 'Wearables';
        if (title.includes('inspection')) return 'Inspection';
        if (title.includes('engine') || title.includes('transmission')) return 'Powertrain';

        return 'General Repair';
    };

    const chartData = useMemo(() => {
        // A. Category Breakdown
        const categoryMap = new Map<string, number>();
        // B. Vendor Breakdown
        const vendorMap = new Map<string, number>();
        // C. Monthly Trend
        const monthlyMap = new Map<string, number>();

        data.forEach(wo => {
            const cost = wo.totalCost || 0;

            // Category
            const cat = getCategory(wo);
            categoryMap.set(cat, (categoryMap.get(cat) || 0) + cost);

            // Vendor
            const vendor = wo.vendor || wo.vendorId || 'Unknown Vendor';
            vendorMap.set(vendor, (vendorMap.get(vendor) || 0) + cost);

            // Monthly
            const monthKey = format(parseISO(wo.date), 'MMM yyyy');
            monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + cost);
        });

        // Transform to Arrays
        const categoryData = Array.from(categoryMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // Descending

        const vendorData = Array.from(vendorMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5 only

        // Sort monthly correctly based on time, not string
        const monthlyData = Array.from(monthlyMap.entries())
            .map(([name, value]) => ({
                name,
                value,
                // Keep a sortable date for ordering
                date: parseISO(data.find(d => format(parseISO(d.date), 'MMM yyyy') === name)?.date || new Date().toISOString())
            }))
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map(({ name, value }) => ({ name, value }));

        return { categoryData, vendorData, monthlyData };
    }, [data]);


    // 3. Empty State Handling
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm p-16 text-center animate-in fade-in zoom-in duration-300">
                <div className="bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <BarChart3 className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">No Spend Data Yet</h3>
                <p className="text-slate-500 font-medium max-w-md mx-auto mb-8 leading-relaxed">
                    Add your first work order or service record to unlock powerful financial insights and tracking for this unit.
                </p>
                {onAddRecord && (
                    <Button
                        size="lg"
                        onClick={onAddRecord}
                        className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add First Record
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-300">

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Spend */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-bl-full blur-2xl pointer-events-none group-hover:bg-blue-500/30 transition-all"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-slate-800 rounded-xl">
                                <DollarSign className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lifetime Spend</span>
                        </div>
                        <div className="text-4xl font-black tracking-tighter mb-1">
                            ${metrics.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Total cost of ownership</p>
                    </div>
                </div>

                {/* L30D Spend */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-50 rounded-xl">
                            <Calendar className="w-5 h-5 text-emerald-500" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last 30 Days</span>
                    </div>
                    <div className="text-4xl font-black tracking-tighter mb-1 text-slate-900">
                        ${metrics.last30DaysSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Recent maintenance activity</p>
                </div>

                {/* Avg Monthly */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-50 rounded-xl">
                            <TrendingUp className="w-5 h-5 text-purple-500" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Monthly Avg</span>
                    </div>
                    <div className="text-4xl font-black tracking-tighter mb-1 text-slate-900">
                        ${metrics.avgMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Estimated burn rate</p>
                </div>
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* Monthly Trend (Line Chart) */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm xl:col-span-2">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Spending Trend</h3>
                            <p className="text-xs text-slate-500 font-medium">Monthly cost aggregation over time</p>
                        </div>
                        {/* AI Insight Badge */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                            <SparklesIcon className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">AI Insight: {metrics.last30DaysSpend > metrics.avgMonthly ? 'Spending is above average' : 'Spending is stable'}</span>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData.monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 600 }}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Spend']}
                                />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Breakdown (Bar Chart) */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 mb-1">Spend by Category</h3>
                    <p className="text-xs text-slate-500 font-medium mb-8">Cost distribution across service types</p>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.categoryData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    width={100}
                                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total']}
                                />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                                    {chartData.categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Vendor Breakdown (Pie Chart) */}
                <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 mb-1">Top Vendors</h3>
                    <p className="text-xs text-slate-500 font-medium mb-8">Highest spend service providers</p>
                    <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData.vendorData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.vendorData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Spent']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Custom Legend logic could go here, or rely on tooltips for cleaner look */}
                        <div className="absolute bottom-0 w-full flex justify-center gap-4 flex-wrap">
                            {chartData.vendorData.slice(0, 3).map((entry, index) => (
                                <div key={index} className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[80px]">{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

// Internal icon for the badge
const SparklesIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715l.805-2.525a4.5 4.5 0 012.62-2.62l2.525-.805-2.525-.805a4.5 4.5 0 01-2.62-2.62l-.805-2.525-.805 2.525a4.5 4.5 0 01-2.62 2.62l-2.525.805 2.525.805a4.5 4.5 0 012.62 2.62l.805 2.525z" />
    </svg>
);


export default SpendAnalytics;
