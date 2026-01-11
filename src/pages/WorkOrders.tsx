import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import WorkOrderFilters from "@/components/workorder/WorkOrderFilters";
import WorkOrderList from "@/components/workorder/WorkOrderList";
import CreateWorkOrderDialog from "@/components/workorder/CreateWorkOrderDialog";
import EditWorkOrderDialog from "@/components/workorder/EditWorkOrderDialog";

import { WorkOrderDto, WorkOrderStatus, WorkOrderPriority, WorkOrderCostSource } from "@/lib/types";
import { workOrdersApi, WorkOrderUpsertDto } from "@/lib/workOrdersApi";
import { equipmentApi } from "@/lib/equipmentApi";
import { shopsApi } from "@/lib/shopsApi";

// Use the SAME key your axios interceptor uses
function useApiToken() {
  return localStorage.getItem("auth_token") ?? "";
}

/**
 * ✅ If your backend supports replaceDocuments but your TS DTO doesn't,
 * extend it locally to remove red squiggles.
 */
type WorkOrderUpsertWithOptions = WorkOrderUpsertDto & {
  replaceDocuments?: boolean;
};

const WorkOrders = () => {
  const token = useApiToken();
  const navigate = useNavigate();

  const [workOrders, setWorkOrders] = useState<WorkOrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Maps for displaying names
  const [equipmentMap, setEquipmentMap] = useState<Record<string, string>>({});
  const [vendorMap, setVendorMap] = useState<Record<string, string>>({});

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | WorkOrderDto["status"]>("all");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderDto | null>(null);

  useEffect(() => {
    if (!token) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [woData, equipData, shopData] = await Promise.all([
        workOrdersApi.list({ page: 1, pageSize: 50 }),
        equipmentApi.list(),
        shopsApi.list()
      ]);

      setWorkOrders(woData);

      // Build Maps
      const eMap: Record<string, string> = {};
      equipData.forEach((e: any) => {
        // unitNumber is the primary identifier users known
        eMap[e.id] = e.unitNumber || e.name || "Unknown Asset";
      });
      setEquipmentMap(eMap);

      const vMap: Record<string, string> = {};
      shopData.forEach((s: any) => {
        // standardized on 'id' and 'name' usually
        vMap[s.id] = s.name || s.shopName || "Unknown Vendor";
      });
      setVendorMap(vMap);

    } catch (e: any) {
      console.error(e);
      toast.error("Failed to fetch work orders");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    let filtered = [...workOrders];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((w) =>
        (w.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Search
    if (searchTerm.trim()) {
      const s = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((w) => {
        const woNumber = (w.workOrderNumber ?? "").toLowerCase();
        const equipmentId = (w.equipmentId ?? "").toLowerCase();
        const title = (w.title ?? "").toLowerCase();
        const firstLine = (w.lines?.[0]?.description ?? "").toLowerCase();

        // Check maps too for better search
        const unitNumber = (equipmentMap[w.equipmentId] || "").toLowerCase();
        const vendorName = (w.vendorId ? (vendorMap[w.vendorId] || "") : "").toLowerCase();

        return (
          woNumber.includes(s) ||
          equipmentId.includes(s) ||
          unitNumber.includes(s) ||
          vendorName.includes(s) ||
          title.includes(s) ||
          firstLine.includes(s) ||
          w.id.toLowerCase().includes(s)
        );
      });
    }

    // Sort newest opened date first
    filtered.sort((a, b) => {
      const da = new Date(a.openedAt).getTime();
      const db = new Date(b.openedAt).getTime();
      return db - da;
    });

    return filtered;
  }, [workOrders, searchTerm, statusFilter, equipmentMap, vendorMap]);

  const updateWorkOrderStatus = async (id: string, status: WorkOrderDto["status"]) => {
    try {
      const wo = workOrders.find((w) => w.id === id);
      if (!wo) return;

      const body: WorkOrderUpsertDto = {
        equipmentId: wo.equipmentId,
        vendorId: wo.vendorId ?? null,
        workOrderNumber: wo.workOrderNumber ?? null,
        odometerAtService: wo.odometerAtService ?? null,
        openedAt: wo.openedAt,
        closedAt: wo.closedAt ?? null,
        title: wo.title,
        complaint: wo.complaint,
        diagnosis: wo.diagnosis ?? null,
        resolution: wo.resolution ?? null,
        notes: wo.notes ?? null,
        status: (WorkOrderStatus as any)[status] ?? (typeof status === 'number' ? status : WorkOrderStatus.Open),
        priority: (WorkOrderPriority as any)[wo.priority] ?? (typeof wo.priority === 'number' ? wo.priority : WorkOrderPriority.Normal),
        costSource: (WorkOrderCostSource as any)[wo.costSource] ?? (typeof wo.costSource === 'number' ? wo.costSource : WorkOrderCostSource.Estimated),
        estimatedTotal: wo.estimatedTotal,
        manualActualTotal: wo.manualActualTotal,
        lines: (wo.lines ?? []).map((l) => ({
          type: l.type,
          description: l.description,
          qty: l.qty,
          unitPrice: l.unitPrice,
          partNumber: l.partNumber ?? null
        })),
        replaceDocuments: false,
        documentIds: []
      };

      await workOrdersApi.update(id, body);
      toast.success("Work order status updated");
      await loadData(); // refresh all
    } catch (e) {
      console.error(e);
      toast.error("Failed to update work order status");
    }
  };

  const handleEditWorkOrder = (wo: WorkOrderDto) => {
    setSelectedWorkOrder(wo);
    setIsEditDialogOpen(true);
  };

  if (!token) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Not authenticated</h2>
        <p className="text-gray-600 mt-2">
          Login first so we can call the .NET API (JWT required). Also confirm localStorage key is{" "}
          <code>auth_token</code>.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 h-full">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Service</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Operational Fleet Directives</p>
        </div>

        <Button size="lg" className="rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95 transition-all" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Work Order
        </Button>
      </div>

      <CreateWorkOrderDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        initialCompanyName={"Fleet Company"}
        onAfterCreated={loadData}
      />

      <EditWorkOrderDialog
        workOrder={selectedWorkOrder}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onWorkOrderUpdated={loadData}
      />

      <WorkOrderFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      <WorkOrderList
        workOrders={filteredOrders}
        equipmentMap={equipmentMap}
        vendorMap={vendorMap}
        onEditWorkOrder={handleEditWorkOrder}
        onUpdateStatus={updateWorkOrderStatus}
        onCreateClick={() => setIsCreateDialogOpen(true)}
        onViewDetails={(id) => navigate(`/app/maintenance/service-history/${id}`)}
      />
    </div>
  );
};
export default WorkOrders;
