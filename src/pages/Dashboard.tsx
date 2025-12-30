import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AnalyticsDashboard from "@/components/dashboard/AnalyticsDashboard";
import { equipmentApi } from "@/lib/equipmentApi";
import { workOrdersApi } from "@/lib/workOrdersApi";
import { serviceHistoryApi, ServiceHistoryDto } from "@/lib/serviceHistoryApi";
import { Equipment, WorkOrder, EquipmentStatus, EquipmentType, WorkOrderStatus } from "@/lib/types";

const Dashboard = () => {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceHistoryDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [equipData, woData, shData] = await Promise.all([
        equipmentApi.list(),
        workOrdersApi.list(),
        serviceHistoryApi.list()
      ]);

      // Map EquipmentOption to Equipment
      const mappedEquipment: Equipment[] = equipData.map(e => ({
        id: e.id,
        unitNumber: e.number,
        type: e.type === 'truck' ? EquipmentType.TRUCK : EquipmentType.TRAILER,
        make: e.make || 'Unknown',
        model: e.model || 'Unknown',
        year: e.year || new Date().getFullYear(),
        vin: e.vin,
        licensePlate: '',
        status: (e.status as EquipmentStatus) || EquipmentStatus.ACTIVE,
        lastServiceDate: new Date().toISOString()
      }));

      // Map WorkOrderDto to WorkOrder
      const mappedWorkOrders: WorkOrder[] = woData.map(wo => ({
        id: wo.id,
        woNumber: wo.woNumber || 'Draft',
        equipmentId: wo.assetId,
        status: (wo.status as unknown as WorkOrderStatus) || WorkOrderStatus.OPEN,
        priority: 'Medium' as any,
        date: wo.serviceDate,
        technician: 'Unknown',
        totalCost: wo.totalAmount,
        partsCost: 0,
        laborCost: 0,
        description: wo.summary || '',
        vendor: '',
        items: [],
        isRoadside: (wo as any).isRoadside
      }));

      setEquipment(mappedEquipment);
      setWorkOrders(mappedWorkOrders);
      setServiceRecords(shData || []);
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
