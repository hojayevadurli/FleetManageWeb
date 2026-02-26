import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Edit,
  Calendar,
  Wrench,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Fuel,
  Clock,
  User,
  Navigation,
  Info,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import EditVehicleDialog from "../EditVehicleDialog";
import VehicleSyncButton from "./VehicleSyncButton";
import VehicleLocationDialog from "./VehicleLocationDialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/Api.temp";

interface Vehicle {
  id: string;
  vehicle_id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  motive_vehicle_id?: string;
  current_location?: any;
  last_location_update?: string;
  odometer_reading?: number;
  engine_hours?: number;
  fuel_level?: number;
  status_details?: string;
  driver_assigned?: string;
}

interface VehicleCardProps {
  vehicle: Vehicle;
  onVehicleUpdated?: () => void;
}

const VehicleCard = ({ vehicle, onVehicleUpdated }: VehicleCardProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300";
      case "inactive":
        return "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-300";
      default:
        return "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border-slate-300";
    }
  };

  const getConditionIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "inactive":
        return <AlertTriangle className="h-4 w-4 text-slate-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-slate-500" />;
    }
  };

  const getFuelLevelColor = (fuelLevel?: number) => {
    if (!fuelLevel) return "text-gray-400";
    if (fuelLevel < 25) return "text-red-500";
    if (fuelLevel < 50) return "text-yellow-500";
    return "text-green-500";
  };

  const formatLastUpdate = (timestamp?: string) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleEditClick = () => {
    setEditDialogOpen(true);
  };

  const handleLocationClick = () => {
    setLocationDialogOpen(true);
  };

  const handleVehicleUpdated = () => {
    onVehicleUpdated?.();
  };

  const handleSyncComplete = () => {
    onVehicleUpdated?.();
  };

  const openInGoogleMaps = () => {
    if (vehicle.current_location?.latitude && vehicle.current_location?.longitude) {
      const url = `https://www.google.com/maps?q=${vehicle.current_location.latitude},${vehicle.current_location.longitude}`;
      window.open(url, "_blank");
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await api.delete(`/trucks/${vehicle.id}`);

      toast({
        title: "Vehicle deleted",
        description: `Truck ${vehicle.vehicle_id} was removed from your fleet.`,
      });

      onVehicleUpdated?.();
    } catch (error: any) {
      console.error("Failed to delete truck", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        error?.message ||
        "Failed to delete vehicle";

      toast({
        title: "Error deleting vehicle",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="group hover:shadow-2xl transition-all duration-300 hover:scale-105 border-0 shadow-lg bg-white overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-3 group-hover:text-blue-600 transition-colors">
                <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
                {vehicle.vehicle_id}
                {vehicle.motive_vehicle_id && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    Motive
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-base font-medium text-gray-600">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </CardDescription>
            </div>
            <Badge
              className={`${getStatusColor(
                vehicle.status
              )} font-semibold px-3 py-1 rounded-full border`}
            >
              {vehicle.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">VIN:</span>
              <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                {vehicle.vin}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Status:
              </span>
              <div className="flex items-center gap-2">
                {getConditionIcon(vehicle.status)}
                <span className="text-sm font-semibold capitalize">
                  {vehicle.status}
                </span>
              </div>
            </div>

            {/* Enhanced Location Display */}
            {vehicle.current_location?.latitude &&
              vehicle.current_location?.longitude && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-gray-600">
                        Location:
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={openInGoogleMaps}
                      >
                        <Navigation className="h-3 w-3 mr-1" />
                        Maps
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={handleLocationClick}
                      >
                        <Info className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    <div className="font-mono">
                      {vehicle.current_location.latitude.toFixed(4)},{" "}
                      {vehicle.current_location.longitude.toFixed(4)}
                    </div>
                    {vehicle.current_location.address && (
                      <div className="mt-1 text-gray-500">
                        {vehicle.current_location.address}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      Updated {formatLastUpdate(vehicle.last_location_update)}
                    </span>
                  </div>
                </div>
              )}

            {/* Motive Integration Data */}
            {vehicle.motive_vehicle_id && (
              <>
                {vehicle.driver_assigned && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">
                        Driver:
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {vehicle.driver_assigned}
                    </span>
                  </div>
                )}

                {vehicle.fuel_level !== null &&
                  vehicle.fuel_level !== undefined && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Fuel
                          className={`h-4 w-4 ${getFuelLevelColor(
                            vehicle.fuel_level
                          )}`}
                        />
                        <span className="text-sm font-medium text-gray-600">
                          Fuel:
                        </span>
                      </div>
                      <span
                        className={`text-sm font-semibold ${getFuelLevelColor(
                          vehicle.fuel_level
                        )}`}
                      >
                        {vehicle.fuel_level}%
                      </span>
                    </div>
                  )}

                {vehicle.odometer_reading && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">
                        Odometer:
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {vehicle.odometer_reading.toLocaleString()} mi
                    </span>
                  </div>
                )}

                {vehicle.engine_hours && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">
                        Engine Hours:
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {vehicle.engine_hours} hrs
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center gap-2 pt-1">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-600">Added:</span>
                <span className="text-sm font-medium">
                  {new Date(vehicle.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
              onClick={handleEditClick}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>

            {vehicle.motive_vehicle_id ? (
              <VehicleSyncButton
                vehicleId={vehicle.id}
                motiveVehicleId={vehicle.motive_vehicle_id}
                onSyncComplete={handleSyncComplete}
                variant="outline"
                size="sm"
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-2 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200"
              >
                <Wrench className="h-4 w-4 mr-2" />
                Service
              </Button>
            )}

            {/* Single delete for this vehicle */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="border-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete truck {vehicle.vehicle_id}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove this truck from your fleet.
                    Historical records (like work orders) will remain in the
                    system.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete Truck"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <EditVehicleDialog
        vehicle={vehicle}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onVehicleUpdated={handleVehicleUpdated}
      />

      <VehicleLocationDialog
        vehicle={vehicle}
        open={locationDialogOpen}
        onOpenChange={setLocationDialogOpen}
      />
    </>
  );
};

export default VehicleCard;
