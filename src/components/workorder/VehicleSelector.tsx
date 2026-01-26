import { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Truck } from "lucide-react";
import { toast } from "sonner";
import { equipmentApi, mapDtoToEquipment } from "@/lib/equipmentApi";
import { Equipment, EquipmentOperationalStatus } from "@/lib/types";

interface VehicleSelectorProps {
  selectedVehicleId: string;
  selectedVehicleType: string;
  onVehicleSelect: (vehicleId: string, vehicleType: string, unitNumber: string) => void;
  equipment?: Equipment[]; // Optional prop to avoid redundant fetching
}

const isSelectable = (status: EquipmentOperationalStatus) => {
  // Allow Active and In Shop. Exclude Out of Service and Sold.
  return status === EquipmentOperationalStatus.Active ||
    status === EquipmentOperationalStatus.InShop;
};

const VehicleSelector = ({
  selectedVehicleId,
  selectedVehicleType,
  onVehicleSelect,
  equipment: passedEquipment
}: VehicleSelectorProps) => {
  const [internalEquipment, setInternalEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);

  // Use passed equipment if available, otherwise fetch internal
  const equipment = passedEquipment || internalEquipment;

  useEffect(() => {
    if (!passedEquipment) {
      fetchVehicles();
    }
  }, [passedEquipment]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const data = await equipmentApi.list();
      setInternalEquipment(data.map(mapDtoToEquipment));
    } catch (error) {
      console.error("Error fetching vehicles in VehicleSelector:", error);
      toast.error("Failed to load assets for selection.");
    } finally {
      setLoading(false);
    }
  };

  const groupedOptions = useMemo(() => {
    const groups: Record<string, Equipment[]> = {};
    equipment
      .filter((e) => isSelectable(e.status))
      .forEach((e) => {
        const type = e.type || e.equipmentTypeName || "Other Assets";
        if (!groups[type]) groups[type] = [];
        groups[type].push(e);
      });

    // Sort groups and items
    return Object.keys(groups)
      .sort()
      .map((groupName) => ({
        name: groupName,
        items: groups[groupName].sort((a, b) => a.unitNumber.localeCompare(b.unitNumber))
      }));
  }, [equipment]);

  const handleVehicleSelect = (id: string) => {
    const v = equipment.find((x) => x.id === id);
    if (v) {
      onVehicleSelect(v.id, v.type, v.unitNumber);
    }
  };

  const getSelectedVehicleDisplay = () => {
    if (!selectedVehicleId) return null;

    const v = equipment.find((x) => x.id === selectedVehicleId);
    if (!v) {
      // Fallback for when we have an ID but it hasn't loaded yet or is missing
      return <span className="text-slate-400 font-bold italic">Selected Asset #{selectedVehicleId.slice(0, 4)}</span>;
    }

    return (
      <div className="flex items-center gap-2">
        <Truck className="h-4 w-4 text-blue-500" />
        <span className="font-black text-slate-900">{v.unitNumber}</span>
        <span className="text-slate-500 text-[10px] hidden sm:inline font-bold">
          ({[v.year, v.make, v.model].filter(Boolean).join(" ")})
        </span>
        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-tight px-1.5 py-0 border-slate-200 text-slate-400">
          {v.type}
        </Badge>
      </div>
    );
  };

  if (loading && !passedEquipment) {
    return (
      <div className="space-y-1.5">
        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset *</Label>
        <Select disabled>
          <SelectTrigger className="w-full px-5 py-6 bg-slate-50 border border-slate-200 rounded-[2rem]">
            <SelectValue placeholder="Accessing Vault..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor="vehicle" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
        Asset * <span className="text-slate-200">({equipment.length})</span>
      </Label>
      <Select
        value={selectedVehicleId || ""}
        onValueChange={handleVehicleSelect}
      >
        <SelectTrigger className="w-full px-5 py-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all">
          <SelectValue placeholder="Select an Asset">
            {getSelectedVehicleDisplay()}
          </SelectValue>
        </SelectTrigger>

        <SelectContent className="z-[99999] rounded-[2rem] border-slate-100 shadow-2xl p-2 max-h-[400px]">
          {groupedOptions.length > 0 ? (
            groupedOptions.map((group) => (
              <SelectGroup key={group.name} className="space-y-1">
                <SelectLabel className="px-4 py-2 mt-2 text-[8px] font-black text-slate-300 uppercase tracking-widest bg-slate-50/50 rounded-lg">
                  {group.name}s
                </SelectLabel>
                {group.items.map((v) => (
                  <SelectItem
                    key={v.id}
                    value={v.id}
                    className="px-4 py-3 focus:bg-blue-50 focus:text-blue-600 cursor-pointer rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-900">{v.unitNumber}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                        {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest text-[10px]">No active assets found</p>
              <p className="text-[9px] text-slate-300 mt-1">Check fleet synchronization status</p>
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default VehicleSelector;
