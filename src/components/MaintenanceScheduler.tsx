
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Wrench, AlertTriangle, Clock, CheckCircle, Plus, Filter } from "lucide-react";

const MaintenanceScheduler = () => {
  const [activeTab, setActiveTab] = useState("scheduled");

  const scheduledMaintenance = [
    {
      id: 1,
      unit: "TR-001",
      type: "Preventive Maintenance",
      description: "Oil change, filter replacement, brake inspection",
      scheduledDate: "2024-02-15",
      estimatedHours: 4,
      priority: "Medium",
      technician: "Mike Rodriguez",
      status: "Scheduled"
    },
    {
      id: 2,
      unit: "TR-003",
      type: "DOT Inspection",
      description: "Annual DOT safety inspection",
      scheduledDate: "2024-02-18",
      estimatedHours: 2,
      priority: "High",
      technician: "Sarah Thompson",
      status: "Scheduled"
    },
    {
      id: 3,
      unit: "TR-005",
      type: "Tire Replacement",
      description: "Replace front tires - wear at 2/32",
      scheduledDate: "2024-02-20",
      estimatedHours: 3,
      priority: "High",
      technician: "Dave Martinez",
      status: "Scheduled"
    }
  ];

  const activeMaintenance = [
    {
      id: 4,
      unit: "TR-002",
      type: "Engine Repair",
      description: "Turbocharger replacement",
      startDate: "2024-01-20",
      estimatedCompletion: "2024-01-22",
      progress: 75,
      technician: "John Walker",
      partsNeeded: ["Turbocharger", "Gasket Set", "Oil"],
      status: "In Progress"
    },
    {
      id: 5,
      unit: "TR-007",
      type: "Transmission Service",
      description: "Transmission fluid change and filter replacement",
      startDate: "2024-01-21",
      estimatedCompletion: "2024-01-21",
      progress: 90,
      technician: "Mike Rodriguez",
      partsNeeded: ["Transmission Filter", "ATF Fluid"],
      status: "In Progress"
    }
  ];

  const completedMaintenance = [
    {
      id: 6,
      unit: "TR-004",
      type: "Brake Service",
      description: "Brake pad replacement and rotor resurfacing",
      completedDate: "2024-01-19",
      actualHours: 5,
      technician: "Sarah Thompson",
      cost: 1250,
      status: "Completed"
    },
    {
      id: 7,
      unit: "TR-006",
      type: "Preventive Maintenance",
      description: "Oil change, filter replacement, safety inspection",
      completedDate: "2024-01-18",
      actualHours: 3,
      technician: "Dave Martinez",
      cost: 350,
      status: "Completed"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Scheduled": return "bg-blue-100 text-blue-800";
      case "In Progress": return "bg-orange-100 text-orange-800";
      case "Completed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Maintenance Scheduler</h2>
          <p className="text-gray-600">Manage preventive maintenance and repairs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Schedule Maintenance
          </Button>
        </div>
      </div>

      {/* Maintenance Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-white border">
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduled ({scheduledMaintenance.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            In Progress ({activeMaintenance.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed ({completedMaintenance.length})
          </TabsTrigger>
        </TabsList>

        {/* Scheduled Maintenance */}
        <TabsContent value="scheduled" className="space-y-4">
          {scheduledMaintenance.map((maintenance) => (
            <Card key={maintenance.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-blue-600" />
                      {maintenance.unit} - {maintenance.type}
                    </CardTitle>
                    <CardDescription>{maintenance.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(maintenance.priority)}>
                      {maintenance.priority}
                    </Badge>
                    <Badge className={getStatusColor(maintenance.status)}>
                      {maintenance.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Scheduled Date</p>
                      <p className="font-semibold">{maintenance.scheduledDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Estimated Hours</p>
                      <p className="font-semibold">{maintenance.estimatedHours}h</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Assigned Technician</p>
                    <p className="font-semibold">{maintenance.technician}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">Start Work</Button>
                  <Button variant="outline" size="sm">Reschedule</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Active Maintenance */}
        <TabsContent value="active" className="space-y-4">
          {activeMaintenance.map((maintenance) => (
            <Card key={maintenance.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-orange-600" />
                      {maintenance.unit} - {maintenance.type}
                    </CardTitle>
                    <CardDescription>{maintenance.description}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(maintenance.status)}>
                    {maintenance.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Start Date</p>
                      <p className="font-semibold">{maintenance.startDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Est. Completion</p>
                      <p className="font-semibold">{maintenance.estimatedCompletion}</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-600">Progress</p>
                      <p className="text-sm font-semibold">{maintenance.progress}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${maintenance.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Parts Needed</p>
                    <div className="flex flex-wrap gap-2">
                      {maintenance.partsNeeded.map((part, index) => (
                        <Badge key={index} variant="outline" className="bg-blue-50">
                          {part}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Technician</p>
                    <p className="font-semibold">{maintenance.technician}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">Update Progress</Button>
                  <Button variant="outline" size="sm">Add Parts</Button>
                  <Button variant="outline" size="sm">Complete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Completed Maintenance */}
        <TabsContent value="completed" className="space-y-4">
          {completedMaintenance.map((maintenance) => (
            <Card key={maintenance.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      {maintenance.unit} - {maintenance.type}
                    </CardTitle>
                    <CardDescription>{maintenance.description}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(maintenance.status)}>
                    {maintenance.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Completed Date</p>
                    <p className="font-semibold">{maintenance.completedDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Actual Hours</p>
                    <p className="font-semibold">{maintenance.actualHours}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Cost</p>
                    <p className="font-semibold">${maintenance.cost}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Technician</p>
                  <p className="font-semibold">{maintenance.technician}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">View Details</Button>
                  <Button variant="outline" size="sm">Generate Report</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MaintenanceScheduler;
