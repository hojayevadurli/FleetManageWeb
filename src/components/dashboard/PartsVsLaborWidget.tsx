import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkOrder, WorkOrderStatus } from '@/lib/types';
import { DollarSign } from 'lucide-react';

interface PartsVsLaborWidgetProps {
  workOrders: WorkOrder[];
}

const PartsVsLaborWidget: React.FC<PartsVsLaborWidgetProps> = ({ workOrders }) => {

  const { partsTotal, laborTotal, grandTotal } = useMemo(() => {
    // Only aggregate costs for completed/paid/closed work orders for accuracy? 
    // Or filter out drafts and cancelled. Let's include everything that has costs.
    const validOrders = workOrders.filter(wo =>
      wo.status !== WorkOrderStatus.Draft &&
      wo.status !== WorkOrderStatus.Cancelled
    );

    let pTotal = 0;
    let lTotal = 0;
    let gTotal = 0;

    validOrders.forEach(wo => {
      pTotal += (wo.partsCost || 0);
      lTotal += (wo.laborCost || 0);
      gTotal += (wo.totalCost || 0);
    });

    return { partsTotal: pTotal, laborTotal: lTotal, grandTotal: gTotal };
  }, [workOrders]);

  // Handle case where total is 0 to avoid division by zero
  const safeGrandTotal = grandTotal > 0 ? grandTotal : 1;
  const partsPercent = Math.min(100, Math.round((partsTotal / safeGrandTotal) * 100));
  const laborPercent = Math.min(100, Math.round((laborTotal / safeGrandTotal) * 100));

  // If there are other fees/taxes, they make up the rest.
  const otherTotal = grandTotal - partsTotal - laborTotal;
  const otherPercent = Math.max(0, 100 - partsPercent - laborPercent);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Parts vs. Labor Cost Breakdown
        </CardTitle>
        <CardDescription>Aggregate costs across all active maintenance records</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Visual Progress Bar */}
        <div className="flex flex-col gap-2">
            <div className="flex h-4 w-full rounded-full overflow-hidden bg-slate-100 flex-row">
                {partsTotal > 0 && <div style={{ width: `${partsPercent}%` }} className="bg-blue-500 hover:brightness-110 transition-all" title={`Parts: $${partsTotal.toLocaleString()}`} />}
                {laborTotal > 0 && <div style={{ width: `${laborPercent}%` }} className="bg-indigo-500 hover:brightness-110 transition-all" title={`Labor: $${laborTotal.toLocaleString()}`} />}
                {otherTotal > 0 && <div style={{ width: `${otherPercent}%` }} className="bg-slate-300 hover:brightness-110 transition-all" title={`Fees/Taxes: $${otherTotal.toLocaleString()}`} />}
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                <span>0%</span>
                <span>100%</span>
            </div>
        </div>

        {/* Breakdown List */}
        <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium text-slate-700">Parts</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-900">${partsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="text-xs text-slate-500 w-8 text-right font-mono">{partsPercent}%</span>
                </div>
            </div>
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                    <span className="text-sm font-medium text-slate-700">Labor</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-900">${laborTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="text-xs text-slate-500 w-8 text-right font-mono">{laborPercent}%</span>
                </div>
            </div>

            {otherTotal > 0 && (
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                        <span className="text-sm font-medium text-slate-700">Other (Fees/Tax)</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-slate-900">${otherTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="text-xs text-slate-500 w-8 text-right font-mono">{otherPercent}%</span>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between pt-1">
                <span className="text-base font-black text-slate-900 uppercase tracking-tight">Total Cost</span>
                <span className="text-lg font-black text-slate-900">${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default PartsVsLaborWidget;
