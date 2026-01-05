import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, GitCompare, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import ServiceAnalytics from "./ServiceAnalytics";
import VehicleComparison from "./VehicleComparison";
import CostAnalysis from "./CostAnalysis";
import ServiceHistoryManager from "./ServiceHistoryManager";
import { documentsApi } from "../../lib/documentsApi";
import { equipmentApi, mapDtoToEquipment } from "@/lib/equipmentApi";
import { serviceHistoryApi } from "@/lib/serviceHistoryApi"; // Keeping for removal later or reference
import { workOrdersApi, WorkOrderUpsertDto } from "@/lib/workOrdersApi";
import { shopsApi } from "@/lib/shopsApi";
import { Vendor, WorkOrder, WorkOrderStatus, WorkOrderPriority, Equipment, VendorStatus, WorkOrderDto, WorkOrderCostSource } from "@/lib/types";

const mapType = (rawType: string): string => {
  const typeMap: Record<string, string> = {
    "parts": "Parts",
    "part": "Part",
    "labor": "Labor",
    "labour": "Labor",
    "fee": "Fee",
    "fees": "Fee",
    "tax": "Tax",
    "taxes": "Tax",
    "misc": "Misc",
    "miscellaneous": "Misc"
  };
  return typeMap[rawType?.toLowerCase()] || "Misc";
};

const ServiceHistory = () => {
  console.log("%c--- SERVICE HISTORY v2.1 (FIXED PATHS/DTO) ---", "color: #2563eb; font-weight: bold;");
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialRecordId = queryParams.get('recordId');

  const [serviceRecords, setServiceRecords] = useState<ServiceHistoryModel[]>([]);
  const [vehicles, setVehicles] = useState<Equipment[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]); // Derived from serviceRecords for display
  const [availableWorkOrders, setAvailableWorkOrders] = useState<WorkOrderDto[]>([]); // Real Work Orders for linking
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState("all");

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load both in parallel but handle failures independently
      const results = await Promise.allSettled([
        workOrdersApi.list(), // Use workOrdersApi instead of serviceHistoryApi
        equipmentApi.list(),
        shopsApi.list(),
        // workOrdersApi.list() // Removed duplicate call
      ]);

      const recordsRes = results[0];
      const equipmentRes = results[1];
      const vendorsRes = results[2];
      // const workOrdersRes = results[3]; // Removed

      // 1. Process Records
      if (recordsRes.status === 'fulfilled') {
        const records: WorkOrderDto[] = recordsRes.value || [];
        // Map WorkOrderDto to WorkOrder (UI model) 
        // Note: The UI seems to use 'WorkOrder' interface which has some differences from WorkOrderDto
        // Let's look at the mapping logic that was there.
        // The previous logic mapped ServiceHistoryModel to WorkOrder.
        // Now we map WorkOrderDto to WorkOrder.

        const maps: WorkOrder[] = records.map(r => {
          // Filter for completed/history if needed? The user said "Workorders api everything that servicehistory was doing"
          // So maybe we list ALL work orders? Or just closed ones?
          // Service History usually implies closed/completed.
          // But if "WorkOrders api does everything", maybe the "Service History" page is now just a view of Work Orders.
          // Let's assume we show all or filter by status if the current tab implies it.
          // For now, map all.

          return {
            id: r.id,
            woNumber: r.workOrderNumber || `WO-${r.id.slice(0, 5)}`,
            equipmentId: r.equipmentId || "",
            status: (WorkOrderStatus as any)[r.status] || WorkOrderStatus.Open, // Map string status to enum if needed
            priority: (WorkOrderPriority as any)[r.priority] || WorkOrderPriority.Normal,
            date: r.closedAt || r.openedAt || new Date().toISOString(), // Use closed date if available for history
            technician: "",
            totalCost: r.manualActualTotal || r.estimatedTotal || 0,
            partsCost: 0,
            laborCost: 0,
            title: r.title,
            complaint: r.complaint,
            diagnosis: r.diagnosis,
            resolution: r.resolution,
            notes: r.notes,
            estimatedTotal: r.estimatedTotal,
            manualActualTotal: r.manualActualTotal,
            costSource: (WorkOrderCostSource as any)[r.costSource] || WorkOrderCostSource.Estimated,
            description: r.notes || r.complaint || "Service",
            vendor: (r as any).vendorName || r.vendorId || "Unknown Vendor", // Use vendorName if we added it to DTO, or vendorId
            items: r.lines?.map(l => ({
              id: l.id,
              serviceType: l.type,
              description: l.description,
              quantity: l.qty,
              unitPrice: l.unitPrice,
              cost: l.amount,
              type: l.type as any
            })) || [],
            media: [], // Map documents if available in r.documents
            odometer: r.odometerAtService || 0,
            hours: 0
          };
        });

        setWorkOrders(maps);
        setServiceRecords([]); // We don't use this anymore or we map to it if needed? 
        // The component uses serviceRecords for some Analytics tabs.
        // We might need to map maps -> ServiceHistoryModel[] if we want to keep analytics working without refactoring them yet.
        // implementation_plan says: "Replace ServiceHistory data types ... with WorkOrder equivalents."
        // But Analytics components expect ServiceHistoryModel[].
        // Let's cast or map for now to allow compilation.

        const historyMaps = maps.map(m => ({
          id: m.id,
          equipmentId: m.equipmentId,
          workOrderId: m.id,
          vendorId: m.vendor,
          vendorNameRaw: m.vendor,
          invoiceNumber: m.woNumber,
          invoiceDate: m.date,
          odometer: m.odometer,
          totalAmount: m.totalCost,
          taxAmount: 0,
          summary: m.description,
          category: "General",
          status: "Completed",
          createdAt: m.date,
          updatedAt: m.date,
          lines: []
        }));
        setServiceRecords(historyMaps as any);

      } else {
        console.error("Records failed to load:", recordsRes.reason);
        toast({ title: "History Sync Warning", description: "Could not retrieve work orders.", variant: "destructive" });
      }

      // 2. Process Equipment
      if (equipmentRes.status === 'fulfilled') {
        const equipment = equipmentRes.value || [];
        setVehicles(equipment.map(mapDtoToEquipment));
      } else {
        console.error("Equipment failed to load:", equipmentRes.reason);
        toast({ title: "Fleet Sync Warning", description: "Could not retrieve equipment list.", variant: "destructive" });
      }

      // 3. Process Vendors
      if (vendorsRes.status === 'fulfilled') {
        const vendorList: Vendor[] = vendorsRes.value.map((s: any) => ({
          id: s.id || s.shopId,
          slug: s.id,
          name: s.shopName || s.name,
          address: s.address || "",
          phone: s.phone || "",
          email: s.email || "",
          businessHours: "",
          services: s.specialties || [],
          rating: s.averageRating || 0,
          reviewCount: s.reviewCount || 0,
          status: (s.networkTier as VendorStatus) || VendorStatus.STANDARD,
          lastUsedDate: "",
          lastReviewedDate: "",
          totalWorkOrders: 0,
          avgCost: s.laborRate || 0,
          distance: "0 mi",
          responseTime: "24h",
          turnaroundTime: "24h",
          priceRange: (s.pricingStrategy?.length || 2),
          lat: s.latitude || 0,
          lng: s.longitude || 0,
          reviews: []
        }));
        console.log("Loaded vendors:", vendorList.length);
        setVendors(vendorList);
      }

      // 4. Process Work Orders (We now use workOrdersApi list for everything)
      /* 
      if (workOrdersRes.status === 'fulfilled') {
        setAvailableWorkOrders(workOrdersRes.value);
        console.log("Loaded available work orders:", workOrdersRes.value.length);
      }
      */
      // We can reuse the same list we just loaded for "available work orders" if needed
      // or just assume they are the same.
      if (recordsRes.status === 'fulfilled') {
        setAvailableWorkOrders(recordsRes.value);
      }

    } catch (error) {
      console.error("Critical error in loadData:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddServiceRecord = async (record: Omit<WorkOrder, 'id'>, files?: File[], rawAiData?: any) => {
    try {
      const asset = vehicles.find(v => v.id === record.equipmentId);
      let documentId: string | undefined;
      let fileUrl: string | undefined;

      // 1. Upload files to the NEW service-history endpoint
      if (files && files.length > 0) {
        toast({ title: "Uploading Audit Record", description: "Saving invoice to fleet storage..." });

        const form = new FormData();
        files.forEach(f => form.append("files", f));

        const token = localStorage.getItem("auth_token");
        // FIX: Removed /api suffix since VITE_API_URL includes it
        const uploadRes = await fetch(`${import.meta.env.VITE_API_URL}/uploads/service-history`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: form
        });

        if (uploadRes.ok) {
          const urls = await uploadRes.json();
          fileUrl = urls[0];

          // 2. Create Document record
          const doc = await documentsApi.create({
            fileUrl: fileUrl!,
            fileType: files[0].type,
            docKind: "invoice",
            vendorNameRaw: record.vendor,
            assetType: (asset?.type?.toLowerCase() as any) || "truck",
            assetId: record.equipmentId
          });
          documentId = doc.id;

          // 3. Persist AI Metadata if available (UpdateDocumentExtractDto pattern)
          if (rawAiData) {
            await documentsApi.updateExtracted(documentId, {
              extractedJson: rawAiData,
              vendorNameRaw: record.vendor,
              confidenceScore: 0.95,
              status: "processed"
            });
          }
        }
      }

      // 4. Create the final service record (CamelCase as per Swagger)
      // 3. Resolve Vendor (Find existing or Create new to bypass backend auto-create bugs)
      let finalVendorId = vendors.find(v => v.name.toLowerCase() === (record.vendor || "").toLowerCase())?.id || null;

      // Calculate Tax Amount from items
      const taxAmount = (record.items || [])
        .filter(i => (i.type || "").toLowerCase().includes("tax"))
        .reduce((sum, i) => sum + (i.cost || (i.unitPrice || 0) * (i.quantity || 1)), 0);

      const dto: WorkOrderUpsertDto = {
        equipmentId: record.equipmentId || "",
        // workOrderId is not in WorkOrderUpsertDto directly usually? 
        // Wait, WorkOrderUpsertDto in workOrdersApi.ts:
        /*
          equipmentId: string;
          vendorId?: string | null;
          vendorName?: string | null; // Added
          workOrderNumber?: string | null;
          ...
        */
        vendorId: finalVendorId,
        vendorName: record.vendor, // Map raw vendor name here
        workOrderNumber: record.woNumber,
        openedAt: record.date ? new Date(record.date).toISOString() : new Date().toISOString(),
        // invoiceDate -> openedAt
        estimatedTotal: record.totalCost,
        manualActualTotal: record.totalCost,
        // taxAmount? WorkOrderUpsertDto doesn't have taxAmount at root level usually, it calculates from lines?
        // Let's check WorkOrderUpsertDto in workOrdersApi.ts again.
        /*
           lines: { type, description, qty, unitPrice ... }[]
        */
        // It does NOT have taxAmount. It relies on lines types being 'tax'.
        status: WorkOrderStatus.Completed,
        priority: WorkOrderPriority.Normal,
        costSource: WorkOrderCostSource.Invoiced, // or Manual
        title: record.description || "Service Record", // Summary -> Title
        complaint: record.description || "Service Record",
        notes: record.description,

        lines: (record.items && record.items.length > 0)
          ? record.items.map(it => ({
            type: mapType(it.type),
            description: it.description || "Service",
            qty: it.quantity || 1,
            unitPrice: it.unitPrice || it.cost || 0,
            // amount is calculated backend often, but let's see
            partNumber: it.partNumber
          }))
          : []
      };

      console.log("Creating Service Record with DTO:", dto);
      const newId = await serviceHistoryApi.create(dto);

      toast({ title: "Success", description: "Service record created successfully.", variant: "default" });
      loadData();
    } catch (error) {
      console.error("Error creating service record:", error);
      toast({ title: "Error", description: "Failed to create service record.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecord = async (id: string, updates: Partial<WorkOrder>, files?: File[]) => {
    setLoading(true);
    try {
      console.log("Updating Service Record:", id, updates);

      let finalVendorId = vendors.find(v => v.name.toLowerCase() === (updates.vendor || "").toLowerCase())?.id || null;

      const taxAmount = (updates.items || [])
        .filter(i => (i.type || "").toLowerCase().includes("tax"))
        .reduce((sum, i) => sum + (i.cost || (i.unitPrice || 0) * (i.quantity || 1)), 0);

      // WorkOrderUpsertDto
      const dto: WorkOrderUpsertDto = {
        equipmentId: updates.equipmentId || "",
        // workOrderId: updates.workOrderId || null,
        vendorId: finalVendorId,
        vendorName: updates.vendor,
        workOrderNumber: updates.woNumber,
        openedAt: updates.date ? new Date(updates.date).toISOString() : new Date().toISOString(),
        estimatedTotal: updates.totalCost || 0,
        manualActualTotal: updates.totalCost || 0,
        status: WorkOrderStatus.Completed,
        priority: WorkOrderPriority.Normal,
        costSource: WorkOrderCostSource.Invoiced,
        title: updates.description || "Service Update",
        complaint: updates.description || "Service Update",
        notes: updates.description,

        lines: (updates.items || []).map(it => ({
          type: mapType(it.type || "misc"),
          description: it.description || "Service",
          qty: it.quantity || 1,
          unitPrice: it.unitPrice || it.cost || 0,
          partNumber: it.partNumber
        }))
      };

      await workOrdersApi.update(id, dto);
      toast({ title: "Success", description: "Service record updated.", variant: "default" });
      loadData();
    } catch (err) {
      console.error("Error updating service record:", err);
      toast({ title: "Error", description: "Failed to update record.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-500 font-bold uppercase tracking-widest text-[10px]">Accessing Service Vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500 h-full">

      <Tabs defaultValue="records" className="space-y-8">
        <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl inline-grid grid-cols-2 sm:grid-cols-4 w-full sm:w-auto">
          <TabsTrigger value="records" className="flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <ClipboardList className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Records</span>
          </TabsTrigger>

          <TabsTrigger value="analytics" className="flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BarChart3 className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Analytics</span>
          </TabsTrigger>

          <TabsTrigger value="cost-analysis" className="flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <TrendingUp className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Costs</span>
          </TabsTrigger>

          <TabsTrigger value="comparison" className="flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <GitCompare className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Compare</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-6 outline-none">
          <ServiceHistoryManager
            records={workOrders}
            equipmentList={vehicles as any}
            vendors={vendors}
            onAdd={handleAddServiceRecord}
            onUpdate={handleUpdateRecord}
            onUpdateVendors={setVendors}
            availableWorkOrders={availableWorkOrders}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6 outline-none">
          <ServiceAnalytics records={serviceRecords as any[]} selectedVehicle={selectedVehicle} />
        </TabsContent>

        <TabsContent value="cost-analysis" className="space-y-6 outline-none">
          <CostAnalysis records={serviceRecords as any[]} selectedVehicle={selectedVehicle} />
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6 outline-none">
          <VehicleComparison records={serviceRecords as any[]} vehicles={vehicles as any[]} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceHistory;
