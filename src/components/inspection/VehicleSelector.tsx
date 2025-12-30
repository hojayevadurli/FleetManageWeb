import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/Api";

interface VehicleSelectorProps {
  entity: string;                 // "truck" | "trailer"
  selectedVehicle: string;        // selected vehicle GUID id
  onEntityChange: (value: string) => void;
  onVehicleChange: (value: string) => void;
}

type TruckDto = {
  id: string;
  number: string;
  vin: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  status?: string | null;
};

type TrailerDto = {
  id: string;
  number: string;
  vin: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  status?: string | null;
};

type Option = {
  id: string;
  label: string;
  number: string;
  status?: string | null;
};

const isActive = (status?: string | null) => {
  const s = (status ?? "").trim().toLowerCase();
  return s === "" || s === "active";
};

const VehicleSelector = ({ entity, selectedVehicle, onEntityChange, onVehicleChange }: VehicleSelectorProps) => {
  const [trucks, setTrucks] = useState<TruckDto[]>([]);
  const [trailers, setTrailers] = useState<TrailerDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const [tRes, trRes] = await Promise.all([
          api.get<TruckDto[]>("/trucks"),
          api.get<TrailerDto[]>("/trailers"),
        ]);

        setTrucks(tRes.data ?? []);
        setTrailers(trRes.data ?? []);
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
    if (entity === "truck") {
      return trucks
        .filter(t => isActive(t.status))
        .map(t => ({
          id: t.id,
          number: t.number,
          status: t.status ?? null,
          label: [
            `Truck • ${t.number}`,
            t.year ? `${t.year}` : null,
            t.make ? t.make : null,
            t.model ? t.model : null,
            `VIN ${t.vin}`,
          ].filter(Boolean).join(" • "),
        }))
        .sort((a, b) => a.number.localeCompare(b.number));
    }

    if (entity === "trailer") {
      return trailers
        .filter(t => isActive(t.status))
        .map(t => ({
          id: t.id,
          number: t.number,
          status: t.status ?? null,
          label: [
            `Trailer • ${t.number}`,
            t.year ? `${t.year}` : null,
            t.make ? t.make : null,
            t.model ? t.model : null,
            `VIN ${t.vin}`,
          ].filter(Boolean).join(" • "),
        }))
        .sort((a, b) => a.number.localeCompare(b.number));
    }

    return [];
  }, [entity, trucks, trailers]);

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
