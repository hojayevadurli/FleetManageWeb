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
import { WorkOrderDto } from "@/lib/workOrdersApi";

interface WorkOrderListProps {
  workOrders: WorkOrderDto[];
  onEditWorkOrder: (workOrder: WorkOrderDto) => void;
  onUpdateStatus: (id: string, status: WorkOrderDto["status"]) => void;
  onCreateClick: () => void;
  onViewDetails?: (id: string) => void; // optional (for routing later)
}

const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);

const formatShortId = (id: string) => id.slice(0, 8).toUpperCase();

const statusBadgeClass = (status: WorkOrderDto["status"]) => {
  switch (status) {
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

const statusLabel = (status: WorkOrderDto["status"]) => {
  switch (status) {
    case "draft":
      return "Draft";
    case "open":
      return "Open";
    case "closed":
      return "Closed";
    case "paid":
      return "Paid";
    default:
      return status;
  }
};

const WorkOrderList = ({
  workOrders,
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
        const title = wo.lines?.[0]?.description || wo.summary || "Work Order";
        const woNumber = wo.woNumber ?? formatShortId(wo.id);
        const assetLabel = `${wo.assetType.toUpperCase()} • ${wo.assetId}`;
        const serviceDate = wo.serviceDate ? new Date(wo.serviceDate).toLocaleDateString() : "-";

        return (
          <Card key={wo.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-blue-600" />
                    {woNumber}
                  </CardTitle>
                  <CardDescription className="truncate">{title}</CardDescription>

                  <div className="text-sm text-gray-500 mt-1 truncate">
                    {assetLabel}
                  </div>
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
                {wo.summary && (
                  <div className="text-gray-600 whitespace-pre-line text-sm">
                    {wo.summary}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Asset</p>
                      <p className="font-semibold">
                        {wo.assetType.charAt(0).toUpperCase() + wo.assetType.slice(1)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Service Date</p>
                      <p className="font-semibold">{serviceDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="font-semibold">{formatMoney(wo.totalAmount)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
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

                  {wo.status !== "paid" && (
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => onUpdateStatus(wo.id, "paid")}
                    >
                      Mark Paid
                    </Button>
                  )}

                  {wo.status !== "closed" && (
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => onUpdateStatus(wo.id, "closed")}
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
