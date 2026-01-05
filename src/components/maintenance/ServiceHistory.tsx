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
import { serviceHistoryApi } from "@/lib/serviceHistoryApi";
import { workOrdersApi } from "@/lib/workOrdersApi";
import { shopsApi } from "@/lib/shopsApi";
import { Vendor, WorkOrder, WorkOrderStatus, WorkOrderPriority, Equipment, ServiceHistoryUpsertDto, VendorStatus, WorkOrderDto, ServiceHistory as ServiceHistoryModel } from "@/lib/types";

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
        serviceHistoryApi.list(),
        equipmentApi.list(),
        shopsApi.list(),
        workOrdersApi.list()
      ]);

      const recordsRes = results[0];
      const equipmentRes = results[1];
      const vendorsRes = results[2];
      const workOrdersRes = results[3];

      // 1. Process Records
      if (recordsRes.status === 'fulfilled') {
        const records: ServiceHistoryModel[] = recordsRes.value || [];
        const maps: WorkOrder[] = records.map(r => {
          if (!r || !r.id) return null as any;
          return {
            id: r.id,
            woNumber: `SR-${r.id.slice(0, 5)}`,
            equipmentId: r.equipmentId || "",
            status: WorkOrderStatus.Completed,
            priority: WorkOrderPriority.Normal,
            date: r.invoiceDate || r.createdAt || new Date().toISOString(),
            technician: "",
            totalCost: r.totalAmount || 0,
            partsCost: r.totalAmount || 0,
            laborCost: 0,
            description: r.summary || "Routine Service",
            vendor: r.vendorNameRaw || "Professional Service",
            items: [],
            media: [], // We might handle this later if r has attachments
            odometer: r.odometer?.toString() || ""
          };
        }).filter(Boolean);

        setWorkOrders(maps);
        setServiceRecords(records);
      } else {
        console.error("Records failed to load:", recordsRes.reason);
        toast({ title: "History Sync Warning", description: "Could not retrieve some service history records.", variant: "destructive" });
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

      // 4. Process Work Orders
      if (workOrdersRes.status === 'fulfilled') {
        setAvailableWorkOrders(workOrdersRes.value);
        console.log("Loaded available work orders:", workOrdersRes.value.length);
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

      const dto: ServiceHistoryUpsertDto = {
        equipmentId: record.equipmentId || "",
        workOrderId: (record as any).workOrderId || null,
        vendorId: finalVendorId,
        vendorNameRaw: record.vendor,
        invoiceNumber: record.woNumber,
        invoiceDate: record.date ? new Date(record.date).toISOString() : null, // Ensure UTC for Postgres
        totalAmount: record.totalCost,
        taxAmount: taxAmount,
        odometer: record.odometer ? (typeof record.odometer === 'string' ? parseInt(record.odometer) : record.odometer) : null,
        summary: record.description,
        status: "Completed",
        category: "General",
        lines: (record.items && record.items.length > 0)
          ? record.items
            .filter(it => {
              const desc = (it.description || "").toLowerCase();
              // Filter out summary lines captured by AI to avoid double counting
              const isSummary = desc.includes("subtotal") ||
                desc.includes("total") ||
                (desc.includes("taxable") && !desc.includes("part")) || // Allow "Taxable Parts" if specific
                desc.includes("amount due") ||
                desc.includes("balance due") ||
                desc.includes("liability");
              return !isSummary;
            })
            .map(it => {
              const rawType = (it.type || "misc").toLowerCase();
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
              return {
                type: typeMap[rawType] || "Misc",
                description: it.description || "Service",
                qty: it.quantity || 1,
                unitPrice: it.unitPrice || it.cost || 0,
                amount: it.cost || (it.unitPrice ? it.unitPrice * (it.quantity || 1) : 0),
                partNumber: it.partNumber
              };
            })
          : [
            {
              type: "Misc",
              description: record.description || "Service",
              qty: 1,
              unitPrice: record.totalCost,
              amount: record.totalCost,
              partNumber: null
            }
          ]
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

      // Resolve Vendor ID similarly to create (reuse logic ideally, but inline for now)
      let finalVendorId = vendors.find(v => v.name.toLowerCase() === (updates.vendor || "").toLowerCase())?.id || null;
      if (!finalVendorId && updates.vendor) {
        // Try to find if we just need to use what we have, or if we need to auto-create logic again. 
        // For update, we might assume user picks existing or keeps current, but let's be safe.
        // If generic update, maybe we skip auto-create to avoid complexity unless strictly needed.
        // But let's assume if they changed the vendor name to something new, we might need it.
        // For now, let's just stick to finding existing.
      }

      // Calculate Tax Amount
      const taxAmount = (updates.items || [])
        .filter(i => (i.type || "").toLowerCase().includes("tax"))
        .reduce((sum, i) => sum + (i.cost || (i.unitPrice || 0) * (i.quantity || 1)), 0);

      const dto: ServiceHistoryUpsertDto = {
        equipmentId: updates.equipmentId || "",
        workOrderId: updates.workOrderId || null, // Ensure we send null if undefined/empty
        vendorId: finalVendorId, // Might be null if not found, backend will try to match or whatever logic it has
        vendorNameRaw: updates.vendor,
        invoiceNumber: updates.woNumber,
        invoiceDate: updates.date ? new Date(updates.date).toISOString() : null,
        totalAmount: updates.totalCost || 0,
        taxAmount: taxAmount,
        odometer: updates.odometer ? (typeof updates.odometer === 'string' ? parseInt(updates.odometer) : updates.odometer) : null,
        summary: updates.description,
        status: "Completed",
        category: "General",
        lines: (updates.items || [])
          .filter(it => {
            const desc = (it.description || "").toLowerCase();
            const isSummary = desc.includes("subtotal") ||
              desc.includes("total") ||
              (desc.includes("taxable") && !desc.includes("part")) ||
              desc.includes("amount due") ||
              desc.includes("balance due") ||
              desc.includes("liability");
            return !isSummary;
          })
          .map(it => {
            const rawType = (it.type || "misc").toLowerCase();
            const typeMap: Record<string, string> = { "parts": "Parts", "part": "Part", "labor": "Labor", "labour": "Labor", "fee": "Fee", "fees": "Fee", "tax": "Tax", "taxes": "Tax", "misc": "Misc", "miscellaneous": "Misc" };
            return {
              type: typeMap[rawType] || "Misc",
              description: it.description || "Service",
              qty: it.quantity || 1,
              unitPrice: it.unitPrice || it.cost || 0,
              amount: it.cost || 0,
              partNumber: null
            };
          })
      };

      await serviceHistoryApi.update(id, dto);
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
