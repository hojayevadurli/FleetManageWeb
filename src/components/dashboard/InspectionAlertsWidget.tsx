
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const InspectionAlertsWidget = () => {
  const alerts = [
    { vehicle: "TR-004", type: "DOT Inspection", dueDate: "2024-01-23", status: "Overdue" },
    { vehicle: "TR-009", type: "Annual Inspection", dueDate: "2024-01-26", status: "Due Soon" },
    { vehicle: "TRL-001", type: "Safety Inspection", dueDate: "2024-01-30", status: "Upcoming" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Overdue": return "bg-red-100 text-red-800";
      case "Due Soon": return "bg-yellow-100 text-yellow-800";
      case "Upcoming": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Inspection Alerts
          </div>
          <Badge variant="outline">{alerts.length}</Badge>
        </CardTitle>
        <CardDescription>Inspection deadlines</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {alerts.slice(0, 2).map((alert, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <div>
                <div className="font-medium">{alert.vehicle}</div>
                <div className="text-gray-500">{alert.type}</div>
              </div>
              <Badge className={getStatusColor(alert.status)}>
                {alert.status}
              </Badge>
            </div>
          ))}
        </div>
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to="/inspections">Manage Inspections</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default InspectionAlertsWidget;
