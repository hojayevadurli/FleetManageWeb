
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

interface UpcomingMaintenanceFiltersProps {
  vehicleFilter: string;
  onVehicleChange: (value: string) => void;
  priorityFilter: string;
  onPriorityChange: (value: string) => void;
  dateRangeFilter: string;
  onDateRangeChange: (value: string) => void;
}

const UpcomingMaintenanceFilters = ({
  vehicleFilter,
  onVehicleChange,
  priorityFilter,
  onPriorityChange,
  dateRangeFilter,
  onDateRangeChange
}: UpcomingMaintenanceFiltersProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <Select value={vehicleFilter} onValueChange={onVehicleChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Vehicle Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              <SelectItem value="truck">Trucks</SelectItem>
              <SelectItem value="trailer">Trailers</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={onPriorityChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRangeFilter} onValueChange={onDateRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Next 7 Days</SelectItem>
              <SelectItem value="30days">Next 30 Days</SelectItem>
              <SelectItem value="90days">Next 90 Days</SelectItem>
              <SelectItem value="all">All Upcoming</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingMaintenanceFilters;
