import { WorkOrderDto, WorkOrderStatus } from "@/lib/types";
import { Wrench, CheckCircle2, AlertTriangle, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ServiceMetricsProps {
    workOrders: WorkOrderDto[];
}

const ServiceMetrics = ({ workOrders }: ServiceMetricsProps) => {
    // 1. Open Orders
    const openOrders = workOrders.filter(w =>
        [WorkOrderStatus.Draft, WorkOrderStatus.Open, WorkOrderStatus.InProcess].includes((w.status as any))
        || ["draft", "open", "inprocess"].includes(String(w.status || "").toLowerCase())
    ).length;

    // 2. Completed This Month (Simple Logic: Completed status)
    // For "This Month", we'd filter by closedAt/openedAt, but for now let's just count ALL Completed/Closed/Paid
    const completedOrders = workOrders.filter(w =>
        [WorkOrderStatus.Completed, WorkOrderStatus.Closed, WorkOrderStatus.Paid].includes((w.status as any))
        || ["completed", "closed", "paid"].includes(String(w.status || "").toLowerCase())
    ).length;

    // 3. Total Spent
    const totalSpent = workOrders.reduce((sum, w) => {
        return sum + (w.manualActualTotal || w.estimatedTotal || 0);
    }, 0);

    // 4. Overdue (Placeholder logic: Open status > 7 days old)
    const overdueOrders = workOrders.filter(w => {
        const isOpen = [WorkOrderStatus.Open, WorkOrderStatus.InProcess].includes(w.status as any)
            || ["open", "inprocess"].includes(String(w.status || "").toLowerCase());
        if (!isOpen) return false;
        const opened = new Date(w.openedAt);
        const now = new Date();
        const diff = now.getTime() - opened.getTime();
        const days = diff / (1000 * 3600 * 24);
        return days > 7;
    }).length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Metric 1: Open Work Orders */}
            <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Open Orders</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900">{openOrders}</span>
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
                        </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <Wrench className="h-6 w-6" />
                    </div>
                </CardContent>
            </Card>

            {/* Metric 2: Completed */}
            <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Completed</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900">{completedOrders}</span>
                            <span className="text-xs font-bold text-slate-400">Total</span>
                        </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                </CardContent>
            </Card>

            {/* Metric 3: Overdue (Age > 7 days) */}
            <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Attention Needed</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900">{overdueOrders}</span>
                            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">&gt; 7 Days</span>
                        </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                </CardContent>
            </Card>

            {/* Metric 4: Total Cost */}
            <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Spent</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-900">
                                ${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <DollarSign className="h-6 w-6" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ServiceMetrics;
