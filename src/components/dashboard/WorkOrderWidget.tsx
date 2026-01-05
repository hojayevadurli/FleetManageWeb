import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { workOrdersApi } from "@/lib/workOrdersApi";
import { WorkOrderDto, WorkOrderStatus } from "@/lib/types";

const statusBadgeClass = (status: string) => {
  const s = status.toLowerCase();
  switch (s) {
    case "open":
      return "bg-blue-100 text-blue-800";
    case "draft":
      return "bg-gray-100 text-gray-800";
    case "closed":
      return "bg-green-100 text-green-800";
    case "paid":
      return "bg-purple-100 text-purple-800";
    case "completed":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatShortId = (id: string) => id.slice(0, 8).toUpperCase();

const WorkOrderWidget = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  // If you want “active” only (open + draft), filter here
  const active = useMemo(
    () => workOrders.filter((w) => {
      const s = w.status.toLowerCase();
      return s === "open" || s === "draft" || s === "inprocess";
    }),
    [workOrders]
  );

  useEffect(() => {
    let mounted = true;

    const fetch = async () => {
      try {
        setLoading(true);

        // Backend currently supports paging, but not status filter param in API.
        // We fetch first page and filter on client.
        const data = await workOrdersApi.list({ page: 1, pageSize: 25 });

        if (!mounted) return;
        setWorkOrders(data ?? []);
      } catch (err) {
        console.error("Error fetching work orders:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            Work Orders
          </div>
          <Badge variant="outline">{loading ? "…" : active.length}</Badge>
        </CardTitle>
        <CardDescription>
          {loading ? "Loading..." : "Active maintenance work"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-2">
          {loading ? (
            <div className="text-sm text-gray-500 text-center py-4">Loading…</div>
          ) : active.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">
              No active work orders
            </div>
          ) : (
            active.slice(0, 2).map((wo) => {
              const title = wo.lines?.[0]?.description || wo.title || "Work Order";
              return (
                <div key={wo.id} className="flex justify-between items-center text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">
                      {wo.workOrderNumber ?? formatShortId(wo.id)}
                    </div>
                    <div className="text-gray-500 truncate">
                      {wo.equipmentId} • {title}
                    </div>
                  </div>
                  <Badge className={statusBadgeClass(wo.status)}>
                    {wo.status}
                  </Badge>
                </div>
              );
            })
          )}
        </div>

        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to="/app/work-orders">View All Orders</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default WorkOrderWidget;
