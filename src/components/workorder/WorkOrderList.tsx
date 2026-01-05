import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Wrench,
  Plus,
  Calendar,
  DollarSign,
  Truck,
  Edit,
  MoreVertical
} from "lucide-react";
import { WorkOrderDto } from "@/lib/types";

interface WorkOrderListProps {
  workOrders: WorkOrderDto[];
  equipmentMap?: Record<string, string>; // ID -> Unit Number
  vendorMap?: Record<string, string>;    // ID -> Vendor Name
  onEditWorkOrder: (workOrder: WorkOrderDto) => void;
  onUpdateStatus: (id: string, status: WorkOrderDto["status"]) => void;
  onCreateClick: () => void;
  onViewDetails?: (id: string) => void;
}

const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);

const formatShortId = (id: string) => id.slice(0, 8).toUpperCase();

const statusBadgeClass = (status: string) => {
  const s = status.toLowerCase();
  switch (s) {
    case "draft":
      return "bg-gray-100 text-gray-800";
    case "open":
      return "bg-blue-100 text-blue-800";
    case "closed":
      return "bg-green-100 text-green-800";
    case "paid":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const statusLabel = (status: string) => {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const WorkOrderList = ({
  workOrders,
  equipmentMap = {},
  vendorMap = {},
  onEditWorkOrder,
  onUpdateStatus,
  onCreateClick,
  onViewDetails
}: WorkOrderListProps) => {
  if (workOrders.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Work Orders Found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first work order</p>
            <Button onClick={onCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Create Work Order
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {workOrders.map((wo) => {
        const title = wo.title || "Work Order";
        const woNumber = wo.workOrderNumber ?? formatShortId(wo.id);

        // Lookup Unit Number
        const unitNumber = equipmentMap[wo.equipmentId] || wo.equipmentId.slice(0, 8).toUpperCase();

        // Lookup Vendor Name
        const vendorName = wo.vendorId ? (vendorMap[wo.vendorId] || "Unknown Vendor") : "In-House / No Vendor";

        const serviceDate = wo.openedAt ? new Date(wo.openedAt).toLocaleDateString() : "-";

        return (
          <Card key={wo.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <Truck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 leading-none">{woNumber}</h3>
                      <span className="text-xs text-slate-400 font-mono">{unitNumber}</span>
                    </div>
                  </div>

                  <CardDescription className="truncate mt-2 font-medium text-slate-600">
                    {vendorName}
                  </CardDescription>

                  <p className="text-xs text-gray-400 mt-1 truncate max-w-md">
                    {title}
                  </p>
                </div>

                <div className="flex gap-2 items-center">
                  <Badge className={statusBadgeClass(wo.status)}>{statusLabel(wo.status)}</Badge>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="bg-white border shadow-md">
                      <DropdownMenuItem onClick={() => onEditWorkOrder(wo)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>

                      <DropdownMenuItem onClick={() => onUpdateStatus(wo.id, "draft")}>
                        Set to Draft
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateStatus(wo.id, "open")}>
                        Set to Open
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateStatus(wo.id, "closed")}>
                        Set to Closed
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateStatus(wo.id, "paid")}>
                        Set to Paid
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {wo.notes && (
                  <div className="text-gray-600 whitespace-pre-line text-sm">
                    {wo.notes}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Priority</p>
                      <p className="font-semibold text-sm capitalize">
                        {wo.priority}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Service Date</p>
                      <p className="font-semibold text-sm">{serviceDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Total Cost</p>
                      <p className="font-semibold text-sm text-slate-900">{formatMoney(wo.manualActualTotal || wo.estimatedTotal)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (onViewDetails ? onViewDetails(wo.id) : onEditWorkOrder(wo))}
                  >
                    View Details
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditWorkOrder(wo)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>

                  {wo.status.toLowerCase() !== "closed" && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => onUpdateStatus(wo.id, "Closed")}
                    >
                      Close WO
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default WorkOrderList;
