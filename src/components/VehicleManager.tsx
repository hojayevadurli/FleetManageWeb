import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/Api";

import EquipmentDetail from "@/components/equipment/EquipmentDetail";
import EquipmentList from "@/components/equipment/EquipmentList";
import { workOrdersApi } from "@/lib/workOrdersApi";
import { serviceHistoryApi } from "@/lib/serviceHistoryApi";
import { Equipment, WorkOrder, EquipmentStatus, EquipmentType, WorkOrderStatus } from "@/lib/types";

interface TruckDto {
  id: string;
  number: string;
  vin: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  purchasedAt?: string | null;
  plateNumber?: string | null;
  mileage?: number | null;
  engineType?: string | null;
  status?: string | null;
}

interface TrailerDto {
  id: string;
  number: string;
  vin: string;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  purchasedAt?: string | null;
  type?: string | null; // Trailer category
  length?: number | null;
  weightCapacity?: number | null;
  status?: string | null;
}

interface Vehicle {
  id: string;
  vehicle_id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  status: string;
  type: 'truck' | 'trailer';

  created_at: string;
  updated_at: string;

  // Specifics
  plate_number?: string;
  mileage?: number;
  engine_type?: string;
  trailer_type?: string;
  length?: number;
  weight_capacity?: number;
}

const VehicleManager = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialStatus = queryParams.get('status') as EquipmentStatus | null;

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicleWorkOrders, setVehicleWorkOrders] = useState<WorkOrder[]>([]);
  const { toast } = useToast();

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);

      const [trucksRes, trailersRes] = await Promise.all([
        api.get<TruckDto[]>("/trucks"),
        api.get<TrailerDto[]>("/trailers")
      ]);

      const trucks: Vehicle[] = (trucksRes.data ?? []).map((t) => ({
        id: t.id,
        vehicle_id: t.number,
        vin: t.vin,
        make: t.make ?? "",
        model: t.model ?? "",
        year: t.year ?? new Date().getFullYear(),
        status: t.status || "active",
        type: 'truck',
        plate_number: t.plateNumber ?? undefined,
        mileage: t.mileage ?? undefined,
        engine_type: t.engineType ?? undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const trailers: Vehicle[] = (trailersRes.data ?? []).map((t) => ({
        id: t.id,
        vehicle_id: t.number,
        vin: t.vin,
        make: t.make ?? "",
        model: t.model ?? "",
        year: t.year ?? new Date().getFullYear(),
        status: t.status || "active",
        type: 'trailer',
        trailer_type: t.type ?? undefined,
        length: t.length ?? undefined,
        weight_capacity: t.weightCapacity ?? undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      setVehicles([...trucks, ...trailers]);
    } catch (error: any) {
      console.error("Failed to fetch fleet", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to fetch vehicles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Fetch work orders when a vehicle is selected
  useEffect(() => {
    const fetchWO = async () => {
      if (!selectedVehicle) {
        setVehicleWorkOrders([]);
        return;
      }
      try {
        const [wos, shRecords] = await Promise.all([
          workOrdersApi.list({ assetId: selectedVehicle.id }),
          serviceHistoryApi.list({ assetId: selectedVehicle.id })
        ]);

        const mappedWos: WorkOrder[] = wos.map(wo => ({
          id: wo.id,
          woNumber: wo.woNumber || 'Draft',
          equipmentId: wo.assetId,
          status: (wo.status as unknown as WorkOrderStatus) || WorkOrderStatus.OPEN,
          priority: 'Medium' as any,
          date: wo.serviceDate,
          technician: 'Unknown',
          totalCost: wo.totalAmount,
          partsCost: 0,
          laborCost: 0,
          description: wo.summary || '',
          vendor: '',
          items: [],
          media: wo.documents?.map(doc => ({
            url: doc.fileUrl,
            type: doc.fileType.includes('pdf') ? 'pdf' : 'image',
            name: 'Attachment'
          })) || []
        }));

        const mappedSh: WorkOrder[] = shRecords.map(r => ({
          id: r.id,
          woNumber: r.invoiceNumber || `SR-${r.id.slice(0, 5)}`,
          equipmentId: r.assetId || "",
          status: (r.status as any) || WorkOrderStatus.COMPLETED,
          priority: 'Medium' as any,
          date: r.invoiceDate || r.createdAt || new Date().toISOString(),
          technician: "",
          totalCost: r.totalAmount || r.total || 0,
          partsCost: r.totalAmount || r.total || 0,
          laborCost: 0,
          description: r.summary || r.description || "Routine Service",
          vendor: r.vendorNameRaw || r.vendorName || "Professional Service",
          items: [],
          media: r.attachmentUrl ? [{
            url: r.attachmentUrl,
            type: r.attachmentUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image',
            name: r.attachmentFileName || 'attachment'
          }] : [],
          odometer: r.odometer?.toString() || ""
        }));

        const combined = [...mappedWos, ...mappedSh].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setVehicleWorkOrders(combined);
      } catch (err) {
        console.error("Failed to fetch history for vehicle", err);
      }
    };
    fetchWO();
  }, [selectedVehicle]);

  const mapVehicleToEquipment = (v: Vehicle): Equipment => ({
    id: v.id,
    unitNumber: v.vehicle_id,
    type: v.type === 'trailer' ? EquipmentType.TRAILER : EquipmentType.TRUCK,
    make: v.make,
    model: v.model,
    year: v.year,
    vin: v.vin,
    licensePlate: v.plate_number || '',
    status: (v.status as EquipmentStatus) || EquipmentStatus.ACTIVE,
    lastServiceDate: v.updated_at,
    mileage: v.mileage,
    engineType: v.engine_type,
    trailerType: v.trailer_type,
    length: v.length,
    weightCapacity: v.weight_capacity
  });

  const equipmentList = vehicles.map(mapVehicleToEquipment);

  const handleAddEquipment = async (e: Omit<Equipment, 'id'>) => {
    try {
      const isTruck = e.type === EquipmentType.TRUCK;
      const endpoint = isTruck ? "/trucks" : "/trailers";

      const payload: any = {
        number: e.unitNumber,
        vin: e.vin,
        year: e.year,
        make: e.make,
        model: e.model,
        status: e.status,
      };

      if (isTruck) {
        payload.plateNumber = e.licensePlate || "";
        payload.mileage = e.mileage || 0;
        payload.engineType = e.engineType || "";
      } else {
        payload.type = e.trailerType || "";
        payload.length = e.length || 0;
        payload.weightCapacity = e.weightCapacity || 0;
      }

      await api.post(endpoint, payload);
      toast({ title: "Equipment Added", description: `${e.unitNumber} has been successfully onboarded.` });
      fetchVehicles();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.title || err.message;
      console.error("Onboarding error details:", err.response?.data);
      toast({ title: "Onboarding Failed", description: errorMsg, variant: "destructive" });
    }
  };

  const handleAddWorkOrder = async (wo: Omit<WorkOrder, 'id'>, files?: File[]) => {
    try {
      const v = vehicles.find(veh => veh.id === wo.equipmentId);
      if (!v) throw new Error("Asset not found");

      const assetType = v.type === 'trailer' ? 'trailer' : 'truck';

      const payload = {
        assetType: assetType as any,
        assetId: v.id,
        serviceDate: wo.date ? new Date(wo.date).toISOString() : new Date().toISOString(),
        summary: wo.description,
        totalAmount: wo.totalCost || 0,
        taxAmount: 0,
        status: "open" as any,
        woNumber: wo.woNumber,
        vendorId: null, // explicit null for backend mapping
        odometer: null, // explicit null for backend mapping
        lines: [
          {
            type: "labor" as any,
            description: "Maintenance Service",
            qty: 1,
            unitPrice: wo.laborCost || 0,
            amount: wo.laborCost || 0
          },
          {
            type: "part" as any,
            description: "Parts",
            qty: 1,
            unitPrice: wo.partsCost || 0,
            amount: wo.partsCost || 0
          }
        ]
      };

      const createdWo = await workOrdersApi.create(payload as any);

      if (files && files.length > 0) {
        toast({ title: "Uploading Attachments...", description: `Saving ${files.length} files.` });
        await workOrdersApi.uploadAttachments(createdWo.id, files);
      }

      toast({
        title: "Work Order Created",
        description: `Record ${createdWo.woNumber || wo.woNumber} saved successfully.`
      });

      // Optionally refresh something or fetch updated WO list if the detail view is open
    } catch (err: any) {
      console.error("WO Creation failed:", err);
      const errorMsg = err.response?.data?.message || err.message;
      toast({
        title: "Creation Failed",
        description: errorMsg,
        variant: "destructive"
      });
    }
  };

  const handleUpdateStatus = async (status: EquipmentStatus) => {
    if (!selectedVehicle) return;
    try {
      const isTruck = selectedVehicle.type === 'truck';
      const endpoint = isTruck ? `/trucks/${selectedVehicle.id}` : `/trailers/${selectedVehicle.id}`;

      // Optimistic update
      const updatedVehicle = { ...selectedVehicle, status };
      setSelectedVehicle(updatedVehicle);
      setVehicles(prev => prev.map(v => v.id === selectedVehicle.id ? updatedVehicle : v));

      const payload: any = {
        number: selectedVehicle.vehicle_id,
        vin: selectedVehicle.vin,
        year: selectedVehicle.year,
        make: selectedVehicle.make,
        model: selectedVehicle.model,
        status: status,
      };

      if (isTruck) {
        payload.plateNumber = selectedVehicle.plate_number;
        payload.mileage = selectedVehicle.mileage;
        payload.engineType = selectedVehicle.engine_type;
      } else {
        payload.type = selectedVehicle.trailer_type;
        payload.length = selectedVehicle.length;
        payload.weightCapacity = selectedVehicle.weight_capacity;
      }

      await api.put(endpoint, payload);
      toast({ title: "Status Updated", description: `Unit is now ${status}` });
    } catch (err: any) {
      console.error("Status update error details:", err.response?.data);
      const errorMsg = err.response?.data?.message || err.message;
      toast({ title: "Update Failed", description: errorMsg, variant: "destructive" });
      fetchVehicles(); // Revert on error
    }
  };

  if (selectedVehicle) {
    return (
      <EquipmentDetail
        equipment={mapVehicleToEquipment(selectedVehicle)}
        workOrders={vehicleWorkOrders}
        onBack={() => setSelectedVehicle(null)}
        onUpdateStatus={handleUpdateStatus}
        initialAiOpen={false} // Default closed
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="text-lg font-medium text-gray-600">
            Loading your fleet...
          </div>
        </div>
      </div>
    );
  }

  const handleBulkDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      // We need to know which IDs are trucks and which are trailers to hit correct endpoints
      // Or if the backend has a single bulk-delete endpoint that takes generic IDs.
      // Usually, separate endpoints are cleaner.

      const trucksToDelete = vehicles.filter(v => ids.includes(v.id) && v.type === 'truck').map(v => v.id);
      const trailersToDelete = vehicles.filter(v => ids.includes(v.id) && v.type === 'trailer').map(v => v.id);

      const deletions = [];
      if (trucksToDelete.length > 0) deletions.push(api.post("/trucks/bulk-delete", { truckIds: trucksToDelete }));
      if (trailersToDelete.length > 0) deletions.push(api.post("/trailers/bulk-delete", { trailerIds: trailersToDelete }));

      await Promise.all(deletions);
      toast({ title: "Assets Deleted", description: `${ids.length} items removed from fleet.` });
      fetchVehicles();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete items", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8">
      <EquipmentList
        equipment={equipmentList}
        initialStatusFilter={initialStatus || 'ALL'}
        onSelect={(e, openAi) => {
          // Find original vehicle to set selected
          const v = vehicles.find(veh => veh.id === e.id);
          if (v) setSelectedVehicle(v);
        }}
        onAddEquipment={handleAddEquipment}
        onNewWorkOrder={(unitId) => console.log("New WO for", unitId)}
        onAddWorkOrder={handleAddWorkOrder}
        onBulkDelete={handleBulkDelete}
      />
    </div>
  );
};

export default VehicleManager;
