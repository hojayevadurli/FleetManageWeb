
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Wrench, 
  Search, 
  Calendar,
  DollarSign,
  FileText,
  Clock
} from "lucide-react";

const RepairHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const repairHistory = [
    {
      id: 1,
      unit: "TR-001",
      date: "2024-01-15",
      type: "Engine Repair",
      description: "Replaced turbocharger and oil cooler",
      technician: "John Walker",
      cost: 2850,
      downtime: "3 days",
      parts: ["Turbocharger", "Oil Cooler", "Gaskets"],
      laborHours: 12
    },
    {
      id: 2,
      unit: "TR-002",
      date: "2024-01-10",
      type: "Brake Service",
      description: "Front brake pad replacement and rotor resurfacing",
      technician: "Mike Rodriguez",
      cost: 1250,
      downtime: "1 day",
      parts: ["Brake Pads", "Brake Fluid"],
      laborHours: 6
    },
    {
      id: 3,
      unit: "TR-003",
      date: "2024-01-08",
      type: "Transmission Repair",
      description: "Transmission rebuild - torque converter replacement",
      technician: "Sarah Thompson",
      cost: 4500,
      downtime: "5 days",
      parts: ["Torque Converter", "Filter Kit", "ATF Fluid"],
      laborHours: 18
    },
    {
      id: 4,
      unit: "TR-001",
      date: "2023-12-20",
      type: "Electrical",
      description: "Alternator replacement and wiring harness repair",
      technician: "Dave Martinez",
      cost: 850,
      downtime: "2 days",
      parts: ["Alternator", "Wiring Harness"],
      laborHours: 8
    }
  ];

  const filteredHistory = repairHistory.filter(repair =>
    repair.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repair.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repair.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Repair History</h2>
          <p className="text-gray-600">Track all vehicle repairs and maintenance</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search repairs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
      </div>

      {/* Repair Cards */}
      <div className="space-y-4">
        {filteredHistory.map((repair) => (
          <Card key={repair.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-blue-600" />
                    {repair.unit} - {repair.type}
                  </CardTitle>
                  <CardDescription>{repair.description}</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Cost</p>
                  <p className="text-xl font-bold text-green-600">${repair.cost}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-semibold">{repair.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Downtime</p>
                    <p className="font-semibold">{repair.downtime}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Labor Hours</p>
                  <p className="font-semibold">{repair.laborHours}h</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Technician</p>
                  <p className="font-semibold">{repair.technician}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Parts Used:</p>
                <div className="flex flex-wrap gap-2">
                  {repair.parts.map((part, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-50">
                      {part}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  View Invoice
                </Button>
                <Button variant="outline" size="sm">View Photos</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RepairHistory;
