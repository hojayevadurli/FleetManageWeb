import React from 'react';
import { Truck, AlertTriangle, DollarSign, ShieldCheck, ClipboardList, Zap, ChevronRight, ArrowRight } from 'lucide-react';
import { Equipment, EquipmentOperationalStatus, WorkOrder, WorkOrderStatus } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import AIPredictiveForecast from './AIPredictiveForecast';
import WorkOrderStatusWidget from './WorkOrderStatusWidget';
import MostUsedShopsWidget from './MostUsedShopsWidget';
import PartsVsLaborWidget from './PartsVsLaborWidget';

interface DashboardProps {
    equipment: Equipment[];
    workOrders: WorkOrder[];
    serviceRecords: WorkOrder[];
    onTabChange: (tab: string, status?: string, recordId?: string) => void;
}

const AnalyticsDashboard: React.FC<DashboardProps> = ({ equipment, workOrders, serviceRecords, onTabChange }) => {
    const totalFleet = equipment.length;
    const getStatus = (e: Equipment) => {
        const s = e.status;
        if (typeof s === 'number') return s;
        // String fallback
        return EquipmentOperationalStatus[s as keyof typeof EquipmentOperationalStatus] as unknown as EquipmentOperationalStatus;
    };

    const inShop = equipment.filter(e => getStatus(e) === EquipmentOperationalStatus.InShop).length;
    const activeUnits = equipment.filter(e => getStatus(e) === EquipmentOperationalStatus.Active).length;
    const soldUnits = equipment.filter(e => getStatus(e) === EquipmentOperationalStatus.Sold).length;

    // Work orders logic (active rescues/breakdowns)
    // Note: WorkOrder interface in types.ts HAS isRoadside, but the API DTO might not.
    const breakdowns = workOrders.filter(wo => (wo as any).isRoadside && wo.status !== WorkOrderStatus.Completed);

    // Maintenance Spend from Service Records
    const totalSpend = serviceRecords.reduce((acc, sr) => acc + (sr.totalCost || 0), 0);

    const statusData = [
        { name: 'Active', value: activeUnits, color: '#10b981' }, // emerald-500
        { name: 'In Shop', value: inShop, color: '#f59e0b' },   // amber-500
        { name: 'OOS', value: totalFleet - activeUnits - inShop - soldUnits, color: '#f43f5e' }, // rose-500
        { name: 'Sold', value: soldUnits, color: '#64748b' },   // slate-500
    ];

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Fleet Performance Center</h1>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                        Track work, control costs, and answer questions about your fleet
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div
                    onClick={() => onTabChange('equipment', EquipmentOperationalStatus.Active.toString())}
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:shadow-lg hover:border-blue-100 transition-all duration-300"
                >
                    <div className="flex items-center gap-6">
                        <div className="bg-blue-600 p-4 rounded-2xl shadow-xl shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                            <Truck className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Available Assets</div>
                            <div className="text-3xl font-black text-slate-900 tracking-tight">{activeUnits}/{totalFleet} <span className="text-sm font-bold text-slate-300 ml-1">Units</span></div>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>

                <div
                    onClick={() => onTabChange('equipment', EquipmentOperationalStatus.InShop.toString())}
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:shadow-lg hover:border-amber-100 transition-all duration-300"
                >
                    <div className="flex items-center gap-6">
                        <div className="bg-[#fbbf24] p-4 rounded-2xl shadow-xl shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300">
                            <AlertTriangle className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-3xl font-black text-[#fbbf24] tracking-tight">{inShop} <span className="text-sm font-bold text-slate-300 ml-1">In Shop</span></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:shadow-lg hover:border-slate-200 transition-all duration-300">
                    <div className="flex items-center gap-6">
                        <div className="bg-slate-900 p-4 rounded-2xl shadow-xl shadow-slate-900/20 group-hover:scale-105 transition-transform duration-300">
                            <DollarSign className="text-white w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-1">Maintenance Spend</div>
                            <div className="text-3xl font-black text-slate-900 tracking-tight">${totalSpend.toLocaleString()} <span className="text-sm font-bold text-slate-300 ml-1">Total</span></div>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm min-h-[450px]">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="font-black text-slate-900 text-xl tracking-tight">Asset Readiness Overview</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Daily snapshot of fleet capacity and shop congestion.</p>
                            </div>
                        </div>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%" debounce={100}>
                                <BarChart data={statusData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fontWeight: 900, fill: '#94a3b8', textAnchor: 'middle' }}
                                        dy={15}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fontWeight: 900, fill: '#94a3b8' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                    />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={50}>
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {breakdowns.length > 0 && (
                        <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-rose-500 animate-pulse" />
                                    <h3 className="font-black text-rose-900 uppercase text-xs tracking-widest">Urgent Roadside Events</h3>
                                </div>
                                <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">{breakdowns.length} Active Rescue(s)</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {breakdowns.map(wo => (
                                    <div key={wo.id} onClick={() => onTabChange('work-orders')} className="bg-white p-4 rounded-xl border border-rose-200 flex items-center justify-between cursor-pointer hover:bg-rose-50/50 transition-colors">
                                        <div>
                                            <div className="text-sm font-black text-slate-900">{equipment.find(e => e.id === wo.equipmentId)?.unitNumber || 'Unit'}</div>
                                            <div className="text-[10px] text-rose-500 font-bold uppercase tracking-tight">N/A</div>
                                        </div>
                                        <div className="bg-rose-500 p-2 rounded-lg">
                                            <ArrowRight className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Work Order Status Analytics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <WorkOrderStatusWidget workOrders={workOrders} />
                        <PartsVsLaborWidget workOrders={workOrders} />
                    </div>

                    {/* Most Used Shops Widget */}
                    <div className="mt-6">
                        <MostUsedShopsWidget workOrders={workOrders} />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-black text-slate-900 text-xl tracking-tight">AI Forecast</h3>
                                <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-[8px] h-4">Beta</Badge>
                            </div>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Predictive Health & Event Foresight</p>
                        </div>
                        <AIPredictiveForecast />
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
                        <div className="mb-8">
                            <h3 className="font-black text-slate-900 text-xl tracking-tight">AI Log Stream</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Recent maintenance audits completed by AI.</p>
                        </div>
                        <div className="space-y-4 flex-1">
                            {serviceRecords
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .slice(0, 10)
                                .map((sr) => {
                                    const vendorDisplay = (sr as any).vendor || (sr as any).vendorName || 'Unknown Vendor';
                                    const woNumber = sr.woNumber || 'N/A';
                                    const title = sr.title || 'Untitled Work Order';

                                    // Fix: Resolve status to string if it's a number (Enum)
                                    const statusRaw = sr.status;
                                    let statusLabel = String(statusRaw);
                                    if (typeof statusRaw === 'number') {
                                        statusLabel = WorkOrderStatus[statusRaw] || 'Unknown';
                                    }

                                    const statusLower = statusLabel.toLowerCase();
                                    const statusColor = statusLower === 'closed' || statusLower === 'completed' || statusLower === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                                        statusLower === 'open' || statusLower === 'inprocess' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600';

                                    return (
                                        <div key={sr.id} onClick={() => onTabChange('service', undefined, sr.id)} className="flex items-center gap-4 p-4 rounded-2xl bg-[#f8fafc] border border-transparent hover:border-blue-200 hover:bg-white hover:shadow-md transition-all duration-300 cursor-pointer group">
                                            <div className="bg-white p-3 rounded-xl border border-slate-100 group-hover:bg-blue-600 group-hover:border-blue-600 transition-all duration-300">
                                                <ClipboardList className="w-5 h-5 text-slate-400 group-hover:text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded tracking-tight">{woNumber}</span>
                                                    <span className="text-xs font-bold text-slate-900 truncate" title={title}>{title}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate mt-1">{vendorDisplay}</div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="text-sm font-black text-slate-900 tracking-tight">${(sr.totalCost || 0).toLocaleString()}</div>
                                                <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md mt-1 inline-block ${statusColor}`}>
                                                    {statusLabel}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                        </div>
                        <button
                            onClick={() => onTabChange('service')}
                            className="w-full mt-8 py-4 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-slate-50 hover:text-slate-900 transition-all duration-300"
                        >
                            View All Audits
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
