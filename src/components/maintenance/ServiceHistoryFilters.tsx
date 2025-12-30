
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import VehicleSelector from "./VehicleSelector";

interface ServiceHistoryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedVehicle: string;
  onVehicleChange: (value: string) => void;
  serviceTypeFilter: string;
  onServiceTypeChange: (value: string) => void;
  dateRangeFilter: string;
  onDateRangeChange: (value: string) => void;
  customDateRange?: { from: Date | null; to: Date | null };
  onCustomDateRangeChange?: (range: { from: Date | null; to: Date | null }) => void;
}

const ServiceHistoryFilters = ({
  searchTerm,
  onSearchChange,
  selectedVehicle,
  onVehicleChange,
  serviceTypeFilter,
  onServiceTypeChange,
  dateRangeFilter,
  onDateRangeChange,
  customDateRange,
  onCustomDateRangeChange
}: ServiceHistoryFiltersProps) => {
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const handleDateRangeChange = (value: string) => {
    onDateRangeChange(value);
    if (value !== "custom") {
      setShowCustomDatePicker(false);
      onCustomDateRangeChange?.({ from: null, to: null });
    } else {
      setShowCustomDatePicker(true);
    }
  };

  const clearCustomDateRange = () => {
    onCustomDateRangeChange?.({ from: null, to: null });
    onDateRangeChange("all");
    setShowCustomDatePicker(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search service history..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <VehicleSelector
          value={selectedVehicle}
          onValueChange={onVehicleChange}
        />

        <Select value={serviceTypeFilter} onValueChange={onServiceTypeChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Service Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="preventive">Preventive</SelectItem>
            <SelectItem value="repair">Repair</SelectItem>
            <SelectItem value="inspection">Inspection</SelectItem>
            <SelectItem value="oil_change">Oil Change</SelectItem>
            <SelectItem value="brake_service">Brake Service</SelectItem>
            <SelectItem value="tire_service">Tire Service</SelectItem>
            <SelectItem value="engine">Engine Service</SelectItem>
            <SelectItem value="transmission">Transmission</SelectItem>
            <SelectItem value="electrical">Electrical</SelectItem>
            <SelectItem value="body_work">Body Work</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateRangeFilter} onValueChange={handleDateRangeChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="last_week">Last Week</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
            <SelectItem value="last_quarter">Last Quarter</SelectItem>
            <SelectItem value="last_year">Last Year</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Custom Date Range Picker */}
      {showCustomDatePicker && (
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">From:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange?.from ? format(customDateRange.from, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customDateRange?.from || undefined}
                  onSelect={(date) => 
                    onCustomDateRangeChange?.({ 
                      from: date || null, 
                      to: customDateRange?.to || null 
                    })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">To:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange?.to ? format(customDateRange.to, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customDateRange?.to || undefined}
                  onSelect={(date) => 
                    onCustomDateRangeChange?.({ 
                      from: customDateRange?.from || null, 
                      to: date || null 
                    })
                  }
                  disabled={(date) => 
                    customDateRange?.from ? date < customDateRange.from : false
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button variant="ghost" size="sm" onClick={clearCustomDateRange}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ServiceHistoryFilters;
