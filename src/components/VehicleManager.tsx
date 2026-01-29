import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { equipmentApi, mapDtoToEquipment, EquipmentCreatePayload } from "@/lib/equipmentApi";
import { fleetCategoriesApi, FleetCategory } from "@/lib/fleetCategoriesApi";
import { equipmentTypesApi } from "@/lib/equipmentTypesApi";
import { tenantsApi } from "@/lib/tenantsApi";

import EquipmentDetail from "@/components/equipment/EquipmentDetail";
import EquipmentList from "@/components/equipment/EquipmentList";
import { workOrdersApi } from "@/lib/workOrdersApi";
import { shopsApi } from "@/lib/shopsApi";
import { Shop } from "@/components/shops/types/ShopTypes";
import { Equipment, WorkOrder, EquipmentOperationalStatus, WorkOrderStatus, WorkOrderPriority, WorkOrderCostSource, EquipmentTypeDto } from "@/lib/types";

const VehicleManager = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialStatus = queryParams.get('status') ? parseInt(queryParams.get('status')!) as EquipmentOperationalStatus : null;

  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [equipmentWorkOrders, setEquipmentWorkOrders] = useState<WorkOrder[]>([]);

  // Cache for mapping logic
  const [fleetCategories, setFleetCategories] = useState<FleetCategory[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentTypeDto[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);

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

          // Fetch shops for mapping vendor names in Work Orders
          const shopList = await shopsApi.list();
          setShops(shopList);
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

        const mappedWos: WorkOrder[] = await Promise.all(wos.map(async (wo) => {
          let vendorName = wo.vendorName || '';

          // Try to resolve vendor name if missing
          if (!vendorName && wo.vendorId) {
            // 1. Try local cache (case-insensitive)
            const cached = shops.find(s => s.id?.toLowerCase() === wo.vendorId?.toLowerCase());
            if (cached) {
              vendorName = cached.shop_name;
            } else {
              // 2. Fallback: Fetch individually if not in list
              try {
                const s = await shopsApi.get(wo.vendorId);
                if (s) vendorName = s.shop_name;
              } catch (e) {
                console.warn(`[VehicleManager] Failed to resolve shop ${wo.vendorId}`, e);
              }
            }
          }

          // Fetch attachments specifically as requested
          let attachments = wo.documents || [];
          try {
            const fetchedAttachments = await workOrdersApi.listAttachments(wo.id);
            if (fetchedAttachments && fetchedAttachments.length > 0) {
              attachments = fetchedAttachments;
            }
          } catch (e) {
            console.warn(`[VehicleManager] Failed to fetch attachments for WO ${wo.id}`, e);
          }

          return {
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
            vendorId: wo.vendorId,
            vendor: vendorName,
            items: (wo.lines || []).map(l => ({
              id: l.id || Math.random().toString(),
              description: l.description,
              quantity: l.qty,
              unitPrice: l.unitPrice,
              cost: l.qty * l.unitPrice,
              type: l.type as any,
              serviceType: l.type
            })),
            media: attachments.map(doc => ({
              url: doc.fileUrl,
              type: doc.fileType?.includes('pdf') ? 'pdf' : 'image',
              name: doc.fileName || 'Attachment'
            }))
          };
        }));

        const combined = mappedWos.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEquipmentWorkOrders(combined);
      } catch (err) {
        console.error("Failed to fetch history for equipment", err);
      }
    };
    fetchWO();
  }, [selectedEquipment, shops]);

  const handleAddEquipment = async (e: EquipmentCreatePayload) => {
    try {
      const payload: EquipmentCreatePayload = {
        ...e,
        plateNumber: e.licensePlate, // Map for backend
        displayName: e.unitNumber,
        operationalStatus: e.operationalStatus || EquipmentOperationalStatus.Active,
        acquiredDate: new Date().toISOString().split('T')[0],
        inServiceDate: new Date().toISOString().split('T')[0],
        initialOdometer: e.initialOdometer || 0,
        initialHours: e.initialHours || 0,
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

  const handleUpdateStatus = async (status: EquipmentOperationalStatus) => {
    if (!selectedEquipment) return;
    try {
      // Optimistic update
      const updatedEquipment = { ...selectedEquipment, status: status };
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
        operationalStatus: status,
        outOfServiceDate: status === EquipmentOperationalStatus.OutOfService ? new Date().toISOString().split('T')[0] : selectedEquipment.outOfServiceDate,
        notes: selectedEquipment.notes
        // Add other fields if needed by backend DTO
      };

      await equipmentApi.update(selectedEquipment.id, payload);
      toast({ title: "Status Updated", description: `Unit status updated` });
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

  /* 
   * NEW: Fetch just one equipment to refresh the detailed view
   */
  const handleRefreshEquipment = async () => {
    if (!selectedEquipment) return;
    try {
      const refreshed = await equipmentApi.get(selectedEquipment.id);
      if (refreshed) {
        // preserve the detailed view by updating state
        setSelectedEquipment(refreshed);
        setEquipmentList(prev => prev.map(e => e.id === refreshed.id ? refreshed : e));
      }
    } catch (err) {
      console.error("Failed to refresh equipment", err);
    }
  };

  const handleUpdateEquipment = async (data: any) => {
    if (!selectedEquipment) return;
    try {
      // Map to API DTO with full safety defaults to existing values
      const payload: any = {
        id: selectedEquipment.id,
        equipmentTypeId: data.equipmentTypeId ?? selectedEquipment.equipmentTypeId,
        fleetCategoryId: data.fleetCategoryId ?? selectedEquipment.fleetCategoryId,
        unitNumber: data.unitNumber ?? selectedEquipment.unitNumber,
        displayName: data.displayName ?? selectedEquipment.displayName ?? selectedEquipment.unitNumber,
        vin: data.vin ?? selectedEquipment.vin,
        serialNumber: data.serialNumber ?? selectedEquipment.serialNumber,
        plateNumber: data.licensePlate ?? selectedEquipment.licensePlate, // Map licensePlate to plateNumber
        make: data.make ?? selectedEquipment.make,
        model: data.model ?? selectedEquipment.model,
        year: data.year ?? selectedEquipment.year,

        // Operational Status mapping
        operationalStatus: data.status ?? selectedEquipment.status,

        // Specs - use nullish coalescing to avoid overwriting with 0 if data isn't provided but exists
        // However, if data IS provided (e.g. edit form), it should be used.
        // If data is empty object (refresh hack), we fallback to existing.
        // The edit form usually sends all fields or specific ones. 
        // We generally assume 'data' contains the changes.

        // Meters - carefully update only if present in 'data' or fallback
        odometerCurrent: data.mileage !== undefined ? Number(data.mileage) : selectedEquipment.mileage,
        hoursCurrent: data.hours !== undefined ? Number(data.hours) : selectedEquipment.hours,

        notes: selectedEquipment.notes
      };

      console.log("Sending Update Payload:", payload);
      await equipmentApi.update(selectedEquipment.id, payload);

      // Update local state
      const updatedItem = { ...selectedEquipment, ...data };
      setSelectedEquipment(updatedItem);
      setEquipmentList(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));

      toast({ title: "Equipment Updated", description: "Changes saved successfully." });
    } catch (err: any) {
      console.error("Update failed:", err);
      // Re-throw so the modal knows it failed
      throw new Error(err.message || "Failed to save changes");
    }
  };

  const handleDeleteEquipment = async () => {
    if (!selectedEquipment) return;
    try {
      await equipmentApi.delete(selectedEquipment.id);
      setEquipmentList(prev => prev.filter(e => e.id !== selectedEquipment.id));
      setSelectedEquipment(null);
      toast({ title: "Asset Deleted", description: "Equipment removed successfully." });
    } catch (err: any) {
      console.error("Delete failed", err);
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
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
        onRefresh={handleRefreshEquipment}
        onDelete={handleDeleteEquipment}
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
