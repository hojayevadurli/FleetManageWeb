
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

const OpenIssuesWidget = () => {
  const issues = [
    { id: "ISS-001", title: "Engine Warning Light", vehicle: "TR-008", severity: "High" },
    { id: "ISS-002", title: "AC Not Working", vehicle: "TR-012", severity: "Medium" },
    { id: "ISS-003", title: "Loose Mirror", vehicle: "TR-003", severity: "Low" }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High": return "bg-red-100 text-red-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Low": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Open Issues
          </div>
          <Badge variant="outline">{issues.length}</Badge>
        </CardTitle>
        <CardDescription>Unresolved vehicle issues</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {issues.slice(0, 2).map((issue) => (
            <div key={issue.id} className="flex justify-between items-center text-sm">
              <div>
                <div className="font-medium">{issue.title}</div>
                <div className="text-gray-500">{issue.vehicle}</div>
              </div>
              <Badge className={getSeverityColor(issue.severity)}>
                {issue.severity}
              </Badge>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full">
          View All Issues
        </Button>
      </CardContent>
    </Card>
  );
};

export default OpenIssuesWidget;
