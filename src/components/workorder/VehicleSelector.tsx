import { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Truck, RectangleHorizontal } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

type VehicleType = "truck" | "trailer";

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
  id: string;          // GUID
  type: VehicleType;
  number: string;
  vin: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  status?: string | null;
};

interface VehicleSelectorProps {
  selectedVehicleId: string;             // GUID from backend
  selectedVehicleType: string;           // "truck" | "trailer"
  onVehicleSelect: (vehicleId: string, vehicleType: string) => void;
}

const isActive = (status?: string | null) => {
  const s = (status ?? "").trim().toLowerCase();
  return s === "" || s === "active";
};

const VehicleSelector = ({ selectedVehicleId, selectedVehicleType, onVehicleSelect }: VehicleSelectorProps) => {
  const [trucks, setTrucks] = useState<TruckDto[]>([]);
  const [trailers, setTrailers] = useState<TrailerDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);

      const [trucksRes, trailersRes] = await Promise.all([
        api.get<TruckDto[]>("/trucks"),
        api.get<TrailerDto[]>("/trailers"),
      ]);

      setTrucks(trucksRes.data ?? []);
      setTrailers(trailersRes.data ?? []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Failed to load vehicles. Check API URL + auth token.");
    } finally {
      setLoading(false);
    }
  };

  const truckOptions: Option[] = useMemo(
    () =>
      (trucks ?? [])
        .filter((t) => isActive(t.status))
        .map((t) => ({
          id: t.id,
          type: "truck",
          number: t.number,
          vin: t.vin,
          year: t.year ?? null,
          make: t.make ?? null,
          model: t.model ?? null,
          status: t.status ?? null,
        }))
        .sort((a, b) => a.number.localeCompare(b.number)),
    [trucks]
  );

  const trailerOptions: Option[] = useMemo(
    () =>
      (trailers ?? [])
        .filter((t) => isActive(t.status))
        .map((t) => ({
          id: t.id,
          type: "trailer",
          number: t.number,
          vin: t.vin,
          year: t.year ?? null,
          make: t.make ?? null,
          model: t.model ?? null,
          status: t.status ?? null,
        }))
        .sort((a, b) => a.number.localeCompare(b.number)),
    [trailers]
  );

  const handleVehicleSelect = (value: string) => {
    const [vehicleType, vehicleId] = value.split(":");
    onVehicleSelect(vehicleId, vehicleType);
  };

  const getSelectedVehicleDisplay = () => {
    if (!selectedVehicleId || !selectedVehicleType) return null;

    const list = selectedVehicleType === "trailer" ? trailerOptions : truckOptions;
    const v = list.find((x) => x.id === selectedVehicleId);

    if (!v) return null;

    return (
      <div className="flex items-center gap-2">
        {v.type === "truck" ? <Truck className="h-4 w-4" /> : <RectangleHorizontal className="h-4 w-4" />}
        <span className="font-medium">{v.number}</span>
        <span className="text-gray-500">
          ({[v.year, v.make, v.model].filter(Boolean).join(" ")})
        </span>
        <Badge variant="outline" className="text-xs">
          {v.type}
        </Badge>
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <Label>Vehicle *</Label>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Loading vehicles..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor="vehicle">Vehicle *</Label>
      <Select
        value={selectedVehicleId && selectedVehicleType ? `${selectedVehicleType}:${selectedVehicleId}` : ""}
        onValueChange={handleVehicleSelect}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a vehicle">
            {getSelectedVehicleDisplay()}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          {truckOptions.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-sm font-semibold text-gray-500 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Trucks
              </div>
              {truckOptions.map((t) => (
                <SelectItem key={`truck:${t.id}`} value={`truck:${t.id}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t.number}</span>
                    <span className="text-gray-500">
                      {[t.year, t.make, t.model].filter(Boolean).join(" ")}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </>
          )}

          {trailerOptions.length > 0 && (
            <>
              {truckOptions.length > 0 && <div className="border-t my-1" />}
              <div className="px-2 py-1.5 text-sm font-semibold text-gray-500 flex items-center gap-2">
                <RectangleHorizontal className="h-4 w-4" />
                Trailers
              </div>
              {trailerOptions.map((t) => (
                <SelectItem key={`trailer:${t.id}`} value={`trailer:${t.id}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t.number}</span>
                    <span className="text-gray-500">
                      {[t.year, t.make, t.model].filter(Boolean).join(" ")}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </>
          )}

          {truckOptions.length === 0 && trailerOptions.length === 0 && (
            <div className="px-2 py-1.5 text-sm text-gray-500">No active vehicles found</div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default VehicleSelector;
