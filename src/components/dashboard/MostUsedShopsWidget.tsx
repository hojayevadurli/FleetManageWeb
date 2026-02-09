import React, { useMemo } from 'react';
import { WorkOrder, WorkOrderStatus } from '@/lib/types';
import { Store, Clock, DollarSign, ChevronRight } from 'lucide-react';

interface MostUsedShopsWidgetProps {
    workOrders: WorkOrder[];
}

interface ShopStats {
    name: string;
    count: number;
    totalCost: number;
    totalDaysToClose: number;
    closedCount: number;
}

const MostUsedShopsWidget: React.FC<MostUsedShopsWidgetProps> = ({ workOrders }) => {

    const topShops = useMemo(() => {
        const stats: Record<string, ShopStats> = {};

        workOrders.forEach(wo => {
            // Skip if no vendor or cancelled
            if (!wo.vendor || wo.status === WorkOrderStatus.Cancelled) return;

            const vendorName = wo.vendor;

            if (!stats[vendorName]) {
                stats[vendorName] = {
                    name: vendorName,
                    count: 0,
                    totalCost: 0,
                    totalDaysToClose: 0,
                    closedCount: 0
                };
            }

            // Update Volume and Cost
            stats[vendorName].count += 1;
            stats[vendorName].totalCost += (wo.totalCost || 0);

            // Update Days to Close if applicable
            if (wo.closedAt && wo.date) {
                const start = new Date(wo.date).getTime();
                const end = new Date(wo.closedAt).getTime();
                if (!isNaN(start) && !isNaN(end) && end >= start) {
                    const days = (end - start) / (1000 * 60 * 60 * 24);
                    stats[vendorName].totalDaysToClose += days;
                    stats[vendorName].closedCount += 1;
                }
            }
        });

        // Convert to array and sort by count (volume) desc
        return Object.values(stats)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Top 5
    }, [workOrders]);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col h-full">
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <div className="bg-indigo-50 p-2 rounded-lg">
                        <Store className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="font-black text-slate-900 text-xl tracking-tight">Most Used Shops</h3>
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest pl-1">
                    Top 5 performing vendors
                </p>
            </div>

            <div className="space-y-4">
                {topShops.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 font-medium text-sm">
                        No vendor data available
                    </div>
                ) : (
                    topShops.map((shop, index) => {
                        const avgCost = shop.count > 0 ? shop.totalCost / shop.count : 0;
                        const avgDays = shop.closedCount > 0 ? shop.totalDaysToClose / shop.closedCount : 0;

                        return (
                            <div key={shop.name} className="group p-4 rounded-2xl bg-slate-50 border border-transparent hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all duration-300">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-[10px] font-black text-slate-600">
                                            {index + 1}
                                        </div>
                                        <span className="font-bold text-slate-900 truncate max-w-[150px]" title={shop.name}>
                                            {shop.name}
                                        </span>
                                    </div>
                                    <div className="text-xs font-black text-slate-400 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">
                                        {shop.count} WOs
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pl-9">
                                    <div className="flex items-center gap-1.5" title="Average Cost per WO">
                                        <DollarSign className="w-3 h-3 text-slate-400" />
                                        <span className="text-xs font-bold text-slate-600">
                                            {formatCurrency(avgCost)} <span className="text-[9px] text-slate-400 uppercase">Avg</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5" title="Average Days to Close">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        <span className="text-xs font-bold text-slate-600">
                                            Avg {avgDays > 0 ? avgDays.toFixed(1) : '-'} <span className="text-[9px] text-slate-400 uppercase">days ({shop.closedCount} WOs)</span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default MostUsedShopsWidget;
