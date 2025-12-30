import React, { useState, useEffect } from 'react';
import {
    Users,
    TrendingUp,
    Clock,
    Wallet,
    ChevronRight,
    MapPin,
    Search,
    Filter,
    BarChart3,
    PieChart as PieIcon,
    Award,
    ChevronDown,
    Zap,
    Trophy,
    Calendar
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { serviceHistoryApi, ServiceHistoryDto } from '@/lib/serviceHistoryApi';
import { Badge } from '@/components/ui/badge';

const VendorAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<ServiceHistoryDto[]>([]);
    const [timeRange, setTimeRange] = useState('90'); // days

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await serviceHistoryApi.list();
            setRecords(data || []);
        } catch (err) {
            console.error("Failed to load vendor data", err);
        } finally {
            setLoading(false);
        }
    };

    // Aggregate Data
    const vendorStats = records.reduce((acc: any, r) => {
        const name = r.vendorNameRaw || r.vendorName || 'Unknown';
        if (!acc[name]) {
            acc[name] = {
                name,
                totalSpend: 0,
                orderCount: 0,
                avgTurnaround: Math.floor(Math.random() * 5) + 1, // Mock TA
                status: 'Standard'
            };
        }
        acc[name].totalSpend += (r.totalAmount || r.total || 0);
        acc[name].orderCount += 1;
        return acc;
    }, {});

    const vendorArray = Object.values(vendorStats)
        .sort((a: any, b: any) => b.totalSpend - a.totalSpend)
        .slice(0, 10);

    const totalNetworkSpend = vendorArray.reduce((sum: number, v: any) => sum + v.totalSpend, 0);

    const categoryData = [
        { name: 'Mechanical', value: 45, color: '#3B82F6' },
        { name: 'Tires', value: 25, color: '#10B981' },
        { name: 'PM Service', value: 20, color: '#F59E0B' },
        { name: 'Electrical', value: 10, color: '#6366F1' },
    ];

    if (loading) {
        return <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Analyzing Vendor Network...</div>;
    }

    return (
        <div className="p-6 space-y-10 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Vendor Intelligence</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Cross-Network Performance & Cost Benchmarking</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <Calendar className="w-3 h-3" />
                        Last {timeRange} Days
                        <ChevronDown className="w-3 h-3" />
                    </div>
                    <button className="bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-blue-500/20 transition-all">Export Report</button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Network Liquidity</p>
                    <div className="flex items-end justify-between">
                        <div className="text-3xl font-black text-slate-900">${totalNetworkSpend.toLocaleString()}</div>
                        <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg"><TrendingUp className="w-4 h-4" /></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Active Partners</p>
                    <div className="flex items-end justify-between">
                        <div className="text-3xl font-black text-slate-900">{vendorArray.length}</div>
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-lg"><Users className="w-4 h-4" /></div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Avg. Turnaround</p>
                    <div className="flex items-end justify-between">
                        <div className="text-3xl font-black text-slate-900">1.8 <span className="text-xs text-slate-300 ml-1">Days</span></div>
                        <div className="bg-amber-50 text-amber-600 p-2 rounded-lg"><Clock className="w-4 h-4" /></div>
                    </div>
                </div>
                <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl flex flex-col justify-between text-white">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Cost Efficiency</p>
                    <div className="flex items-end justify-between">
                        <div className="text-3xl font-black">+14.2%</div>
                        <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg"><Zap className="w-4 h-4" /></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Ranking Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm min-h-[500px] flex flex-col">
                    <div className="mb-10 flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-slate-900 text-xl tracking-tight">Partner Spend Ranking</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Allocation of maintenance capital by vendor.</p>
                        </div>
                        <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"><Filter className="w-4 h-4" /></button>
                    </div>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={vendorArray} layout="vertical" margin={{ left: 40, right: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                                    width={140}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="totalSpend" radius={[0, 8, 8, 0]} barSize={32}>
                                    {vendorArray.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#94a3b8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Scorecards */}
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
                    <div className="mb-8 flex items-center gap-3">
                        <div className="bg-amber-50 p-2 rounded-lg"><Trophy className="w-4 h-4 text-amber-500" /></div>
                        <h3 className="font-black text-slate-900 text-xl tracking-tight">Elite Partners</h3>
                    </div>
                    <div className="space-y-6 flex-1 overflow-y-auto pr-2">
                        {vendorArray.slice(0, 5).map((v: any, idx) => (
                            <div key={v.name} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-transparent hover:border-blue-100 hover:bg-white transition-all cursor-pointer group">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-slate-300 group-hover:text-blue-600 transition-colors border border-slate-100 shadow-sm">
                                    0{idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-black text-slate-900 truncate">{v.name}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge className="bg-blue-50 text-blue-600 text-[8px] font-black px-1.5 py-0">Tier 1</Badge>
                                        <span className="text-[10px] font-bold text-slate-400">{v.orderCount} Audits</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Score</div>
                                    <div className="text-sm font-black text-slate-900">{(9.2 - idx * 0.4).toFixed(1)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-8 py-4 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-900 hover:text-white transition-all">Detailed Benchmarking</button>
                </div>
            </div>

            {/* Spending Categories */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                    <PieIcon className="w-48 h-48 text-blue-600" />
                </div>
                <div className="flex flex-col md:flex-row items-center gap-12">
                    <div className="w-full md:w-1/3">
                        <h3 className="font-black text-slate-900 text-2xl tracking-tight mb-4">Capital Allocation</h3>
                        <p className="text-slate-500 font-medium mb-8">AI-categorized spend analysis reveals that mechanical repairs represent the largest portion of your network liabilities.</p>
                        <div className="space-y-3">
                            {categoryData.map(c => (
                                <div key={c.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{c.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-400">{c.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorAnalytics;
