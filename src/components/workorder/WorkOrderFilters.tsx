import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { WorkOrderDto, WorkOrderStatus } from "@/lib/types";

type StatusFilter = "all" | WorkOrderDto["status"];

interface WorkOrderFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;

  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;

  // optional: control debounce delay
  debounceMs?: number;
}

const WorkOrderFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  debounceMs = 250
}: WorkOrderFiltersProps) => {
  // local input state for debounce
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // keep local in sync when parent updates (e.g., reset)
  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  // debounce propagation to parent
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (localSearch !== searchTerm) onSearchChange(localSearch);
    }, debounceMs);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch, debounceMs]);

  const clearSearch = () => {
    setLocalSearch("");
    onSearchChange("");
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />

        <Input
          placeholder="Search by WO #, asset, summary…"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-10 pr-10"
        />

        {localSearch.trim().length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-gray-500" />
          </Button>
        )}
      </div>

      <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as StatusFilter)}>
        <SelectTrigger className="w-full md:w-44">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {Object.keys(WorkOrderStatus)
            .filter((key) => isNaN(Number(key))) // Skip reverse mappings (0, 1, etc)
            .map((status) => (
              <SelectItem key={status} value={status}>
                {status.replace(/([A-Z])/g, ' $1').trim()} {/* "InProcess" -> "In Process" */}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default WorkOrderFilters;
