import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { equipmentApi, mapDtoToEquipment } from "@/lib/equipmentApi";
import { Equipment } from "@/lib/types";

interface VehicleSelectorProps {
  entity: string;                 // "truck" | "trailer"
  selectedVehicle: string;        // selected vehicle GUID id
  onEntityChange: (value: string) => void;
  onVehicleChange: (value: string) => void;
}

type Option = {
  id: string;
  label: string;
  unitNumber: string;
  status?: string | null;
};

const isActive = (status?: string | null) => {
  const s = (status ?? "").trim().toLowerCase();
  return s === "" || s === "active";
};

const VehicleSelector = ({ entity, selectedVehicle, onEntityChange, onVehicleChange }: VehicleSelectorProps) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await equipmentApi.list();
        setEquipment(data.map(mapDtoToEquipment));
      } catch (e) {
        console.error(e);
        toast.error("Failed to load equipment from backend");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const options: Option[] = useMemo(() => {
    const targetType = entity.toLowerCase(); // "truck" or "trailer"

    return equipment
      .filter(e => isActive(e.status) && e.type?.toLowerCase() === targetType)
      .map(e => ({
        id: e.id,
        unitNumber: e.unitNumber,
        status: e.status,
        label: [
          `${entity === 'truck' ? 'Truck' : 'Trailer'} • ${e.unitNumber}`,
          e.year ? `${e.year}` : null,
          e.make ? e.make : null,
          e.model ? e.model : null,
          `VIN ${e.vin}`,
        ].filter(Boolean).join(" • "),
      }))
      .sort((a, b) => a.unitNumber.localeCompare(b.unitNumber));
  }, [entity, equipment]);

  return (
    <>
      {/* Entity Type */}
      <div className="space-y-2">
        <Label>Entity Type *</Label>
        <RadioGroup
          value={entity}
          onValueChange={(value) => {
            onEntityChange(value);
            onVehicleChange(""); // Reset selection
          }}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="truck" id="truck" />
            <Label htmlFor="truck">Truck</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="trailer" id="trailer" />
            <Label htmlFor="trailer">Trailer</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Vehicle Selection */}
      {entity && (
        <div className="space-y-2">
          <Label htmlFor="vehicle">Select {entity === "truck" ? "Truck" : "Trailer"} *</Label>

          <Select value={selectedVehicle} onValueChange={onVehicleChange} disabled={loading}>
            <SelectTrigger>
              <SelectValue placeholder={loading ? "Loading..." : `Select ${entity}`} />
            </SelectTrigger>

            <SelectContent>
              {options.length === 0 ? (
                <div className="p-3 text-sm text-gray-500">
                  No {entity}s found.
                </div>
              ) : (
                options.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
};

export default VehicleSelector;
