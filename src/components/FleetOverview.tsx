import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Truck,
  AlertCircle,
  CheckCircle,
  TrendingUp,
} from "lucide-react";

interface FleetOverviewProps {
  totalVehicles: number;
  activeVehicles: number;
  inMaintenance: number;
  available: number;

  capacityUsedPercent?: number;
  avgIdleHoursPerDay?: number;
  avgMilesPerMonth?: number;

  maintenanceDueCount?: number;
  dotInspectionsDueCount?: number;
  licenseRenewalsDueCount?: number;

  onAddVehicle?: () => void;
  onScheduleService?: () => void;
  onCompleteInspection?: () => void;
  onViewReports?: () => void;
}

const FleetOverview = ({
  totalVehicles,
  activeVehicles,
  inMaintenance,
  available,
  capacityUsedPercent,
  avgIdleHoursPerDay,
  avgMilesPerMonth,
  maintenanceDueCount,
  dotInspectionsDueCount,
  licenseRenewalsDueCount,
  onAddVehicle,
  onScheduleService,
  onCompleteInspection,
  onViewReports,
}: FleetOverviewProps) => {
  const utilization =
    totalVehicles > 0
      ? Math.round((activeVehicles / totalVehicles) * 100)
      : 0;

  const utilizationColor =
    utilization > 85
      ? "bg-green-600"
      : utilization > 60
      ? "bg-yellow-500"
      : "bg-red-500";

  const capacityUsed = capacityUsedPercent ?? 0;
  const idleTime = avgIdleHoursPerDay ?? 0;
  const avgMiles = avgMilesPerMonth ?? 0;

  const maintenanceDue = maintenanceDueCount ?? 0;
  const dotDue = dotInspectionsDueCount ?? 0;
  const licenseDue = licenseRenewalsDueCount ?? 0;

  return (
    <div className="space-y-6">
      {/* Fleet Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Fleet Status */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Fleet Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">In Maintenance</span>
                <Badge className="bg-red-100 text-red-800">
                  {inMaintenance}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Available</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {available}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Fleet</span>
                <Badge className="bg-gray-100 text-gray-800">
                  {totalVehicles}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Utilization */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Fleet Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">
                    Overall Utilization
                  </span>
                  <span className="font-bold text-lg text-green-700">
                    {utilization}%
                  </span>
                </div>
                <Progress
                  value={utilization}
                  className="h-2"
                  indicatorClassName={utilizationColor}
                />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active:</span>
                  <span className="font-semibold text-gray-800">
                    {activeVehicles} / {totalVehicles}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-semibold text-gray-800">
                    {capacityUsed}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Idle Time:</span>
                  <span className="font-semibold text-gray-800">
                    {idleTime.toFixed(1)}h/d
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Miles:</span>
                  <span className="font-semibold text-gray-800">
                    {avgMiles.toLocaleString()}/mo
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Maintenance Due
                </span>
                <Badge className="bg-orange-100 text-orange-800">
                  {maintenanceDue}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  DOT Inspections
                </span>
                <Badge className="bg-red-100 text-red-800">
                  {dotDue}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  License Renewals
                </span>
                <Badge className="bg-yellow-100 text-yellow-800">
                  {licenseDue}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common fleet management tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={onAddVehicle}
            >
              <div className="text-center">
                <Truck className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h4 className="font-medium">Add Vehicle</h4>
                <p className="text-sm text-gray-600">
                  Register new equipment
                </p>
              </div>
            </Card>

            <Card
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={onScheduleService}
            >
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <h4 className="font-medium">Schedule Service</h4>
                <p className="text-sm text-gray-600">Plan maintenance</p>
              </div>
            </Card>

            <Card
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={onCompleteInspection}
            >
              <div className="text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h4 className="font-medium">Complete Inspection</h4>
                <p className="text-sm text-gray-600">
                  Record DOT inspection
                </p>
              </div>
            </Card>

            <Card
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={onViewReports}
            >
              <div className="text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h4 className="font-medium">View Reports</h4>
                <p className="text-sm text-gray-600">
                  Check performance
                </p>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetOverview;
