import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import type { CheckedState } from "@radix-ui/react-checkbox";
import { Truck, Trash2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/Api.temp";

import VehicleCard from "./VehicleCard";

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

interface VehicleGridProps {
  vehicles: Vehicle[];
  totalVehicles: number;
  onVehicleUpdated?: () => void;
  onVehicleClick?: (vehicle: Vehicle) => void;
}

const VehicleGrid = ({
  vehicles,
  totalVehicles,
  onVehicleUpdated,
  onVehicleClick,
}: VehicleGridProps) => {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Clean up selection when the list changes
  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => vehicles.some((v) => v.id === id))
    );
  }, [vehicles]);

  if (vehicles.length === 0) {
    return (
      <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300">
        <div className="text-gray-500 space-y-4">
          <Truck className="h-16 w-16 mx-auto text-gray-400" />
          <div className="text-xl font-medium">
            {totalVehicles === 0
              ? "Your fleet is empty"
              : "No vehicles match your search"}
          </div>
          <div className="text-gray-400">
            {totalVehicles === 0
              ? "Add your first vehicle to get started with fleet management."
              : "Try adjusting your search criteria or filters."}
          </div>
        </div>
      </Card>
    );
  }

  const allSelected = useMemo(
    () =>
      vehicles.length > 0 &&
      selectedIds.length > 0 &&
      selectedIds.length === vehicles.length,
    [vehicles, selectedIds]
  );

  const someSelected = useMemo(
    () =>
      selectedIds.length > 0 && selectedIds.length < vehicles.length,
    [vehicles, selectedIds]
  );

  const headerChecked: CheckedState = allSelected
    ? true
    : someSelected
      ? "indeterminate"
      : false;

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(vehicles.map((v) => v.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      setBulkDeleting(true);

      await api.post("/trucks/bulk-delete", {
        truckIds: selectedIds,
      });

      toast({
        title: "Trucks deleted",
        description: `${selectedIds.length} truck(s) were removed from your fleet.`,
      });

      setSelectedIds([]);
      onVehicleUpdated?.();
    } catch (error: any) {
      console.error("Failed to bulk delete trucks", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.title ||
        error?.message ||
        "Failed to delete trucks";

      toast({
        title: "Error deleting trucks",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Checkbox
            checked={headerChecked}
            onCheckedChange={(checked) =>
              toggleSelectAll(checked === true)
            }
          />
          <span>Select all</span>
          {selectedIds.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {selectedIds.length} selected
            </span>
          )}
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={selectedIds.length === 0}
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete selected
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {selectedIds.length} selected truck
                {selectedIds.length > 1 ? "s" : ""}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The selected trucks will be
                removed from your fleet. Historical records (like work
                orders) will remain in the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={bulkDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
              >
                {bulkDeleting
                  ? "Deleting..."
                  : `Delete ${selectedIds.length} truck${selectedIds.length > 1 ? "s" : ""
                  }`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Grid of cards with per-card checkbox */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => {
          const isSelected = selectedIds.includes(vehicle.id);

          return (
            <div
              key={vehicle.id}
              className="relative group cursor-pointer"
              onClick={(e) => {
                // Prevent navigation if clicking checkbox or actions
                if ((e.target as HTMLElement).closest('[role="checkbox"]') || (e.target as HTMLElement).closest('button')) {
                  return;
                }
                onVehicleClick?.(vehicle);
              }}
            >
              <div className="absolute top-2 left-2 z-10 bg-white/80 rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    toggleRow(vehicle.id, checked === true)
                  }
                />
              </div>
              <VehicleCard
                vehicle={vehicle}
                onVehicleUpdated={onVehicleUpdated}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VehicleGrid;
