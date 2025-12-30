import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, Plus } from "lucide-react";
import AddVehicleDialog from "../AddVehicleDialog";

interface VehicleFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  onVehicleAdded: () => void;
}

const VehicleFilters = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onVehicleAdded,
}: VehicleFiltersProps) => {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleVehicleAdded = () => {
    onVehicleAdded?.();
    setShowAddDialog(false);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search by unit #, make, model, VIN, or driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl transition-all duration-200"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-12 border-2 border-gray-200 rounded-xl">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 h-12 px-6"
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

export default VehicleFilters;
