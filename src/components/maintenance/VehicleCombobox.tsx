
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";

interface Vehicle {
  vehicle_id: string;
  make: string;
  model?: string;
  year: number;
  type: 'truck' | 'trailer';
}

interface VehicleComboboxProps {
  value: string;
  onValueChange: (value: string, vehicleType: 'truck' | 'trailer') => void;
}

const VehicleCombobox = ({ value, onValueChange }: VehicleComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      // Load trucks
      const { data: trucks } = await supabase
        .from('vehicles')
        .select('vehicle_id, make, model, year')
        .eq('status', 'active');

      // Load trailers  
      const { data: trailers } = await supabase
        .from('trailers')
        .select('vehicle_id, make, year')
        .eq('status', 'active');

      const allVehicles: Vehicle[] = [
        ...(trucks || []).map(t => ({ ...t, type: 'truck' as const })),
        ...(trailers || []).map(t => ({ ...t, type: 'trailer' as const, model: undefined }))
      ];

      setVehicles(allVehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicle = vehicles.find(v => v.vehicle_id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedVehicle
            ? `${selectedVehicle.vehicle_id} - ${selectedVehicle.year} ${selectedVehicle.make}${selectedVehicle.model ? ' ' + selectedVehicle.model : ''}`
            : "Select vehicle..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search vehicles..." />
          <CommandList>
            <CommandEmpty>
              {loading ? "Loading vehicles..." : "No vehicles found."}
            </CommandEmpty>
            <CommandGroup>
              {vehicles.map((vehicle) => (
                <CommandItem
                  key={vehicle.vehicle_id}
                  value={vehicle.vehicle_id}
                  onSelect={(currentValue) => {
                    const selected = vehicles.find(v => v.vehicle_id === currentValue);
                    if (selected) {
                      onValueChange(currentValue, selected.type);
                      setOpen(false);
                    }
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === vehicle.vehicle_id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{vehicle.vehicle_id}</span>
                    <span className="text-sm text-gray-500">
                      {vehicle.year} {vehicle.make}{vehicle.model ? ' ' + vehicle.model : ''} ({vehicle.type})
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default VehicleCombobox;
