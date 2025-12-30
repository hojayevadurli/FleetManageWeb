
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

const ServiceReminderWidget = () => {
  const reminders = [
    { vehicle: "TR-001", service: "Oil Change", dueDate: "2024-01-25", daysLeft: 3 },
    { vehicle: "TR-007", service: "DOT Inspection", dueDate: "2024-01-28", daysLeft: 6 },
    { vehicle: "TRL-002", service: "Tire Rotation", dueDate: "2024-02-01", daysLeft: 10 }
  ];

  const getDaysLeftColor = (days: number) => {
    if (days <= 3) return "text-red-600";
    if (days <= 7) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Service Reminders
          </div>
          <Badge variant="outline">{reminders.length}</Badge>
        </CardTitle>
        <CardDescription>Upcoming maintenance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {reminders.slice(0, 2).map((reminder, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <div>
                <div className="font-medium">{reminder.vehicle}</div>
                <div className="text-gray-500">{reminder.service}</div>
              </div>
              <div className={`font-semibold ${getDaysLeftColor(reminder.daysLeft)}`}>
                {reminder.daysLeft}d
              </div>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full">
          View All Reminders
        </Button>
      </CardContent>
    </Card>
  );
};

export default ServiceReminderWidget;
