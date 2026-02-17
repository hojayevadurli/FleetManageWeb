import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { equipmentApi, mapDtoToEquipment } from "@/lib/equipmentApi";
import { Equipment, EquipmentOperationalStatus } from "@/lib/types";

// ...

type VehicleType = "truck" | "trailer";

interface VehicleSelectorProps {
  selectedVehicleId: string;
  selectedVehicleType: string; // "truck" | "trailer"
  onVehicleSelect: (vehicleId: string, vehicleType: VehicleType, unitNumber: string) => void;
}

type Option = {
  id: string;
  label: string;
  unitNumber: string;
  status?: string | number | null;
};

const isActive = (status?: EquipmentOperationalStatus | string | number | null) => {
  if (typeof status === 'number') {
    return status === EquipmentOperationalStatus.Active;
  }
  const s = (status ?? "").toString().trim().toLowerCase();
  return s === "" || s === "active" || s === "1";
};

export default function VehicleSelector({
  selectedVehicleId,
  selectedVehicleType,
  onVehicleSelect,
}: VehicleSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  const entity = (selectedVehicleType?.toLowerCase() === "trailer" ? "trailer" : "truck") as VehicleType;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await equipmentApi.list();
        setEquipment(data.map(mapDtoToEquipment));
      } catch (e) {
        console.error(e);
        toast.error("Failed to load equipment. Check API URL + auth token.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const options: Option[] = useMemo(() => {
    const targetType = entity.toLowerCase(); // "truck" or "trailer"

    const isTrailer = (e: Equipment) => {
      const t = (e.type || "").toLowerCase();
      const c = (e.fleetCategoryName || "").toLowerCase();
      const result = t.includes("trailer") || c.includes("trailer") || t.includes("chassis") || t.includes("reefer") || t.includes("flatbed") || t.includes("dry van");
      // console.log(`Checking isTrailer for ${e.unitNumber} (${t}): ${result}`);
      return result;
    };

    const isTruck = (e: Equipment) => {
      // If it's explicitly a trailer, it's not a truck.
      if (isTrailer(e)) return false;
      // Otherwise, assume it's a truck/powered asset
      return true;
    };

    return equipment
      .filter(e => {
        if (targetType === 'trailer') return isTrailer(e);
        return isTruck(e);
      })
      .map(e => ({
        id: e.id,
        unitNumber: e.unitNumber,
        status: e.status,
        label: [
          `${e.type || (entity === 'truck' ? 'Truck' : 'Trailer')} • ${e.unitNumber}`,
          e.year ? `${e.year}` : null,
          e.make ? e.make : null,
          e.model ? e.model : null,
          `VIN ${e.vin}`,
        ].filter(Boolean).join(" • "),
      }))
      .sort((a, b) => a.unitNumber.localeCompare(b.unitNumber));
  }, [entity, equipment]);

  return (
    <div className="space-y-4">
      {/* Type */}
      <div className="space-y-2">
        <Label>Entity Type *</Label>
        <RadioGroup
          value={entity}
          onValueChange={(val) => {
            const nextType = (val === "trailer" ? "trailer" : "truck") as VehicleType;
            // reset vehicle when switching type
            onVehicleSelect("", nextType, "");
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

      {/* Vehicle */}
      <div className="space-y-2">
        <Label>Select {entity === "truck" ? "Truck" : "Trailer"} *</Label>

        <Select
          value={selectedVehicleId || ""}
          onValueChange={(id) => {
            const opt = options.find(o => o.id === id);
            onVehicleSelect(id, entity, opt?.unitNumber || "");
          }}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder={loading ? "Loading..." : `Select ${entity}`} />
          </SelectTrigger>

          <SelectContent>
            {options.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">
                No active {entity}s found.
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
    </div>
  );
}
