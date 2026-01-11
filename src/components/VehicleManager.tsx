import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { equipmentApi, mapDtoToEquipment } from "@/lib/equipmentApi";
import { fleetCategoriesApi, FleetCategory } from "@/lib/fleetCategoriesApi";
import { equipmentTypesApi } from "@/lib/equipmentTypesApi";
import { tenantsApi } from "@/lib/tenantsApi";

import EquipmentDetail from "@/components/equipment/EquipmentDetail";
import EquipmentList from "@/components/equipment/EquipmentList";
import { workOrdersApi } from "@/lib/workOrdersApi";
import { Equipment, WorkOrder, EquipmentStatus, WorkOrderStatus, EquipmentLifecycleStatus, EquipmentOperationalStatus, WorkOrderPriority, WorkOrderCostSource, EquipmentTypeDto, FleetType } from "@/lib/types";

const VehicleManager = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialStatus = queryParams.get('status') as EquipmentStatus | null;

  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [equipmentWorkOrders, setEquipmentWorkOrders] = useState<WorkOrder[]>([]);

  // Cache for mapping logic
  const [fleetCategories, setFleetCategories] = useState<FleetCategory[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentTypeDto[]>([]);

  const { toast } = useToast();

  const fetchEquipment = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all equipment (backend unifies trucks, trailers, etc.)
      const data = await equipmentApi.list();
      setEquipmentList(data.map(mapDtoToEquipment));
    } catch (error: any) {
      console.error("Failed to fetch equipment", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to fetch fleet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEquipment();

    // Pre-fetch categories and types for mapping new equipment
    const loadConfig = async () => {
      try {
        const tenant = await tenantsApi.getCurrent();
        if (tenant?.industryId) {
          const cats = await fleetCategoriesApi.list(tenant.industryId);
          setFleetCategories(cats);

          // Fetch all types across categories (flat list simulation or parallel fetch)
          // Since api needs categoryId, we'll fetch for each category
          const allTypes: EquipmentTypeDto[] = [];
          for (const cat of cats) {
            const types = await equipmentTypesApi.list(tenant.industryId, cat.id);
            allTypes.push(...types);
          }
          setEquipmentTypes(allTypes);
        }
      } catch (e) {
        console.error("Failed to load mapping config", e);
      }
    };
    loadConfig();
  }, [fetchEquipment]);

  // Fetch work orders when equipment is selected
  useEffect(() => {
    const fetchWO = async () => {
      if (!selectedEquipment) {
        setEquipmentWorkOrders([]);
        return;
      }
      try {
        const wos = await workOrdersApi.list({ equipmentId: selectedEquipment.id });

        const mappedWos: WorkOrder[] = wos.map(wo => ({
          id: wo.id,
          woNumber: wo.workOrderNumber || 'Draft',
          equipmentId: wo.equipmentId,
          status: (WorkOrderStatus as any)[wo.status] ?? WorkOrderStatus.Open,
          priority: (WorkOrderPriority as any)[wo.priority] ?? WorkOrderPriority.Normal,
          date: wo.openedAt,
          technician: 'Unknown',
          totalCost: wo.manualActualTotal || wo.estimatedTotal,
          partsCost: 0,
          laborCost: 0,
          title: wo.title,
          complaint: wo.complaint,
          diagnosis: wo.diagnosis || '',
          resolution: wo.resolution || '',
          costSource: (WorkOrderCostSource as any)[wo.costSource] ?? WorkOrderCostSource.Estimated,
          estimatedTotal: wo.estimatedTotal,
          manualActualTotal: wo.manualActualTotal,
          description: wo.notes || '',
          vendor: wo.vendorName || '',
          items: (wo.lines || []).map(l => ({
            id: l.id || Math.random().toString(),
            description: l.description,
            quantity: l.qty,
            unitPrice: l.unitPrice,
            cost: l.qty * l.unitPrice,
            type: l.type as any,
            serviceType: l.type
          })),
          media: wo.documents?.map(doc => ({
            url: doc.fileUrl,
            type: doc.fileType.includes('pdf') ? 'pdf' : 'image',
            name: 'Attachment'
          })) || []
        }));

        const combined = mappedWos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEquipmentWorkOrders(combined);
      } catch (err) {
        console.error("Failed to fetch history for equipment", err);
      }
    };
    fetchWO();
  }, [selectedEquipment]);

  const handleAddEquipment = async (e: Omit<Equipment, 'id'>) => {
    try {
      // Logic to find best matching Category and Type IDs based on user selection
      let mappedCatId = e.fleetCategoryId;
      let mappedTypeId = e.equipmentTypeId;

      if (!mappedCatId && e.fleetType) {
        // Try to map from fleetType string (TRUCK, TRAILER, etc.) to a Category Name
        // Simple heuristic: Category Name contains "Truck", "Trailer", "Heavy"
        const targetName = e.fleetType === 'TRUCK' ? 'Truck' : e.fleetType === 'TRAILER' ? 'Trailer' : 'Heavy';
        const match = fleetCategories.find(c => c.name.toLowerCase().includes(targetName.toLowerCase()));
        if (match) mappedCatId = match.id;
        else if (fleetCategories.length > 0) mappedCatId = fleetCategories[0].id; // Fallback to first available
      }

      if (!mappedTypeId && e.specificType) {
        // Try to find exact name match for specific type
        const match = equipmentTypes.find(t => t.name.toLowerCase() === e.specificType?.toLowerCase());
        if (match) mappedTypeId = match.id.toString();

        // If not found, try to find one that matches fleetType to be safe
        if (!mappedTypeId && mappedCatId) {
          const fallbackMatch = equipmentTypes.find(t => t.fleetCategoryId === mappedCatId);
          if (fallbackMatch) mappedTypeId = fallbackMatch.id.toString();
        }
      }

      const payload: any = {
        equipmentTypeId: mappedTypeId,
        fleetCategoryId: mappedCatId,
        unitNumber: e.unitNumber,
        displayName: e.unitNumber,
        vin: e.vin,
        serialNumber: e.serialNumber,
        plateNumber: e.licensePlate,
        make: e.make,
        model: e.model,
        year: e.year,
        operationalStatus: EquipmentOperationalStatus.Available,
        lifecycleStatus: EquipmentLifecycleStatus.Active,
        acquiredDate: new Date().toISOString().split('T')[0],
        inServiceDate: new Date().toISOString().split('T')[0],
        notes: e.notes,
        initialOdometer: (e as any).initialOdometer || 0,
        initialHours: (e as any).initialHours || 0,
        specs: {
          licenseState: (e as any).licenseState
        }
      };
      await equipmentApi.create(payload);
      toast({ title: "Equipment Added", description: `${e.unitNumber} has been successfully onboarded.` });
      fetchEquipment();
      return null; // Success
    } catch (err: any) {
      const status = err.response?.status;
      let errorMsg = err.response?.data?.message || err.response?.data?.title || err.message;

      if (status === 409) {
        errorMsg = "An asset with this Unit Number or VIN already exists. Please check your records.";
      }

      console.error("Onboarding error details:", err.response?.data);
      toast({ title: status === 409 ? "Duplicate Asset" : "Onboarding Failed", description: errorMsg, variant: "destructive" });

      return { status: status || 500, message: errorMsg }; // Return error
    }
  };

  const handleAddWorkOrder = async (woPayload: any, files?: File[]) => {
    try {
      // woPayload is already mapped to WorkOrderUpsertDto structure in EquipmentList
      const createdWo = await workOrdersApi.create(woPayload);

      if (files && files.length > 0) {
        toast({ title: "Uploading Attachments...", description: `Saving ${files.length} files.` });
        await workOrdersApi.uploadAttachments(createdWo.id, files);
      }

      toast({
        title: "Work Order Created",
        description: `Record ${createdWo.workOrderNumber || 'Successfully saved'}.`
      });
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
    if (!selectedEquipment) return;
    try {
      // Optimistic update
      const updatedEquipment = { ...selectedEquipment, status };
      setSelectedEquipment(updatedEquipment);
      setEquipmentList(prev => prev.map(v => v.id === selectedEquipment.id ? updatedEquipment : v));

      // Map full payload required by backend Update endpoint
      const payload: any = {
        equipmentTypeId: selectedEquipment.equipmentTypeId,
        fleetCategoryId: selectedEquipment.fleetCategoryId,
        unitNumber: selectedEquipment.unitNumber,
        displayName: selectedEquipment.unitNumber, // fallback
        vin: selectedEquipment.vin,
        serialNumber: selectedEquipment.serialNumber,
        plateNumber: selectedEquipment.licensePlate,
        make: selectedEquipment.make,
        model: selectedEquipment.model,
        year: selectedEquipment.year,
        operationalStatus: (() => {
          switch (status) {
            case EquipmentStatus.ACTIVE: return EquipmentOperationalStatus.Available;
            case EquipmentStatus.IN_SHOP: return EquipmentOperationalStatus.InShop;
            case EquipmentStatus.OUT_OF_SERVICE: return EquipmentOperationalStatus.OutOfService;
            default: return EquipmentOperationalStatus.Available;
          }
        })(),
        lifecycleStatus: status === EquipmentStatus.SOLD ? EquipmentLifecycleStatus.Sold :
          status === EquipmentStatus.ARCHIVED ? EquipmentLifecycleStatus.Retired :
            EquipmentLifecycleStatus.Active,
        outOfServiceDate: status === EquipmentStatus.OUT_OF_SERVICE ? new Date().toISOString().split('T')[0] : selectedEquipment.outOfServiceDate,
        notes: selectedEquipment.notes
        // Add other fields if needed by backend DTO
      };

      await equipmentApi.update(selectedEquipment.id, payload);
      toast({ title: "Status Updated", description: `Unit is now ${status}` });
    } catch (err: any) {
      console.error("Status update error details:", err.response?.data);
      const errorMsg = err.response?.data?.message || err.message;
      toast({ title: "Update Failed", description: errorMsg, variant: "destructive" });
      fetchEquipment(); // Revert
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      await equipmentApi.bulkDelete(ids);
      toast({ title: "Assets Deleted", description: `${ids.length} items removed from fleet.` });
      fetchEquipment();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete items", variant: "destructive" });
    }
  };

  const handleUpdateEquipment = async (data: any) => {
    if (!selectedEquipment) return;
    try {
      // Map to API DTO
      const payload: any = {
        id: selectedEquipment.id,
        equipmentTypeId: data.equipmentTypeId || selectedEquipment.equipmentTypeId,
        fleetCategoryId: data.fleetCategoryId || selectedEquipment.fleetCategoryId,
        unitNumber: data.unitNumber,
        displayName: data.unitNumber,
        vin: data.vin,
        serialNumber: data.serialNumber,
        plateNumber: data.licensePlate, // Map licensePlate to plateNumber
        state: data.licenseState,
        make: data.make,
        model: data.model,
        year: data.year,
        status: data.status,
        type: data.type,

        // Operational Status mapping
        operationalStatus: (() => {
          switch (data.status) {
            case EquipmentStatus.ACTIVE: return EquipmentOperationalStatus.Available;
            case EquipmentStatus.IN_SHOP: return EquipmentOperationalStatus.InShop;
            case EquipmentStatus.OUT_OF_SERVICE: return EquipmentOperationalStatus.OutOfService;
            default: return EquipmentOperationalStatus.Available;
          }
        })(),
        lifecycleStatus: data.status === EquipmentStatus.SOLD ? EquipmentLifecycleStatus.Sold :
          data.status === EquipmentStatus.ARCHIVED ? EquipmentLifecycleStatus.Retired :
            EquipmentLifecycleStatus.Active,

        // Specs
        length: data.length,
        width: 0,
        height: 0,
        color: 'White', // Default
        grossVehicleWeightRating: data.weightCapacity,

        // Meters
        currentOdometer: data.mileage,
        currentHobbs: data.hours,

        notes: selectedEquipment.notes
      };

      await equipmentApi.update(selectedEquipment.id, payload);

      // Update local state
      const updatedItem = { ...selectedEquipment, ...data };
      setSelectedEquipment(updatedItem);
      setEquipmentList(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));

      toast({ title: "Equipment Updated", description: "Changes saved successfully." });
    } catch (err: any) {
      console.error("Update failed:", err);
      toast({ title: "Update Failed", description: err.message || "Failed to save changes", variant: "destructive" });
    }
  };

  if (selectedEquipment) {
    return (
      <EquipmentDetail
        equipment={selectedEquipment}
        workOrders={equipmentWorkOrders}
        onBack={() => setSelectedEquipment(null)}
        onUpdate={handleUpdateEquipment}
        onUpdateStatus={handleUpdateStatus}
        initialAiOpen={false}
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

  return (
    <div className="space-y-8">
      <EquipmentList
        equipment={equipmentList}
        initialStatusFilter={initialStatus || 'ALL'}
        onSelect={(e) => {
          const v = equipmentList.find(veh => veh.id === e.id);
          if (v) setSelectedEquipment(v);
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
