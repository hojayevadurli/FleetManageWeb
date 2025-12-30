
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  Calendar,
  DollarSign,
  Wrench,
  Clock
} from "lucide-react";

interface ServiceRecord {
  id: string;
  service_date: string;
  total_cost?: number;
  work_completed: string;
}

interface Vehicle {
  vehicle_id: string;
  make: string;
  model?: string;
  year: number;
  type: 'truck' | 'trailer';
  vin?: string;
}

interface VehicleSummaryProps {
  vehicle: Vehicle;
  serviceRecords: ServiceRecord[];
}

const VehicleSummary = ({ vehicle, serviceRecords }: VehicleSummaryProps) => {
  const totalCost = serviceRecords.reduce((sum, record) => 
    sum + (record.total_cost || 0), 0
  );
  
  const averageCost = serviceRecords.length > 0 ? totalCost / serviceRecords.length : 0;
  
  const lastServiceDate = serviceRecords.length > 0 
    ? new Date(Math.max(...serviceRecords.map(r => new Date(r.service_date).getTime())))
    : null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-blue-600" />
          {vehicle.vehicle_id} - Service Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Vehicle Details</p>
              <p className="font-semibold">{vehicle.year} {vehicle.make} {vehicle.model}</p>
              <Badge variant="outline" className="capitalize mt-1">
                {vehicle.type}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Total Services</p>
              <p className="font-semibold">{serviceRecords.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Total Cost</p>
              <p className="font-semibold">${totalCost.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Avg: ${averageCost.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Last Service</p>
              <p className="font-semibold">
                {lastServiceDate ? formatDate(lastServiceDate) : 'No services'}
              </p>
            </div>
          </div>
        </div>

        {vehicle.vin && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">VIN: <span className="font-mono">{vehicle.vin}</span></p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VehicleSummary;
