import React, { useMemo } from 'react';
import { WorkOrder, WorkOrderStatus } from '@/lib/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ClipboardList } from 'lucide-react';

interface WorkOrderStatusWidgetProps {
    workOrders: WorkOrder[];
}

const COLORS = {
    Open: '#3b82f6',      // blue-500
    InProcess: '#f59e0b', // amber-500
    Completed: '#10b981', // emerald-500
    Closed: '#6366f1',    // indigo-500
    Cancelled: '#ef4444', // red-500
    Draft: '#94a3b8',     // slate-400
    Paid: '#8b5cf6',      // violet-500
    Unknown: '#cbd5e1'    // slate-300
};

const WorkOrderStatusWidget: React.FC<WorkOrderStatusWidgetProps> = ({ workOrders }) => {

    const data = useMemo(() => {
        // Initialize with 0 for all standardized keys so they appear in legend
        const counts: Record<string, number> = {
            Open: 0,
            InProcess: 0,
            Completed: 0,
            Closed: 0,
            Cancelled: 0,
            Draft: 0,
            Paid: 0
        };

        workOrders.forEach(wo => {
            let statusKey = 'Unknown';
            if (typeof wo.status === 'number') {
                statusKey = WorkOrderStatus[wo.status] || 'Unknown';
            } else {
                statusKey = String(wo.status);
            }

            // Normalize to one of our known keys if possible
            if (counts.hasOwnProperty(statusKey)) {
                counts[statusKey] = (counts[statusKey] || 0) + 1;
            } else {
                // Fallback for unexpected values
                counts[statusKey] = (counts[statusKey] || 0) + 1;
            }
        });

        // Transform to array for Recharts
        const result = Object.entries(counts).map(([name, value]) => ({
            name: name.replace(/([A-Z])/g, ' $1').trim(), // "InProcess" -> "In Process"
            rawName: name, // for color lookup
            value
        }));

        // Sort by value desc
        return result.sort((a, b) => b.value - a.value);

    }, [workOrders]);

    const total = workOrders.length;

    return (
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col">
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <div className="bg-blue-50 p-2 rounded-lg">
                        <ClipboardList className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-black text-slate-900 text-xl tracking-tight">Work Order Volume</h3>
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest pl-1">
                    Breakdown by current status
                </p>
            </div>

            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative">

                {/* Left Column: Detailed Stats List */}
                <div className="space-y-4">
                    {data.map((item, index) => {
                        const colorKey = Object.keys(COLORS).find(k => k.toLowerCase() === item.rawName.toLowerCase()) || 'Unknown';
                        const color = (COLORS as any)[colorKey] || COLORS.Unknown;

                        return (
                            <div key={item.rawName} className="flex items-center justify-between group cursor-default">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                                    <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
                                        {item.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-black text-slate-900">{item.value}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                                    </span>
                                </div>
                            </div>
                        );
                    })}

                    {/* Summary Total Row */}
                    <div className="pt-4 mt-2 border-t border-slate-50 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-6">Total Work Orders</span>
                        <span className="text-2xl font-black text-slate-900">{total}</span>
                    </div>
                </div>

                {/* Right Column: Chart */}
                <div className="w-full h-64 relative">
                    {total === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm font-medium">
                            No active work orders
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                    cornerRadius={6}
                                >
                                    {data.map((entry, index) => {
                                        // Resolve color safely
                                        const colorKey = Object.keys(COLORS).find(k => k.toLowerCase() === entry.rawName.toLowerCase()) || 'Unknown';
                                        const color = (COLORS as any)[colorKey] || COLORS.Unknown;
                                        return <Cell key={`cell-${index}`} fill={color} />;
                                    })}
                                </Pie>
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px', backgroundColor: '#fff' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkOrderStatusWidget;
