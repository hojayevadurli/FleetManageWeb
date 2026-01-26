import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard";
import { equipmentApi, mapDtoToEquipment } from "@/lib/equipmentApi";
import { workOrdersApi } from "@/lib/workOrdersApi";
import { Equipment, WorkOrder, WorkOrderStatus, WorkOrderPriority, WorkOrderCostSource } from "@/lib/types";

const Dashboard = () => {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [serviceRecords, setServiceRecords] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [equipData, woData] = await Promise.all([
        equipmentApi.list(),
        workOrdersApi.list()
      ]);

      // Map EquipmentDto to Equipment
      const mappedEquipment: Equipment[] = equipData.map(mapDtoToEquipment);

      // Map WorkOrderDto to WorkOrder
      const mappedWorkOrders: WorkOrder[] = woData.map(wo => ({
        id: wo.id,
        woNumber: wo.workOrderNumber || 'Draft',
        equipmentId: wo.equipmentId,
        status: (() => {
          const s = wo.status;
          if (typeof s === 'number') return s;
          const lookup = (WorkOrderStatus as any)[s];
          if (lookup !== undefined) return lookup;
          // Case-insensitive fallback
          const lower = String(s).toLowerCase();
          // Enum keys are strings, values are numbers. 
          // We need to find the Key that matches the input string case-insensitively, then get the Value.
          const key = Object.keys(WorkOrderStatus).find(k => isNaN(Number(k)) && k.toLowerCase() === lower);
          return key ? (WorkOrderStatus as any)[key] : WorkOrderStatus.Open;
        })(),
        priority: (WorkOrderPriority as any)[wo.priority] ?? WorkOrderPriority.Normal,
        date: wo.openedAt,
        technician: 'Unknown',
        totalCost: wo.manualActualTotal || wo.estimatedTotal || (wo.lines || []).reduce((sum: number, l: any) => sum + (l.amount || 0), 0),
        partsCost: 0,
        laborCost: 0,
        title: wo.title,
        complaint: wo.complaint,
        diagnosis: wo.diagnosis || '',
        resolution: wo.resolution || '',
        costSource: (WorkOrderCostSource as any)[wo.costSource] ?? WorkOrderCostSource.Estimated,
        estimatedTotal: wo.estimatedTotal || (wo.lines || []).reduce((sum: number, l: any) => sum + (l.amount || 0), 0),
        manualActualTotal: wo.manualActualTotal,
        description: wo.notes || '',
        vendor: '',
        items: [],
        media: []
      }));

      setEquipment(mappedEquipment);
      setWorkOrders(mappedWorkOrders);
      // Use mappedWorkOrders for service records, allowing all active work including Drafts (to match Service Page)
      setServiceRecords(mappedWorkOrders.filter(wo =>
        wo.status !== WorkOrderStatus.Cancelled
      ));
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  const handleTabChange = (tab: string, status?: string, recordId?: string) => {
    if (recordId && tab.includes('service-history')) {
      navigate(`/app/maintenance/service-history/${recordId}`);
      return;
    }
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (recordId) params.set('recordId', recordId);

    const query = params.toString() ? `?${params.toString()}` : '';
    navigate(`/app/${tab}${query}`);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading fleet data...</div>;
  }

  return (
    <AnalyticsDashboard
      equipment={equipment}
      workOrders={workOrders}
      serviceRecords={serviceRecords}
      onTabChange={handleTabChange}
    />
  );
};

export default Dashboard;
