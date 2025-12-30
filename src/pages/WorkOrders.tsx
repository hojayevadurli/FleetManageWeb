import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import WorkOrderFilters from "@/components/workorder/WorkOrderFilters";
import WorkOrderList from "@/components/workorder/WorkOrderList";
import CreateWorkOrderDialog from "@/components/workorder/CreateWorkOrderDialog";
import EditWorkOrderDialog from "@/components/workorder/EditWorkOrderDialog";

import { workOrdersApi, WorkOrderDto, WorkOrderUpsertDto } from "@/lib/workOrdersApi";

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

  const [workOrders, setWorkOrders] = useState<WorkOrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | WorkOrderDto["status"]>("all");

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderDto | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchWorkOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const data = await workOrdersApi.list({ page: 1, pageSize: 50 });
      setWorkOrders(data);
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
      filtered = filtered.filter((w) => w.status === statusFilter);
    }

    // Search
    if (searchTerm.trim()) {
      const s = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((w) => {
        const woNumber = (w.woNumber ?? "").toLowerCase();
        const assetId = (w.assetId ?? "").toLowerCase();
        const summary = (w.summary ?? "").toLowerCase();
        const firstLine = (w.lines?.[0]?.description ?? "").toLowerCase();

        return (
          woNumber.includes(s) ||
          assetId.includes(s) ||
          summary.includes(s) ||
          firstLine.includes(s) ||
          w.id.toLowerCase().includes(s)
        );
      });
    }

    // Sort newest service date first
    filtered.sort((a, b) => {
      const da = new Date(a.serviceDate).getTime();
      const db = new Date(b.serviceDate).getTime();
      return db - da;
    });

    return filtered;
  }, [workOrders, searchTerm, statusFilter]);

  const updateWorkOrderStatus = async (id: string, status: WorkOrderDto["status"]) => {
    try {
      const wo = workOrders.find((w) => w.id === id);
      if (!wo) return;

      const body: WorkOrderUpsertWithOptions = {
        assetType: wo.assetType,
        assetId: wo.assetId,
        vendorId: wo.vendorId ?? null,
        woNumber: wo.woNumber ?? null,
        odometer: wo.odometer ?? null,
        serviceDate: wo.serviceDate,
        summary: wo.summary ?? null,

        // server recalculates
        totalAmount: 0,
        taxAmount: wo.taxAmount ?? 0,

        status,
        lines: (wo.lines ?? []).map((l) => ({
          id: l.id,
          type: l.type,
          description: l.description,
          qty: l.qty,
          unitPrice: l.unitPrice,
          amount: 0,
          partNumber: l.partNumber ?? null
        })),

        /**
         * ✅ IMPORTANT:
         * If your backend supports "replaceDocuments", keep it false so attachments don't change.
         * Also keep documentIds empty to satisfy DTO shape (if it's required in TS).
         */
        replaceDocuments: false,
        documentIds: []
      };

      await workOrdersApi.update(id, body);
      toast.success("Work order status updated");
      await fetchWorkOrders();
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Work Orders</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Operational Fleet Directives</p>
        </div>

        <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 py-6 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95 transition-all" onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Work Order
        </Button>
      </div>

      {/* ✅ Create dialog now handles:
          - create draft (when Upload Files clicked)
          - upload attachments to /workorders/{id}/attachments
          - finalize draft on Create Work Order
          So parent only needs to refresh list after success.
      */}
      <CreateWorkOrderDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        initialCompanyName={"Fleet Company"}
        onAfterCreated={fetchWorkOrders}
      />

      <EditWorkOrderDialog
        workOrder={selectedWorkOrder}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onWorkOrderUpdated={fetchWorkOrders}
      />

      <WorkOrderFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      <WorkOrderList
        workOrders={filteredOrders}
        onEditWorkOrder={handleEditWorkOrder}
        onUpdateStatus={updateWorkOrderStatus}
        onCreateClick={() => setIsCreateDialogOpen(true)}
      />
    </div>
  );
};

export default WorkOrders;
