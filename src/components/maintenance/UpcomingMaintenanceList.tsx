
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Truck, DollarSign, Wrench, AlertTriangle } from "lucide-react";

interface MaintenanceItem {
  id: string;
  work_order_number: string;
  vehicle_id: string;
  vehicle_type: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  estimated_hours: number | null;
  estimated_cost: number | null;
  created_at: string;
}

interface UpcomingMaintenanceListProps {
  maintenanceItems: MaintenanceItem[];
  onRefresh: () => void;
}

const UpcomingMaintenanceList = ({ maintenanceItems, onRefresh }: UpcomingMaintenanceListProps) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-100 text-blue-800";
      case "open": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDateString: string) => {
    const today = new Date();
    const dueDate = new Date(dueDateString);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isOverdue = (dueDateString: string) => {
    return getDaysUntilDue(dueDateString) < 0;
  };

  if (maintenanceItems.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming maintenance</h3>
          <p className="text-gray-600">There are no scheduled maintenance items for the selected filters.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {maintenanceItems.map((item) => {
        const daysUntilDue = item.due_date ? getDaysUntilDue(item.due_date) : null;
        const overdue = item.due_date ? isOverdue(item.due_date) : false;

        return (
          <Card key={item.id} className={`hover:shadow-lg transition-shadow ${overdue ? 'border-l-4 border-l-red-500' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-blue-600" />
                    {item.vehicle_id} - {item.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium">{item.work_order_number}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.vehicle_type}
                    </Badge>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={getPriorityColor(item.priority)}>
                    {item.priority}
                  </Badge>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                  {overdue && (
                    <Badge className="bg-red-100 text-red-800">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {item.description && (
                <p className="text-gray-600 mb-4">{item.description}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                {item.due_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Due Date</p>
                      <p className={`font-semibold ${overdue ? 'text-red-600' : ''}`}>
                        {formatDate(item.due_date)}
                      </p>
                      {daysUntilDue !== null && (
                        <p className={`text-xs ${overdue ? 'text-red-600' : daysUntilDue <= 7 ? 'text-yellow-600' : 'text-gray-500'}`}>
                          {overdue ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days remaining`}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {item.estimated_hours && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Estimated Hours</p>
                      <p className="font-semibold">{item.estimated_hours}h</p>
                    </div>
                  </div>
                )}

                {item.estimated_cost && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Estimated Cost</p>
                      <p className="font-semibold">${item.estimated_cost}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Vehicle</p>
                    <p className="font-semibold">{item.vehicle_id}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline">View Details</Button>
                <Button size="sm" variant="outline">Reschedule</Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">Start Work</Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default UpcomingMaintenanceList;
