
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wrench, 
  Package, 
  Users, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Plus,
  Search,
  Filter,
  Truck,
  DollarSign
} from "lucide-react";

const ShopOperations = () => {
  const [activeTab, setActiveTab] = useState("workorders");

  const workOrders = [
    {
      id: "WO-001",
      unit: "TR-002",
      type: "Engine Repair",
      description: "Turbocharger replacement and inspection",
      priority: "High",
      status: "In Progress",
      technician: "John Walker",
      bay: "Bay 2",
      startDate: "2024-01-20",
      estimatedCompletion: "2024-01-22",
      progress: 75,
      estimatedCost: 2500,
      actualCost: 1875
    },
    {
      id: "WO-002",
      unit: "TR-007",
      type: "Transmission Service",
      description: "Transmission fluid change and filter replacement",
      priority: "Medium",
      status: "In Progress",
      technician: "Mike Rodriguez",
      bay: "Bay 1",
      startDate: "2024-01-21",
      estimatedCompletion: "2024-01-21",
      progress: 90,
      estimatedCost: 450,
      actualCost: 425
    },
    {
      id: "WO-003",
      unit: "TR-001",
      type: "Preventive Maintenance",
      description: "Oil change, filter replacement, brake inspection",
      priority: "Low",
      status: "Scheduled",
      technician: "Sarah Thompson",
      bay: "Bay 3",
      startDate: "2024-01-22",
      estimatedCompletion: "2024-01-22",
      progress: 0,
      estimatedCost: 350,
      actualCost: 0
    }
  ];

  const inventory = [
    {
      id: 1,
      partNumber: "ENG-001",
      name: "Turbocharger Assembly",
      category: "Engine",
      quantity: 3,
      minStock: 2,
      unitCost: 1850,
      location: "Shelf A-12",
      supplier: "Detroit Diesel",
      lastRestocked: "2024-01-15"
    },
    {
      id: 2,
      partNumber: "BRK-045",
      name: "Brake Pad Set",
      category: "Brakes",
      quantity: 15,
      minStock: 10,
      unitCost: 185,
      location: "Shelf B-08",
      supplier: "Bendix",
      lastRestocked: "2024-01-10"
    },
    {
      id: 3,
      partNumber: "TRN-023",
      name: "Transmission Filter",
      category: "Transmission",
      quantity: 5,
      minStock: 8,
      unitCost: 45,
      location: "Shelf C-15",
      supplier: "Allison",
      lastRestocked: "2024-01-05"
    },
    {
      id: 4,
      partNumber: "ENG-078",
      name: "Engine Oil Filter",
      category: "Engine",
      quantity: 35,
      minStock: 25,
      unitCost: 25,
      location: "Shelf A-05",
      supplier: "Cummins",
      lastRestocked: "2024-01-18"
    }
  ];

  const technicians = [
    {
      id: 1,
      name: "John Walker",
      specialization: "Engine Repair",
      certifications: ["ASE Master", "Cummins Certified"],
      status: "Working",
      currentJob: "WO-001",
      bay: "Bay 2",
      hoursToday: 6.5,
      efficiency: 95
    },
    {
      id: 2,
      name: "Mike Rodriguez",
      specialization: "General Maintenance",
      certifications: ["ASE Master", "DOT Inspector"],
      status: "Working",
      currentJob: "WO-002",
      bay: "Bay 1",
      hoursToday: 7.0,
      efficiency: 88
    },
    {
      id: 3,
      name: "Sarah Thompson",
      specialization: "Brake Systems",
      certifications: ["ASE Brakes", "DOT Inspector"],
      status: "Available",
      currentJob: "None",
      bay: "None",
      hoursToday: 4.0,
      efficiency: 92
    },
    {
      id: 4,
      name: "Dave Martinez",
      specialization: "Electrical",
      certifications: ["ASE Electrical", "Volvo Certified"],
      status: "Break",
      currentJob: "None",
      bay: "None",
      hoursToday: 5.5,
      efficiency: 90
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
      case "In Progress": return "bg-blue-100 text-blue-800";
      case "Scheduled": return "bg-purple-100 text-purple-800";
      case "Completed": return "bg-green-100 text-green-800";
      case "Working": return "bg-green-100 text-green-800";
      case "Available": return "bg-blue-100 text-blue-800";
      case "Break": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStockStatus = (quantity: number, minStock: number) => {
    if (quantity <= minStock) {
      return { color: "bg-red-100 text-red-800", text: "Low Stock" };
    } else if (quantity <= minStock * 1.5) {
      return { color: "bg-yellow-100 text-yellow-800", text: "Reorder Soon" };
    } else {
      return { color: "bg-green-100 text-green-800", text: "In Stock" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Shop Operations</h2>
          <p className="text-gray-600">Manage work orders, inventory, and technicians</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Work Order
          </Button>
        </div>
      </div>

      {/* Shop Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-white border">
          <TabsTrigger value="workorders" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Work Orders ({workOrders.length})
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory ({inventory.length})
          </TabsTrigger>
          <TabsTrigger value="technicians" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Technicians ({technicians.length})
          </TabsTrigger>
        </TabsList>

        {/* Work Orders Tab */}
        <TabsContent value="workorders" className="space-y-4">
          {workOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-blue-600" />
                      {order.id} - {order.unit}
                    </CardTitle>
                    <CardDescription>{order.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(order.priority)}>
                      {order.priority}
                    </Badge>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Technician</p>
                      <p className="font-semibold">{order.technician}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Bay</p>
                      <p className="font-semibold">{order.bay}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Start Date</p>
                      <p className="font-semibold">{order.startDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Est. Completion</p>
                      <p className="font-semibold">{order.estimatedCompletion}</p>
                    </div>
                  </div>

                  {order.status === "In Progress" && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-gray-600">Progress</p>
                        <p className="text-sm font-semibold">{order.progress}%</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${order.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Estimated Cost</p>
                      <p className="font-semibold text-lg">${order.estimatedCost}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Actual Cost</p>
                      <p className="font-semibold text-lg">${order.actualCost}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm">View Details</Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">Update Progress</Button>
                  <Button variant="outline" size="sm">Add Parts</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.map((item) => {
              const stockStatus = getStockStatus(item.quantity, item.minStock);
              return (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Package className="h-5 w-5 text-blue-600" />
                          {item.partNumber}
                        </CardTitle>
                        <CardDescription>{item.name}</CardDescription>
                      </div>
                      <Badge className={stockStatus.color}>
                        {stockStatus.text}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Category:</span>
                      <span className="font-medium">{item.category}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Quantity:</span>
                      <span className="font-medium">{item.quantity}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Min Stock:</span>
                      <span className="font-medium">{item.minStock}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Unit Cost:</span>
                      <span className="font-medium">${item.unitCost}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Location:</span>
                      <span className="font-medium">{item.location}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Supplier:</span>
                      <span className="font-medium">{item.supplier}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Edit
                      </Button>
                      <Button size="sm" className="flex-1 bg-orange-600 hover:bg-orange-700">
                        Reorder
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Technicians Tab */}
        <TabsContent value="technicians" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {technicians.map((tech) => (
              <Card key={tech.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        {tech.name}
                      </CardTitle>
                      <CardDescription>{tech.specialization}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(tech.status)}>
                      {tech.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Certifications:</p>
                    <div className="flex flex-wrap gap-1">
                      {tech.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Job:</span>
                    <span className="font-medium">{tech.currentJob}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Bay:</span>
                    <span className="font-medium">{tech.bay}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Hours Today:</span>
                    <span className="font-medium">{tech.hoursToday}h</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Efficiency:</span>
                    <span className="font-medium">{tech.efficiency}%</span>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Assign Job
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      View Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShopOperations;
