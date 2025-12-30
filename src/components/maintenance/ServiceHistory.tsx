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
import { equipmentApi } from "@/lib/equipmentApi";
import { Vendor, WorkOrder, WorkOrderStatus, WorkOrderPriority } from "@/lib/types";
import { serviceHistoryApi, type ServiceHistoryDto } from "@/lib/serviceHistoryApi";

type UiVehicle = {
  id: string;
  unitNumber: string;
  make?: string;
  model?: string;
  year?: number;
  vin?: string;
  type: "truck" | "trailer";
};

const ServiceHistory = () => {
  console.log("%c--- SERVICE HISTORY v2.1 (FIXED PATHS/DTO) ---", "color: #2563eb; font-weight: bold;");
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialRecordId = queryParams.get('recordId');

  const [serviceRecords, setServiceRecords] = useState<ServiceHistoryDto[]>([]);
  const [vehicles, setVehicles] = useState<UiVehicle[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
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
        equipmentApi.list()
      ]);

      const recordsRes = results[0];
      const equipmentRes = results[1];

      // 1. Process Records
      if (recordsRes.status === 'fulfilled') {
        const records = recordsRes.value || [];
        const mappedRecords: WorkOrder[] = records.map(r => {
          if (!r || !r.id) return null as any;
          return {
            id: r.id,
            woNumber: r.invoiceNumber || `SR-${r.id.slice(0, 5)}`,
            equipmentId: r.assetId || "",
            status: (r.status as any) || WorkOrderStatus.COMPLETED,
            priority: WorkOrderPriority.MEDIUM,
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
          };
        }).filter(Boolean);

        setWorkOrders(mappedRecords);
        setServiceRecords(records);
      } else {
        console.error("Records failed to load:", recordsRes.reason);
        toast({ title: "History Sync Warning", description: "Could not retrieve some service history records.", variant: "destructive" });
      }

      // 2. Process Equipment
      if (equipmentRes.status === 'fulfilled') {
        const equipment = equipmentRes.value || [];
        const allEquipment: UiVehicle[] = equipment.map(e => ({
          id: e.id,
          unitNumber: e.number,
          type: e.type,
          make: e.make || undefined,
          model: e.model || undefined,
          year: e.year || undefined,
          vin: e.vin
        }));
        setVehicles(allEquipment);
      } else {
        console.error("Equipment failed to load:", equipmentRes.reason);
        toast({ title: "Fleet Sync Warning", description: "Could not retrieve equipment list.", variant: "destructive" });
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
              ExtractedJson: rawAiData,
              VendorNameRaw: record.vendor,
              ConfidenceScore: 0.95,
              Status: "processed"
            });
          }
        }
      }

      // 4. Create the final service record (CamelCase as per Swagger)
      const sumOfItems = (record.items || []).reduce((sum, it) => sum + (it.cost || 0), 0);
      const taxAmount = Math.max(0, record.totalCost - sumOfItems);

      const dto: any = {
        assetType: (asset?.type?.toLowerCase() as any) || "truck",
        assetId: record.equipmentId,
        vendorNameRaw: record.vendor,
        invoiceNumber: record.woNumber,
        invoiceDate: record.date ? new Date(record.date).toISOString() : null, // Ensure UTC for Postgres
        totalAmount: record.totalCost,
        taxAmount: taxAmount,
        odometer: record.odometer ? parseInt(record.odometer) : null,
        summary: record.description,
        status: "closed",
        category: "General",
        attachmentUrl: fileUrl,
        attachmentFileName: files && files.length > 0 ? files[0].name : null,
        lines: (record.items && record.items.length > 0)
          ? record.items.map(it => ({
            type: (it.type || "misc").toLowerCase(),
            description: it.description || "Service",
            qty: it.quantity || 1,
            unitPrice: it.unitPrice || it.cost || 0,
            amount: it.cost || (it.unitPrice ? it.unitPrice * (it.quantity || 1) : 0)
          }))
          : [
            {
              type: "misc",
              description: record.description || "Service",
              qty: 1,
              unitPrice: record.totalCost,
              amount: record.totalCost
            }
          ]
      };

      console.log("Service Record Payload:", dto);
      await serviceHistoryApi.create(dto);

      toast({ title: "Success", description: "Service record audited and saved." });
      loadData();
    } catch (error: any) {
      console.error("Error creating service record:", error);
      const detail = error.details?.message || error.message;
      toast({ title: "Archive Failed", description: detail || "Failed to save service record.", variant: "destructive" });
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
            onUpdate={() => { }}
            onUpdateVendors={setVendors}
            initialSelectedRecordId={initialRecordId}
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
