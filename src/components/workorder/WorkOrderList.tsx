import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  Wrench,
  Plus,
  Calendar,
  DollarSign,
  Truck,
  Edit,
  MoreVertical,
  Trash2,
  Store,
  Eye,
  FileText,
  Star,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { WorkOrderDto } from "@/lib/types";

export interface VendorData {
  name: string;
  rating: number;
  reviews: number;
}

interface WorkOrderListProps {
  workOrders: WorkOrderDto[];
  equipmentMap?: Record<string, string>; // ID -> Unit Number
  vendorMap?: Record<string, VendorData>;    // ID -> Vendor Data
  onEditWorkOrder: (workOrder: WorkOrderDto) => void;
  onUpdateStatus: (id: string, status: WorkOrderDto["status"]) => void;
  onCreateClick: () => void;
  onViewDetails?: (id: string) => void;
  onDelete?: (workOrder: WorkOrderDto) => void;
  onRateService?: (workOrder: WorkOrderDto) => void;
}

const formatMoney = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n ?? 0);

const formatShortId = (id: string) => id.slice(0, 8).toUpperCase();

// Helper to normalize status strings
const normStatus = (s?: string | number) => String(s || "").toLowerCase();

const statusConfig = (status: string | number) => {
  const s = normStatus(status);
  switch (s) {
    case "draft":
    case "0": // WorkOrderStatus.Draft
      return { badge: "bg-slate-100 text-slate-600", border: "border-l-slate-300", label: "Draft" };
    case "open":
    case "1": // WorkOrderStatus.Open
    case "inprocess":
    case "2": // WorkOrderStatus.InProcess
      return { badge: "bg-blue-100 text-blue-700", border: "border-l-blue-500", label: "Open" };
    case "completed":
    case "3": // WorkOrderStatus.Completed
      return { badge: "bg-emerald-100 text-emerald-700", border: "border-l-emerald-500", label: "Completed" };
    case "closed":
    case "4": // WorkOrderStatus.Closed
      return { badge: "bg-indigo-100 text-indigo-700", border: "border-l-indigo-500", label: "Closed" };
    case "paid":
    case "6": // WorkOrderStatus.Paid
      return { badge: "bg-purple-100 text-purple-700", border: "border-l-purple-500", label: "Paid" };
    default:
      return { badge: "bg-slate-100 text-slate-600", border: "border-l-slate-200", label: status };
  }
};

const WorkOrderList = ({
  workOrders,
  equipmentMap = {},
  vendorMap = {},
  onEditWorkOrder,
  onUpdateStatus,
  onCreateClick,
  onViewDetails,
  onDelete,
  onRateService
}: WorkOrderListProps) => {
  // Track expanded state for each work order (by ID)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (workOrders.length === 0) {
    return (
      <Card className="border-dashed border-2 border-slate-200 bg-slate-50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="bg-white p-4 rounded-full mb-4 shadow-sm">
            <Wrench className="h-10 w-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">No Work Orders Found</h3>
          <p className="text-slate-500 mb-6 max-w-sm text-center">Get started by creating your first maintenance record or adjust your filters.</p>
          <Button onClick={onCreateClick} size="lg" className="rounded-full font-bold shadow-lg shadow-blue-500/20">
            <Plus className="h-5 w-5 mr-2" />
            Create Work Order
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-32">
      {workOrders.map((wo) => {
        const config = statusConfig(wo.status);
        const woNumber = wo.workOrderNumber ?? formatShortId(wo.id);
        const unitNumber = equipmentMap[wo.equipmentId] || wo.equipmentId.slice(0, 8).toUpperCase();

        // Vendor Logic
        const vendorData = wo.vendorId ? vendorMap[wo.vendorId] : null;
        const vendorName = vendorData?.name || "Unknown Vendor";
        const isInternal = !wo.vendorId;

        const serviceDate = wo.openedAt ? new Date(wo.openedAt).toLocaleDateString() : "-";

        // Services Expansion Logic
        const lines = wo.lines || [];
        const isExpanded = expandedIds.has(wo.id);
        const previewLines = isExpanded ? lines : lines.slice(0, 2);
        const hasMore = lines.length > 2;
        const remainingCount = lines.length - 2;

        return (
          <Card key={wo.id} className={`hover:shadow-lg transition-all duration-200 border-l-4 ${config.border} group`}>
            <div className="p-5">
              {/* Header: ID + Menus */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => onViewDetails?.(wo.id)}>
                    {woNumber}
                  </h3>
                  <Badge className={`${config.badge} border-0 font-bold uppercase tracking-wider text-[10px]`}>
                    {config.label}
                  </Badge>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetails?.(wo.id); }}>
                      <Eye className="h-4 w-4 mr-2" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditWorkOrder(wo); }}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileText className="h-4 w-4 mr-2" /> View Receipt
                    </DropdownMenuItem>
                    {normStatus(wo.status) === 'completed' && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRateService?.(wo); }}>
                        <Star className="h-4 w-4 mr-2 text-yellow-500" /> Rate Service
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">Change Status</div>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onUpdateStatus(wo.id, "open"); }}>Mark as Open</DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onUpdateStatus(wo.id, "completed"); }}>Mark as Completed</DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onUpdateStatus(wo.id, "closed"); }}>Mark as Closed</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(wo);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Main Grid Content */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-4">

                {/* Asset Info (Col 1-3) */}
                <div className="md:col-span-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Truck className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Asset</span>
                  </div>
                  <div className="font-bold text-slate-900">{unitNumber}</div>
                  <div className="text-xs text-slate-500 truncate">Freightliner Cascadia</div> {/* MOCK MODEL */}
                </div>

                {/* Shop Info (Col 4-7) */}
                <div className="md:col-span-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Store className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service Provider</span>
                  </div>
                  {isInternal ? (
                    <div className="flex items-center gap-2 bg-slate-50 w-fit px-2 py-1 rounded text-xs font-medium text-slate-600">
                      In-House Maintenance
                    </div>
                  ) : (
                    <div>
                      <div className="font-bold text-slate-900">{vendorName}</div>
                      {vendorData && vendorData.rating > 0 && (
                        <div className="flex items-center gap-1 text-xs text-amber-500">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="font-bold">{vendorData.rating.toFixed(1)}</span>
                          <span className="text-slate-400 font-normal">({vendorData.reviews} reviews)</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Date & Cost (Col 8-12) */}
                <div className="md:col-span-5 flex justify-between md:justify-end gap-8">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date</span>
                    </div>
                    <div className="font-medium text-slate-900">{serviceDate}</div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
                    </div>
                    <div className="font-black text-lg text-slate-900">
                      {formatMoney(wo.manualActualTotal || wo.estimatedTotal)}
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer: Services Summary & Actions */}
              <div className="bg-slate-50 -mx-5 -mb-5 px-5 py-3 border-t border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

                {/* Services List - Added min-w-0 to prevent flex blowout */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 md:mb-0 md:hidden">
                    <Wrench className="h-3 w-3" /> Services
                  </div>
                  {lines.length > 0 ? (
                    <ul className="text-sm text-slate-600 space-y-1">
                      {previewLines.map((line, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0"></span>
                          <span className="truncate">{line.description}</span>
                        </li>
                      ))}

                      {/* Expand/Collapse Trigger */}
                      {hasMore && (
                        <li
                          className="text-xs font-medium text-blue-600 pl-3.5 cursor-pointer hover:underline flex items-center gap-1 mt-1 select-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(wo.id);
                          }}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-3 w-3" /> Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3" /> + {remainingCount} more items
                            </>
                          )}
                        </li>
                      )}
                    </ul>
                  ) : (
                    <span className="text-sm italic text-slate-400">No line items recorded</span>
                  )}
                </div>

                {/* Desktop Actions - Added relative z-10 to ensure clickable */}
                <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0 relative z-10">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden md:flex"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails?.(wo.id);
                    }}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden md:flex"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditWorkOrder(wo);
                    }}
                  >
                    Edit
                  </Button>
                </div>

              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default WorkOrderList;
