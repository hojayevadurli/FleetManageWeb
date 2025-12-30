import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Clock,
  Wrench,
  Calendar,
  BarChart3,
} from "lucide-react";

interface ServiceRecord {
  id: string;
  vehicleId: string;      // backend Truck/Trailer ID
  serviceDate: string;
  description: string;
  totalCost?: number;
  laborHours?: number;
  mileage?: number;
  shopName?: string;
}

interface Vehicle {
  id: string;             // backend Truck/Trailer ID
  number: string;         // unit number
  make?: string;
  model?: string;
  year?: number | null;
  type: "truck" | "trailer";
  status?: string | null;
}

interface VehicleComparisonProps {
  records: ServiceRecord[];
  vehicles: Vehicle[];
}

const VehicleComparison = ({ records, vehicles }: VehicleComparisonProps) => {
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);

  const addVehicleToComparison = (vehicleId: string) => {
    if (!selectedVehicles.includes(vehicleId) && selectedVehicles.length < 4) {
      setSelectedVehicles((prev) => [...prev, vehicleId]);
    }
  };

  const removeVehicleFromComparison = (vehicleId: string) => {
    setSelectedVehicles((prev) => prev.filter((id) => id !== vehicleId));
  };

  const getVehicleMetrics = (vehicleId: string) => {
    const vehicleRecords = records.filter(
      (record) => record.vehicleId === vehicleId
    );
    const vehicle = vehicles.find((v) => v.id === vehicleId);

    const totalCost = vehicleRecords.reduce(
      (sum, record) => sum + (record.totalCost || 0),
      0
    );
    const totalServices = vehicleRecords.length;
    const avgCostPerService =
      totalServices > 0 ? totalCost / totalServices : 0;

    const totalHours = vehicleRecords.reduce(
      (sum, record) => sum + (record.laborHours || 0),
      0
    );

    const sortedRecords = [...vehicleRecords].sort(
      (a, b) =>
        new Date(b.serviceDate).getTime() -
        new Date(a.serviceDate).getTime()
    );
    const lastServiceDate =
      sortedRecords.length > 0 ? sortedRecords[0].serviceDate : null;

    const serviceTypes: Record<string, number> = {};
    vehicleRecords.forEach((record) => {
      const workCompleted = record.description.toLowerCase();
      let category = "Other";

      if (workCompleted.includes("oil")) category = "Oil Changes";
      else if (workCompleted.includes("brake")) category = "Brake Service";
      else if (workCompleted.includes("tire")) category = "Tire Service";
      else if (workCompleted.includes("inspection")) category = "Inspections";
      else if (workCompleted.includes("preventive")) category = "Preventive";
      else if (workCompleted.includes("repair")) category = "Repairs";

      serviceTypes[category] = (serviceTypes[category] || 0) + 1;
    });

    const mostCommonService =
      Object.entries(serviceTypes).sort(([, a], [, b]) => b - a)[0]?.[0] ??
      "None";

    return {
      vehicle,
      totalCost,
      totalServices,
      avgCostPerService,
      totalHours,
      lastServiceDate,
      mostCommonService,
    };
  };

  const getComparisonChartData = () => {
    return selectedVehicles.map((vehicleId) => {
      const metrics = getVehicleMetrics(vehicleId);
      return {
        vehicle:
          metrics.vehicle?.number ||
          metrics.vehicle?.id ||
          vehicleId,
        totalCost: metrics.totalCost,
        services: metrics.totalServices,
        avgCost: metrics.avgCostPerService,
        hours: metrics.totalHours,
      };
    });
  };

  const chartConfig = {
    totalCost: {
      label: "Total Cost",
      color: "#2563eb",
    },
    services: {
      label: "Services",
      color: "#60a5fa",
    },
  };

  const availableVehicles = vehicles.filter(
    (v) => !selectedVehicles.includes(v.id)
  );

  return (
    <div className="space-y-6">
      {/* Vehicle Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Vehicle Comparison Tool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <Select onValueChange={addVehicleToComparison}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Add vehicle to compare" />
              </SelectTrigger>
              <SelectContent>
                {availableVehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.number} — {vehicle.year ?? "Year?"}{" "}
                    {vehicle.make} {vehicle.model} (
                    {vehicle.type === "truck" ? "Truck" : "Trailer"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2">
              {selectedVehicles.map((vehicleId) => {
                const vehicle = vehicles.find((v) => v.id === vehicleId);
                if (!vehicle) return null;

                return (
                  <Badge
                    key={vehicleId}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    {vehicle.number}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => removeVehicleFromComparison(vehicleId)}
                    >
                      ×
                    </Button>
                  </Badge>
                );
              })}
            </div>
          </div>

          {selectedVehicles.length === 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              Select vehicles to compare their maintenance costs and
              service history.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {selectedVehicles.length > 0 && (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedVehicles.map((vehicleId) => {
              const metrics = getVehicleMetrics(vehicleId);
              const v = metrics.vehicle;

              return (
                <Card key={vehicleId}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      {v?.number ?? v?.id ?? "Vehicle"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {v?.year ?? ""} {v?.make} {v?.model}{" "}
                      {v?.type ? `• ${v.type}` : ""}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Cost
                        </p>
                        <p className="font-semibold">
                          ${metrics.totalCost.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Services
                        </p>
                        <p className="font-semibold">
                          {metrics.totalServices}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Avg Cost
                        </p>
                        <p className="font-semibold">
                          ${metrics.avgCostPerService.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Hours
                        </p>
                        <p className="font-semibold">
                          {metrics.totalHours.toFixed(1)}h
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Last Service
                        </p>
                        <p className="font-semibold text-xs">
                          {metrics.lastServiceDate
                            ? new Date(
                                metrics.lastServiceDate
                              ).toLocaleDateString()
                            : "Never"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Most Common
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {metrics.mostCommonService}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getComparisonChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="vehicle" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="totalCost"
                      fill="#2563eb"
                      name="Total Cost ($)"
                    />
                    <Bar
                      dataKey="services"
                      fill="#60a5fa"
                      name="Services"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default VehicleComparison;
