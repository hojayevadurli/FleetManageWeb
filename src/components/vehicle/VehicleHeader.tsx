import { useState } from "react";
import { Truck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AddVehicleDialog from "../AddVehicleDialog";
import BulkSyncButton from "./BulkSyncButton";

interface VehicleHeaderProps {
  totalVehicles: number;
  activeVehicles: number;
  onRefresh?: () => void;
}

const VehicleHeader = ({
  totalVehicles,
  activeVehicles,
  onRefresh,
}: VehicleHeaderProps) => {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleVehicleAdded = () => {
    onRefresh?.();
    setShowAddDialog(false);
  };

  const handleBulkSyncComplete = () => {
    onRefresh?.();
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Truck className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Fleet Overview
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
              <span className="flex items-center gap-1">
                <span className="font-semibold text-blue-600">
                  {totalVehicles}
                </span>
                Total Vehicles
              </span>
              <span className="text-gray-400">•</span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-green-600">
                  {activeVehicles}
                </span>
                Active
              </span>
              <span className="text-gray-400">•</span>
              <span className="flex items-center gap-1">
                <span className="font-semibold text-gray-600">
                  {totalVehicles - activeVehicles}
                </span>
                Inactive
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <BulkSyncButton onSyncComplete={handleBulkSyncComplete} />
          <Button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Button>
        </div>
      </div>

      <AddVehicleDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onVehicleAdded={handleVehicleAdded}
      />
    </>
  );
};

export default VehicleHeader;
