import { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useRef } from "react";
import { Loader2, Sparkles, Upload, Trash2, Check, ChevronsUpDown, Plus, CheckCircle2, FileText, Image as ImageIcon } from "lucide-react";
import { parseReceipt } from "@/lib/gemini";
import { ReceiptParsedData, Vendor, WorkOrderStatus, WorkOrderPriority, WorkOrderCostSource } from "@/lib/types";
import { ShopFormData } from "@/components/shops/types/ShopTypes";
import AddShopDialog from "../shops/AddShopDialog";
import InlineAddShopForm from "../shops/InlineAddShopForm";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import ShopRatingInputs, { ShopRatingData } from "../shops/ShopRatingInputs";
import { shopsApi } from "@/lib/shopsApi";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Calendar, Truck, User, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import VehicleSelector from "./VehicleSelector";
import WorkOrderItems, { WorkOrderItemData } from "./WorkOrderItems";
import FileUpload from "./FileUpload";



import { workOrdersApi, WorkOrderUpsertDto } from "@/lib/workOrdersApi";

type Priority = "low" | "normal" | "high" | "critical";
type VehicleType = string;

type NewWorkOrderState = {
  vehicle_id: string;
  vehicle_type: VehicleType;
  priority: Priority;
  eta_date: string;
  eta_hours: string;
  company_name: string;
  description: string;
  vendor_id: string | null;
  vendor_name: string;
};

interface WorkOrderDialogProps {
  editWoId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCompanyName?: string;
  initialVehicleId?: string;
  initialVehicleType?: string;
  initialUnitNumber?: string;
  onAfterCreated?: () => Promise<void> | void;
}

export default function WorkOrderDialog({
  editWoId,
  open,
  onOpenChange,
  initialCompanyName = "",
  initialVehicleId,
  initialVehicleType,
  initialUnitNumber,
  onAfterCreated
}: WorkOrderDialogProps) {
  const [workOrderItems, setWorkOrderItems] = useState<WorkOrderItemData[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isParsingReceipt, setIsParsingReceipt] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [draftWorkOrderId, setDraftWorkOrderId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // For Edit Mode: Existing Documents for Preview
  const [existingDocuments, setExistingDocuments] = useState<{ id: string; url: string; name: string }[]>([]);

  const [showOptionalFields, setShowOptionalFields] = useState({
    eta: false,
    attachments: false
  });

  const [customWorkOrderNumber, setCustomWorkOrderNumber] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'pdf'>('image');

  const [workOrderType, setWorkOrderType] = useState<"upcoming" | "completed">("upcoming");

  const [ratingData, setRatingData] = useState<ShopRatingData>({
    mainRating: 0,
    qualityRating: 0,
    timelinessRating: 0,
    communicationRating: 0,
    valueRating: 0,
    wouldRecommend: null,
    comment: ""
  });
  const [status, setStatus] = useState<WorkOrderStatus>(WorkOrderStatus.Open);

  const [newWorkOrder, setNewWorkOrder] = useState<NewWorkOrderState>({
    vehicle_id: initialVehicleId || "",
    vehicle_type: initialVehicleType || "truck",
    priority: "normal",
    eta_date: workOrderType === "completed" ? new Date().toISOString().split('T')[0] : "",
    eta_hours: "",
    company_name: initialCompanyName,
    description: "",
    vendor_id: null,
    vendor_name: ""
  });

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorOpen, setVendorOpen] = useState(false);

  // New Linkage State
  const [isAddShopOpen, setIsAddShopOpen] = useState(false);
  const [showAddShopInline, setShowAddShopInline] = useState(false);
  const [shopInitialData, setShopInitialData] = useState<Partial<ShopFormData>>({});
  const [parsedVendorDetails, setParsedVendorDetails] = useState<{
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    address: string; // Keep full formatted address for display
    phone?: string;
    website?: string;
  } | null>(null);

  const refreshVendors = async () => {
    try {
      const data = await shopsApi.list();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = data.map((s: any) => ({
        id: s.id,
        name: s.shop_name || s.name || "Unknown Shop",
      })) as Vendor[];
      setVendors(mapped);
      return mapped;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  // Load vendors on mount
  useEffect(() => {
    refreshVendors();
  }, []);

  // Fetch Work Order Details if in Edit Mode
  useEffect(() => {
    if (open && editWoId) {
      loadWorkOrderDetails(editWoId);
    } else if (open && !editWoId) {
      // Create Mode Reset
      resetForm();
    }
  }, [open, editWoId]);

  // ✅ Unified Hydration Logic (Client-Side)
  // acts as "hydrateForm" to restore state exactly as left
  const loadWorkOrderDetails = async (id: string) => {
    setIsLoadingDetails(true);
    try {
      const wo = await workOrdersApi.get(id);

      console.log("[WorkOrderDialog] Loaded WO:", wo);
      console.log("[WorkOrderDialog] Loaded WO - Documents count:", wo.documents?.length ?? 0);

      // 1. Basic Hydration
      setNewWorkOrder({
        vehicle_id: wo.equipmentId,
        vehicle_type: "truck",
        priority: (wo.priority === "Low" ? "low" :
          wo.priority === "High" ? "high" :
            wo.priority === "Critical" ? "critical" : "normal"),
        eta_date: wo.openedAt ? new Date(wo.openedAt).toISOString().split('T')[0] : "",
        eta_hours: "",
        company_name: wo.notes?.match(/Branch: (.*?)(\n|$)/)?.[1] || initialCompanyName,
        description: [wo.complaint, wo.notes].filter(x => x && x !== "Manual Entry" && !x.startsWith("Branch:")).join('\n\n').trim() || wo.title || "",
        vendor_id: wo.vendorId || null,
        vendor_name: wo.vendorName || ""
      });

      // 2. Status
      setStatus(wo.status as any);
      if (['Completed', 'Closed', 'Paid'].includes(wo.status as any)) {
        setWorkOrderType('completed');
      } else {
        setWorkOrderType('upcoming');
      }

      setCustomWorkOrderNumber(wo.workOrderNumber || null);

      // 3. Line Items (Effectively acting as our "Parsed Snapshot")
      if (wo.lines && wo.lines.length > 0) {
        setWorkOrderItems(wo.lines.map(l => ({
          description: l.description,
          price: l.unitPrice,
          quantity: l.qty
        })));
        // If we have lines, we assume "AI Complete" valid state for UI
        // This is part of the hydration-ready concept: existing lines 'are' the result.
      }

      // 4. Receipt Hydration (Simulate "Uploaded File")
      // Backend GET might miss documents, so we explicitly fetch them to be safe
      let docs = (wo as any).documents;

      if (!docs || docs.length === 0) {
        try {
          docs = await workOrdersApi.listAttachments(id);
          console.log("[WorkOrderDialog] Fetched attachments explicitly:", docs);
        } catch (err) {
          console.error("Failed to list attachments explicitly", err);
        }
      }

      if (docs && Array.isArray(docs)) {
        setExistingDocuments(docs.map((d: any) => ({
          id: d.id,
          url: d.fileUrl,
          name: d.fileName || d.fileUrl.split('/').pop() || "Attachment"
        })));

        if (docs.length > 0) {
          setShowOptionalFields(p => ({ ...p, attachments: true }));

          // ✅ HYDRATION: Treat first doc as the "current receipt" for preview
          const firstDoc = docs[0];
          console.log("[WorkOrderDialog] Hydrating receipt preview:", firstDoc.fileUrl);

          setPreviewUrl(firstDoc.fileUrl);
          setPreviewType(firstDoc.fileUrl.toLowerCase().endsWith('.pdf') ? 'pdf' : 'image');
        }
      }

      // 5. Rating Hydration
      if (wo.vendorId) {
        shopsApi.getRatings(wo.vendorId).then(ratings => {
          console.log("[WorkOrderDialog] All ratings for vendor (FULL):", JSON.stringify(ratings, null, 2));

          // Normalize matching: simpler check now that API normalizes keys
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const match = ratings.find((r: any) =>
            String(r.work_order_id) === String(wo.id)
          );

          console.log("[WorkOrderDialog] Matched rating:", match);

          if (match) {
            setRatingData({
              id: match.id,
              mainRating: match.rating,
              qualityRating: match.quality_rating || 0,
              timelinessRating: match.timeliness_rating || 0,
              communicationRating: match.communication_rating || 0,
              valueRating: match.value_rating || 0,
              comment: match.review_text || "",
              wouldRecommend: match.would_recommend
            });
          }
        }).catch(err => console.error("Failed to fetch ratings", err));
      }

    } catch (e) {
      console.error("Failed to load work order details", e);
      toast.error("Failed to load work order details");
    } finally {
      setIsLoadingDetails(false);
    }
  };


  const handleShopAdded = async () => {
    const updatedVendors = await refreshVendors();
    // Auto-select the most recent one if we have a name match or just created one
    if (shopInitialData.shop_name) {
      const match = updatedVendors.find(v => v.name.toLowerCase() === shopInitialData.shop_name?.toLowerCase());
      if (match) {
        setNewWorkOrder(prev => ({ ...prev, vendor_id: match.id, vendor_name: match.name }));
      }
    }
  };

  const resetForm = () => {
    setNewWorkOrder({
      vehicle_id: initialVehicleId || "",
      vehicle_type: initialVehicleType || "truck",
      priority: "normal",
      eta_date: "",
      eta_hours: "",
      company_name: initialCompanyName,
      description: "",
      vendor_id: null,
      vendor_name: ""
    });
    setWorkOrderType("upcoming");
    setRatingData({
      mainRating: 0,
      qualityRating: 0,
      timelinessRating: 0,
      communicationRating: 0,
      valueRating: 0,
      wouldRecommend: null,
      comment: ""
    });
    setWorkOrderItems([]);
    setSelectedFiles([]);
    setExistingDocuments([]);
    setDraftWorkOrderId(null);
    setIsUploading(false);
    setPreviewUrl(null);
    setShowOptionalFields({ eta: false, attachments: false });
    setCustomWorkOrderNumber(null);
    if (initialVehicleId && initialUnitNumber) {
      generateNextWorkOrderNumber(initialVehicleId, initialUnitNumber);
    }
  };

  // Smart default for status based on type (Only call when not editing to avoid override)
  useEffect(() => {
    if (editWoId) return;
    if (workOrderType === 'completed') {
      if (status === WorkOrderStatus.Draft || status === WorkOrderStatus.Open) {
        setStatus(WorkOrderStatus.Completed);
      }
    } else {
      if (status === WorkOrderStatus.Completed || status === WorkOrderStatus.Closed) {
        setStatus(WorkOrderStatus.Draft);
      }
    }
  }, [workOrderType, status, editWoId]);

  const computedLines = useMemo(() => {
    const items = (workOrderItems ?? []).filter(x => x.description.trim());
    return items.map((item) => ({
      type: "misc" as const,
      description: item.description,
      qty: item.quantity,
      unitPrice: item.price,
      amount: item.price * item.quantity,
      partNumber: null
    }));
  }, [workOrderItems]);

  const generateNextWorkOrderNumber = async (vehicleId: string, unitNumber: string) => {
    try {
      const history = await workOrdersApi.list({ equipmentId: vehicleId });
      const safeUnit = unitNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`^${safeUnit}-WO-(\\d+)$`, 'i');

      let maxIncrement = 0;

      history.forEach(wo => {
        if (!wo.workOrderNumber) return;
        const match = wo.workOrderNumber.match(regex);
        if (match) {
          const inc = parseInt(match[1], 10);
          if (!isNaN(inc) && inc > maxIncrement) {
            maxIncrement = inc;
          }
        }
      });

      const nextNum = `${unitNumber}-WO-${maxIncrement + 1}`;
      setCustomWorkOrderNumber(nextNum);

    } catch (err) {
      console.error("Error generating WO number:", err);
    }
  };

  /**
   * ✅ Draft creator used by FileUpload AND Create.
   * Upload Files needs an id -> we create a draft work order first.
   */
  const ensureDraftExists = async (): Promise<string> => {
    if (editWoId) return editWoId;
    if (draftWorkOrderId) return draftWorkOrderId;

    if (!newWorkOrder.vehicle_id) {
      toast.error("Select a vehicle first.");
      throw new Error("Vehicle required");
    }

    const created = await workOrdersApi.create({
      equipmentId: newWorkOrder.vehicle_id,
      vendorId: newWorkOrder.vendor_id,
      workOrderNumber: customWorkOrderNumber,
      odometerAtService: null,
      openedAt: new Date().toISOString(),
      title: "Draft",
      complaint: "Draft",
      status: WorkOrderStatus.Open, // Or Draft
      priority: WorkOrderPriority.Normal,
      costSource: WorkOrderCostSource.Estimated,
      estimatedTotal: 0,
      manualActualTotal: 0,
      lines: [
        {
          type: "misc",
          description: "Draft",
          qty: 1,
          unitPrice: 0,
          partNumber: null
        }
      ],
      documentIds: []
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = (created as any)?.id || (created as any)?.Id;
    if (!id) {
      throw new Error("Draft creation failed: backend did not return work order id.");
    }

    setDraftWorkOrderId(id);
    return id;
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!editWoId) return;
    try {
      await workOrdersApi.deleteAttachment(editWoId, docId);
      setExistingDocuments(prev => prev.filter(d => d.id !== docId));
      toast.success("Attachment removed");
    } catch (e) {
      console.error(e);
      toast.error("Failed to remove attachment");
    }
  };

  const handleCreate = async () => {
    if (!newWorkOrder.vehicle_id || (computedLines.length === 0 && !newWorkOrder.description?.trim())) return;

    if (isUploading) {
      toast.error("Attachments are still uploading. Please wait.");
      return;
    }

    const etaNote = newWorkOrder.eta_date
      ? `ETA: ${newWorkOrder.eta_date}${newWorkOrder.eta_hours ? ` ${newWorkOrder.eta_hours}` : ""}`
      : "";

    const mergedDescription = newWorkOrder.description;

    try {
      setIsSubmitting(true);

      const id = await ensureDraftExists();

      // 1. Upload any pending files ...
      let currentDocIds: string[] = [];

      // If we are editing, or if we just created a draft, we might already have docs.
      // We should fetch the latest state of the draft/WO to get existing doc IDs.
      const currentWo = await workOrdersApi.get(id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((currentWo as any).documents) {
        currentDocIds = ((currentWo as any).documents as any[]).map(d => d.id);
      }

      if (selectedFiles.length > 0) {
        try {
          setIsUploading(true);
          const newDocs = await workOrdersApi.uploadAttachments(id, selectedFiles);
          toast.success(`${selectedFiles.length} file(s) uploaded.`);
          setSelectedFiles([]); // Clear pending

          // Add new doc IDs to our list
          if (newDocs && Array.isArray(newDocs)) {
            newDocs.forEach(d => currentDocIds.push(d.id));
          }

          // Refresh existing docs UI if we are staying open
          if (editWoId) {
            // ... existing UI refresh logic ...
            const updated = await workOrdersApi.get(id);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const docs = (updated as any).documents || [];
            setExistingDocuments(docs.map((d: any) => ({
              id: d.id,
              url: d.fileUrl,
              name: d.fileName || d.fileUrl.split('/').pop() || "Attachment"
            })));
          }
        } catch (uploadErr) {
          console.error("Auto-upload failed", uploadErr);
          toast.error("Failed to upload new attachments, but saving Work Order...");
        } finally {
          setIsUploading(false);
        }
      }

      // Extract branch note if present
      const branchNoteMatch = mergedDescription?.match(/^Branch: (.*?)(\n|$)/i);
      const branchNote = branchNoteMatch ? branchNoteMatch[0].trim() : "";

      // Strip "Branch: ..." from description to avoid duplication
      const cleanComplaint = mergedDescription
        ?.replace(/^Branch: .*(\n|$)/g, '')
        .trim() || "Manual Entry";

      const finalNotes = [etaNote, branchNote].filter(Boolean).join("\n").trim();

      const finalStatus = status;

      const dto: WorkOrderUpsertDto = {
        equipmentId: newWorkOrder.vehicle_id,
        vendorId: newWorkOrder.vendor_id,
        workOrderNumber: customWorkOrderNumber,
        odometerAtService: null,
        openedAt: newWorkOrder.eta_date ? new Date(newWorkOrder.eta_date).toISOString() : new Date().toISOString(),
        closedAt: workOrderType === "completed" ? new Date().toISOString() : null,
        title: cleanComplaint.split("\n")[0].slice(0, 100),
        complaint: cleanComplaint,
        notes: finalNotes || undefined,
        status: finalStatus,
        priority: newWorkOrder.priority === "low" ? WorkOrderPriority.Low :
          newWorkOrder.priority === "normal" ? WorkOrderPriority.Normal :
            newWorkOrder.priority === "high" ? WorkOrderPriority.High : WorkOrderPriority.Critical,
        costSource: WorkOrderCostSource.Estimated,
        estimatedTotal: computedLines.reduce((acc, l) => acc + l.amount, 0),
        manualActualTotal: workOrderType === "completed" ? computedLines.reduce((acc, l) => acc + l.amount, 0) : 0,
        lines: computedLines,
        replaceDocuments: true, // FORCE Update of docs (Saved: true)
        documentIds: currentDocIds // Pass explicitly
      };

      await workOrdersApi.update(id, dto);

      // Handle Rating Submission
      if (workOrderType === "completed" && newWorkOrder.vendor_id && ratingData.mainRating > 0) {
        try {
          // If we have an existing rating ID, update it. Otherwise create new.
          if (ratingData.id) {
            await shopsApi.updateRating(newWorkOrder.vendor_id, ratingData.id, {
              rating: ratingData.mainRating,
              reviewText: ratingData.comment,
              serviceDate: new Date().toISOString(),
              workOrderId: id,
              qualityRating: ratingData.qualityRating,
              timelinessRating: ratingData.timelinessRating,
              communicationRating: ratingData.communicationRating,
              valueRating: ratingData.valueRating,
              wouldRecommend: ratingData.wouldRecommend === true
            });
            toast.success("Review updated successfully");
          } else {
            const newRating = await shopsApi.createRating(newWorkOrder.vendor_id, {
              rating: ratingData.mainRating,
              reviewText: ratingData.comment,
              serviceDate: new Date().toISOString(),
              workOrderId: id,
              qualityRating: ratingData.qualityRating,
              timelinessRating: ratingData.timelinessRating,
              communicationRating: ratingData.communicationRating,
              valueRating: ratingData.valueRating,
              wouldRecommend: ratingData.wouldRecommend === true
            });
            // Update local state with new ID so subsequent saves are updates
            setRatingData(prev => ({ ...prev, id: newRating.id }));
            toast.success("Review submitted successfully");
          }
        } catch (ratingErr) {
          console.error("Failed to submit rating", ratingErr);
          toast.error("Work order saved, but failed to save rating.");
        }
      }

      toast.success(editWoId ? "Work order updated." : "Work order created.");
      await onAfterCreated?.();

      if (!editWoId) {
        resetForm();
      }
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Failed to save work order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for fuzzy matching
  const levenshteinDistance = (a: string, b: string): number => {
    const matrix = [];
    let i, j;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    for (i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (i = 1; i <= b.length; i++) {
      for (j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            Math.min(
              matrix[i][j - 1] + 1, // insertion
              matrix[i - 1][j] + 1 // deletion
            )
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  const fuzzyMatch = (str1: string, str2: string, threshold = 0.85): boolean => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return true;
    const distance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
    const similarity = (longer.length - distance) / longer.length;
    return similarity >= threshold;
  };

  const processAIParsing = async (file: File, base64: string) => {
    setIsParsingReceipt(true);
    try {
      const result: ReceiptParsedData | null = await parseReceipt(base64, file.type);
      if (result && result.items) {
        const newItems = result.items
          .filter(it => {
            const desc = (it.description || "").toLowerCase();
            return !desc.includes("subtotal") &&
              !desc.includes("total") &&
              !desc.includes("amount due") &&
              !desc.includes("balance due") &&
              !desc.includes("taxable") &&
              !desc.includes("non-taxable");
          })
          .map(it => ({
            description: it.description,
            price: it.cost || 0,
            quantity: 1
          }));

        // Check if there is a discrepancy between items total and receipt total (usually Tax/Fees)
        if (result.total) {
          const itemsTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          const diff = result.total - itemsTotal;

          // If difference is significant (positive), add as Tax/Fees
          if (diff > 0.05) {
            newItems.push({
              description: "Tax / Fees",
              price: parseFloat(diff.toFixed(2)),
              quantity: 1
            });
          }
        }

        if (newItems.length === 0) {
          toast.warning("AI Scan: No valid items found after filtering.");
        } else {
          setWorkOrderItems(newItems);
          toast.success(`AI Scan: List populated with ${newItems.length} items from receipt.`);
        }

        // Auto-fill Vendor Name & Shop Matching Logic
        if (result.businessName) {
          const match = vendors.find(v => {
            // 1. Direct includes match (fallback)
            const includesMatch = v.name.toLowerCase().includes(result.businessName.toLowerCase()) ||
              result.businessName.toLowerCase().includes(v.name.toLowerCase());

            // 2. Fuzzy match
            const isFuzzy = fuzzyMatch(result.businessName, v.name, 0.75); // 75% threshold

            return includesMatch || isFuzzy;
          });

          if (match) {
            setNewWorkOrder(prev => ({ ...prev, vendor_id: match.id, vendor_name: match.name }));
            setParsedVendorDetails(null); // Clear manual option if matched
            toast.success(`✓ Matched existing shop: "${match.name}"`);
          } else {
            // 2. New Vendor Detected
            // toast.info(`🆕 New Vendor Detected: "${result.businessName}"`);
            setNewWorkOrder(prev => ({ ...prev, vendor_name: result.businessName || "", vendor_id: null }));

            setParsedVendorDetails({
              name: result.businessName,
              street: result.businessAddress?.street || "",
              city: result.businessAddress?.city || "",
              state: result.businessAddress?.state || "",
              zip: result.businessAddress?.zip || "",
              address: `${result.businessAddress?.street || ""} ${result.businessAddress?.city || ""} ${result.businessAddress?.state || ""}`.trim(),
              phone: result.businessContact?.phone,
              website: result.businessContact?.website
            });
          }
        }

        // Expand attachments section to show the uploaded file
        setShowOptionalFields(prev => ({ ...prev, attachments: true }));
      } else {
        toast.error("AI Scan: Could not extract data from this file.");
      }
    } catch (err) {
      console.error(err);
      toast.error("AI parsing failed");
    } finally {
      setIsParsingReceipt(false);
    }
  };

  const handleFileUploadAi = async (file: File) => {
    if (!file) return;
    // Add to attachments
    setSelectedFiles(prev => [...prev, file]);
    toast.info("File uploaded and added to attachments");

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];

      // Set preview
      setPreviewUrl(dataUrl);
      setPreviewType(file.type.includes('pdf') ? 'pdf' : 'image');

      if (file.type.includes('image') || file.type.includes('pdf')) {
        await processAIParsing(file, base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenChange = (isOpen: boolean) => {

    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const createDisabled = isSubmitting || !newWorkOrder.vehicle_id || (computedLines.length === 0 && !newWorkOrder.description?.trim());

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-7xl w-full h-[95vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem]">
        <DialogHeader className="px-10 py-8 border-b border-slate-100 bg-white sticky top-0 z-10">
          <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Create New Work Order</DialogTitle>
          <DialogDescription className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Create a new maintenance work order for your fleet</DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Form */}
          <div className={`flex-1 overflow-y-auto p-10 space-y-6 ${previewUrl ? 'md:w-1/2 border-r border-slate-100' : 'max-w-4xl mx-auto w-full'}`}>
            <div className="space-y-6">

              {/* 1. QUICK ACTIONS (Upload or Success) */}
              {previewUrl ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 relative overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex gap-4">
                      <div className="bg-emerald-100 text-emerald-600 p-1 rounded-lg h-16 w-16 flex items-center justify-center shrink-0 overflow-hidden border border-emerald-200">
                        {previewUrl && previewType === 'image' ? (
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Check className="w-8 h-8" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-slate-900 text-lg">Receipt Uploaded</h4>
                          <Badge className="bg-emerald-200 text-emerald-800 hover:bg-emerald-300 border-0">AI Complete</Badge>
                        </div>
                        <p className="text-sm text-slate-600 font-medium mb-3">
                          {selectedFiles[0]?.name || existingDocuments.find(d => d.url === previewUrl)?.name || "Document Scanned"}
                        </p>

                        <div className="flex gap-4 text-xs font-bold uppercase tracking-wide text-slate-500 bg-white/60 p-3 rounded-lg border border-emerald-100/50">
                          <div>
                            <span className="block text-[10px] text-emerald-600/70 mb-0.5">Total Extracted</span>
                            ${computedLines.reduce((acc, i) => acc + ((i.unitPrice || 0) * (i.qty || 1)), 0).toFixed(2)}
                          </div>
                          <div className="w-px bg-slate-200 h-full mx-1"></div>
                          <div>
                            <span className="block text-[10px] text-emerald-600/70 mb-0.5">Services</span>
                            {computedLines.length} Items
                          </div>
                          <div className="w-px bg-slate-200 h-full mx-1"></div>
                          <div>
                            <span className="block text-[10px] text-emerald-600/70 mb-0.5">Shop</span>
                            {newWorkOrder.vendor_name || "Detecting..."}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                        onClick={() => {
                          // Focus preview logic handled by keeping it visible
                        }}
                      >
                        👁️ View
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-slate-400 hover:text-red-500 h-8"
                        onClick={() => {
                          setPreviewUrl(null);
                          setSelectedFiles([]);
                          // Maybe clear extracted data too?
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => receiptInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 transition-all group flex items-center justify-between cursor-pointer relative ${isParsingReceipt ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isParsingReceipt ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600'}`}>
                      {isParsingReceipt ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Upload & AI Scan</h4>
                      <p className="text-xs text-slate-500 group-hover:text-blue-600/80">Auto-fill details from invoice or picture</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="group-hover:bg-blue-200 group-hover:text-blue-800">Recommended</Badge>

                  <input type="file" ref={receiptInputRef} className="hidden" accept="image/*,application/pdf" onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUploadAi(file);
                    e.target.value = '';
                  }} />
                </div>
              )}

              {/* EXISTING & PENDING DOCUMENTS */}
              {(existingDocuments.length > 0 || selectedFiles.length > 0) && (
                <div className="animate-in fade-in slide-in-from-top-1">
                  <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Attached Receipts & Files
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Pending Files */}
                    {selectedFiles.map((file, i) => {
                      const isImage = file.type.includes('image');
                      const url = URL.createObjectURL(file);
                      return (
                        <div key={`pending-${i}`} className="group relative border border-emerald-200 bg-emerald-50 rounded-xl overflow-hidden hover:shadow-md transition-all">
                          {/* Preview Area */}
                          <div className="aspect-video w-full bg-slate-100 relative items-center justify-center flex overflow-hidden">
                            {isImage ? (
                              <img
                                src={url}
                                alt={file.name}
                                className="w-full h-full object-cover opacity-80"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-emerald-600 p-4">
                                <FileText className="w-8 h-8 mb-2" />
                                <span className="text-[10px] font-bold uppercase">Pending Upload</span>
                              </div>
                            )}
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-emerald-500 text-white text-[10px]">New</Badge>
                            </div>

                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 w-8 p-0 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-sm"
                                onClick={() => {
                                  setSelectedFiles(prev => prev.filter((_, idx) => idx !== i));
                                  if (selectedFiles.length === 1) setPreviewUrl(null);
                                }}
                                title="Remove Pending"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="p-2 border-t border-emerald-100 flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-700 truncate flex-1">{file.name}</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Existing Persisted Files */}
                    {existingDocuments.map((doc) => {
                      const isImage = !doc.url.toLowerCase().endsWith('.pdf');
                      return (
                        <div key={doc.id} className="group relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 hover:shadow-md transition-all">
                          {/* Preview Area */}
                          <div className="aspect-video w-full bg-slate-100 relative items-center justify-center flex overflow-hidden">
                            {isImage ? (
                              <img
                                src={doc.url}
                                alt={doc.name}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-slate-400 p-4">
                                <FileText className="w-8 h-8 mb-2 text-slate-400" />
                                <span className="text-[10px] font-bold uppercase">PDF Document</span>
                              </div>
                            )}

                            {/* Hover Actions Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              {/* Open in new tab */}
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-white text-slate-700"
                                onClick={() => window.open(doc.url, '_blank')}
                                title="View Full Size"
                              >
                                <Upload className="w-3.5 h-3.5 rotate-45" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 w-8 p-0 rounded-full bg-red-500/90 hover:bg-red-600 text-white"
                                onClick={() => handleDeleteDocument(doc.id)}
                                title="Remove"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Footer Info */}
                          <div className="p-2 bg-white border-t border-slate-100 flex items-center gap-2">
                            <div className={`p-1 rounded ${isImage ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                              {isImage ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                            </div>
                            <span className="text-xs font-medium text-slate-700 truncate flex-1" title={doc.name}>
                              {doc.name}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. work Order Type */}
              <div className="bg-slate-50 p-1 rounded-xl border border-slate-100">
                <RadioGroup
                  value={workOrderType}
                  onValueChange={(v: "upcoming" | "completed") => setWorkOrderType(v)}
                  className="grid grid-cols-2"
                >
                  <div className={`relative flex items-center space-x-2 p-3 rounded-[0.6rem] cursor-pointer transition-all ${workOrderType === 'upcoming' ? 'bg-white shadow-sm ring-1 ring-black/5' : 'hover:bg-slate-100/50 text-slate-500'}`}>
                    <RadioGroupItem value="upcoming" id="type-upcoming" className="sr-only" />
                    <div className="flex items-center gap-3 w-full" onClick={() => setWorkOrderType('upcoming')}>
                      <Calendar className={`w-5 h-5 ${workOrderType === 'upcoming' ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div>
                        <Label htmlFor="type-upcoming" className={`font-bold cursor-pointer ${workOrderType === 'upcoming' ? 'text-slate-900' : 'text-slate-500'}`}>Upcoming Work</Label>
                        <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">Plan Future</p>
                      </div>
                    </div>
                  </div>
                  <div className={`relative flex items-center space-x-2 p-3 rounded-[0.6rem] cursor-pointer transition-all ${workOrderType === 'completed' ? 'bg-white shadow-sm ring-1 ring-black/5' : 'hover:bg-slate-100/50 text-slate-500'}`}>
                    <RadioGroupItem value="completed" id="type-completed" className="sr-only" />
                    <div className="flex items-center gap-3 w-full" onClick={() => setWorkOrderType('completed')}>
                      <CheckCircle2 className={`w-5 h-5 ${workOrderType === 'completed' ? 'text-green-600' : 'text-slate-400'}`} />
                      <div>
                        <Label htmlFor="type-completed" className={`font-bold cursor-pointer ${workOrderType === 'completed' ? 'text-slate-900' : 'text-slate-500'}`}>Completed Work</Label>
                        <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">Log Past</p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* 3. BASIC INFO CARD */}
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 py-3 px-4 border-b border-slate-100">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Asset & Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company_name" className="text-xs font-bold text-slate-500 mb-1 block">Company / Branch</Label>
                      <Input
                        id="company_name"
                        value={newWorkOrder.company_name}
                        onChange={(e) => setNewWorkOrder((p) => ({ ...p, company_name: e.target.value }))}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="service_date" className="text-xs font-bold text-slate-500 mb-1 block">Service Date</Label>
                      <Input
                        id="service_date"
                        type="date"
                        value={newWorkOrder.eta_date}
                        onChange={(e) => setNewWorkOrder((p) => ({ ...p, eta_date: e.target.value }))}
                        className="h-9 font-medium text-slate-700"
                      />
                    </div>
                  </div>

                  <VehicleSelector
                    selectedVehicleId={newWorkOrder.vehicle_id}
                    selectedVehicleType={newWorkOrder.vehicle_type}
                    onVehicleSelect={(vehicleId: string, vehicleType: string, unitNumber: string) => {
                      setNewWorkOrder((p) => ({
                        ...p,
                        vehicle_id: vehicleId,
                        vehicle_type: vehicleType
                      }));

                      setDraftWorkOrderId(null);
                      setSelectedFiles([]);
                      setIsUploading(false);

                      generateNextWorkOrderNumber(vehicleId, unitNumber);
                    }}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="priority" className="text-xs font-bold text-slate-500 mb-1 block">Priority</Label>
                      <Select
                        value={newWorkOrder.priority}
                        onValueChange={(value) => setNewWorkOrder((p) => ({ ...p, priority: value as Priority }))}
                      >
                        <SelectTrigger id="priority" className="h-9">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status" className="text-xs font-bold text-slate-500 mb-1 block">Status</Label>
                      <Select
                        value={status.toString()}
                        onValueChange={(val) => setStatus(parseInt(val) as WorkOrderStatus)}
                      >
                        <SelectTrigger id="status" className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={WorkOrderStatus.Draft.toString()}>📝 Draft</SelectItem>
                          <SelectItem value={WorkOrderStatus.Open.toString()}>🔵 Open</SelectItem>
                          <SelectItem value={WorkOrderStatus.InProcess.toString()}>🟡 In Progress</SelectItem>
                          <SelectItem value={WorkOrderStatus.Completed.toString()}>✅ Completed</SelectItem>
                          <SelectItem value={WorkOrderStatus.Closed.toString()}>🔒 Closed</SelectItem>
                          <SelectItem value={WorkOrderStatus.Paid.toString()}>💰 Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                  </div>

                  <div>
                    <Label htmlFor="description" className="text-xs font-bold text-slate-500 mb-1 block">Notes / Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={newWorkOrder.description}
                      onChange={(e) => setNewWorkOrder((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Routine maintenance, oil change, etc."
                      className="min-h-[60px] text-sm resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 4. SHOP SELECTION (Reveal if basic info started or upload done) */}
              <Card className="border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-500">
                <CardHeader className="bg-slate-50/50 py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <User className="w-4 h-4" /> Service Provider
                  </CardTitle>
                  {newWorkOrder.vendor_id && <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">Selected</Badge>}
                </CardHeader>
                <CardContent className="p-4">
                  {/* Custom UI for New Vendor Detected state OR Inline Add Form */}
                  {(parsedVendorDetails && !newWorkOrder.vendor_id) || showAddShopInline ? (
                    showAddShopInline ? (
                      <InlineAddShopForm
                        initialData={shopInitialData}
                        onCancel={() => {
                          setShowAddShopInline(false);
                          if (!parsedVendorDetails) {
                            // If we manually opened it, maybe reset selection?
                            // For now just close.
                          }
                        }}
                        onSuccess={(newShop) => {
                          handleShopAdded(); // triggers refresh
                          // Auto-select
                          setNewWorkOrder(prev => ({ ...prev, vendor_id: newShop.id, vendor_name: newShop.shop_name }));
                          setParsedVendorDetails(null); // Clear prompt
                          setShowAddShopInline(false);
                          toast.success("Vendor added and selected!");
                        }}
                      />
                    ) : (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">New Vendor Found</span>
                            </div>
                            <h4 className="font-bold text-slate-900">{parsedVendorDetails?.name}</h4>
                            <p className="text-xs text-slate-600 line-clamp-1">{parsedVendorDetails?.address}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShopInitialData({
                                  shop_name: parsedVendorDetails?.name,
                                  address: parsedVendorDetails?.street || parsedVendorDetails?.address, // Prefer street for the input
                                  city: parsedVendorDetails?.city,
                                  state: parsedVendorDetails?.state,
                                  zip: parsedVendorDetails?.zip,
                                  phone: parsedVendorDetails?.phone,
                                  website: parsedVendorDetails?.website,
                                  vendor_preference: "STANDARD"
                                });
                                setShowAddShopInline(true); // Expand inline
                              }}
                              className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs h-8 shrink-0"
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Now
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setParsedVendorDetails(null); // Dismiss detection
                                setNewWorkOrder(p => ({ ...p, vendor_name: "" })); // Reset
                              }}
                              className="h-8 text-[10px] text-amber-700 hover:bg-amber-100"
                            >
                              Change
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={vendorOpen}
                          className={cn(
                            "w-full justify-between h-11 rounded-lg border-slate-200 bg-white text-left font-medium",
                            newWorkOrder.vendor_id && "border-blue-200 bg-blue-50/50 text-blue-900"
                          )}
                        >
                          {newWorkOrder.vendor_id ? (
                            <span className="flex items-center gap-2 truncate">
                              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                              {vendors.find((v) => v.id === newWorkOrder.vendor_id)?.name || "Unknown Vendor"}
                              {vendors.find((v) => v.id === newWorkOrder.vendor_id) &&
                                <Badge variant="secondary" className="ml-2 h-5 text-[10px] px-1.5 bg-blue-100 text-blue-700">Matched</Badge>
                              }
                            </span>
                          ) : (
                            newWorkOrder.vendor_name ? newWorkOrder.vendor_name : <span className="text-slate-400 font-normal">Select vendor...</span>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0 rounded-xl overflow-hidden shadow-xl" align="start">
                        <Command>
                          <CommandInput placeholder="Search vendor..." className="text-sm" />
                          <CommandList>
                            <CommandEmpty>No vendor found.</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                key="none"
                                value="none"
                                onSelect={() => {
                                  setNewWorkOrder((p) => ({ ...p, vendor_id: null, vendor_name: "" }));
                                  setVendorOpen(false);
                                }}
                                className="text-sm"
                              >
                                In-House / No Vendor
                                {newWorkOrder.vendor_id === null && <Check className="ml-auto h-3 w-3 text-blue-600" />}
                              </CommandItem>

                              {vendors.map((vendor) => (
                                <CommandItem
                                  key={vendor.id}
                                  value={vendor.name}
                                  onSelect={() => {
                                    setNewWorkOrder((p) => ({ ...p, vendor_id: vendor.id, vendor_name: vendor.name }));
                                    setVendorOpen(false);
                                  }}
                                  className="text-sm"
                                >
                                  {vendor.name}
                                  {newWorkOrder.vendor_id === vendor.id && (
                                    <Check className="ml-auto h-3 w-3 text-blue-600" />
                                  )}
                                </CommandItem>
                              ))}
                              <div className="p-1 border-t border-slate-100">
                                <CommandItem
                                  key="add-new-manual"
                                  value="add-new"
                                  onSelect={() => {
                                    setShopInitialData({});
                                    setShopInitialData({});
                                    setShowAddShopInline(true);
                                    // setIsAddShopOpen(true); // Don't open modal anymore
                                    setVendorOpen(false);
                                  }}
                                  className="text-blue-600 text-xs font-bold bg-blue-50 rounded-lg justify-center py-2"
                                >
                                  <Plus className="w-3 h-3 mr-1" /> Add New Shop
                                </CommandItem>
                              </div>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </CardContent>
              </Card>

              {/* 5. SERVICES (Progressive) */}
              <Card className="border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-500 delay-100">
                <CardHeader className="bg-slate-50/50 py-3 px-4 border-b border-slate-100 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Line Items
                  </CardTitle>
                  {computedLines.length > 0 &&
                    <div className="font-mono font-bold text-sm bg-white px-2 py-1 rounded border border-slate-200 text-slate-700">
                      ${computedLines.reduce((acc, item) => acc + item.amount, 0).toFixed(2)}
                    </div>
                  }
                </CardHeader>
                <CardContent className="p-4">
                  <WorkOrderItems items={workOrderItems} onItemsChange={setWorkOrderItems} />

                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-bold text-slate-500"
                        onClick={() => setShowOptionalFields((prev) => ({ ...prev, attachments: !prev.attachments }))}
                      >
                        {showOptionalFields.attachments ? "Hide" : "Manage"} Attachments ({selectedFiles.length})
                      </Button>
                    </div>

                    {/* Existing Documents / Receipts Preview */}
                    {existingDocuments.length > 0 && (
                      <div className="mt-4 mb-4 space-y-3">
                        <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Attached Receipts & Files
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          {existingDocuments.map((doc) => {
                            const isImage = !doc.url.toLowerCase().endsWith('.pdf');
                            return (
                              <div key={doc.id} className="group relative border border-slate-200 rounded-xl overflow-hidden bg-slate-50 hover:shadow-md transition-all">
                                {/* Preview Area */}
                                <div className="aspect-video w-full bg-slate-100 relative items-center justify-center flex overflow-hidden">
                                  {isImage ? (
                                    <img
                                      src={doc.url}
                                      alt={doc.name}
                                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                  ) : (
                                    <div className="flex flex-col items-center justify-center text-slate-400 p-4">
                                      <FileText className="w-8 h-8 mb-2 text-slate-400" />
                                      <span className="text-[10px] font-bold uppercase">PDF Document</span>
                                    </div>
                                  )}

                                  {/* Hover Actions Overlay */}
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="h-8 w-8 p-0 rounded-full bg-white/90 hover:bg-white text-slate-700"
                                      onClick={() => window.open(doc.url, '_blank')}
                                      title="View Full Size"
                                    >
                                      <Upload className="w-3.5 h-3.5 rotate-45" /> {/* Using Upload generic icon as 'Arrow Up Right' proxy or just standard link behavior */}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="h-8 w-8 p-0 rounded-full bg-red-500/90 hover:bg-red-600 text-white"
                                      onClick={() => handleDeleteDocument(doc.id)}
                                      title="Remove"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Footer Info */}
                                <div className="p-2 bg-white border-t border-slate-100 flex items-center gap-2">
                                  <div className={`p-1 rounded ${isImage ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                    {isImage ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                  </div>
                                  <span className="text-xs font-medium text-slate-700 truncate flex-1" title={doc.name}>
                                    {doc.name}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {showOptionalFields.attachments && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <FileUpload
                          files={selectedFiles}
                          onFilesChange={setSelectedFiles}
                          ensureWorkOrderId={ensureDraftExists}
                          onUploadingChange={setIsUploading}
                          onUploaded={(id) => setDraftWorkOrderId(id)}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 6. RATING (Collapsible & Progressive) */}
              {workOrderType === 'completed' && newWorkOrder.vendor_id && (
                <Collapsible defaultOpen={true}>
                  <Card className="border-amber-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 bg-amber-50/30">
                    <CardHeader className="py-0 px-0">
                      <CollapsibleTrigger className="w-full flex items-center justify-between p-4 hover:bg-amber-50/50 transition-colors text-left group">
                        <div className="flex items-center gap-3">
                          <div className="bg-amber-100 p-2 rounded-full text-amber-600 transition-transform group-hover:scale-110">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <CardTitle className="font-bold text-slate-900 text-sm">Rate This Service</CardTitle>
                            <CardDescription className="text-xs text-slate-500">Optional: Share your experience with {newWorkOrder.vendor_name}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {ratingData.mainRating > 0 && <Badge className="bg-amber-500 hover:bg-amber-600">Rated {ratingData.mainRating}⭐</Badge>}
                          <ChevronDown className="w-4 h-4 text-slate-400 group-data-[state=open]:rotate-180 transition-transform" />
                        </div>
                      </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="p-4 pt-0 border-t border-amber-100/50">
                        <div className="pt-4">
                          <ShopRatingInputs
                            data={ratingData}
                            onChange={setRatingData}
                            variant="compact"
                          />
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-6 pb-2">
                <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-bold text-slate-500">Cancel</Button>
                <Button
                  disabled={createDisabled}
                  onClick={handleCreate}
                  className={`h-12 px-6 rounded-xl font-black uppercase tracking-wider shadow-lg transition-all ${workOrderType === 'completed' && ratingData.mainRating > 0 ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200 text-white' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 text-white'}`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {workOrderType === 'completed' ? 'Logging...' : 'Creating...'}
                    </>
                  ) : (
                    workOrderType === 'completed' && ratingData.mainRating > 0 ? (
                      <span className="flex items-center">Log Work & Submit Review <Check className="ml-2 w-4 h-4" /></span>
                    ) : (
                      "Create Work Order"
                    )
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* RIGHT: Preview */}
          {previewUrl && (
            <div className="hidden md:flex w-1/2 bg-slate-100/50 border-l border-slate-200 flex-col items-center justify-center p-6 relative">
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <a href={previewUrl} target="_blank" rel="noreferrer" className="bg-white/80 backdrop-blur p-2 rounded-lg shadow-sm text-slate-500 hover:text-blue-600 border border-slate-200 transition-all" title="Open in new tab">
                  <Upload className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="bg-white/80 backdrop-blur p-2 rounded-lg shadow-sm text-slate-500 hover:text-rose-500 border border-slate-200 transition-all"
                  title="Close Preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="w-full h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group">
                {previewType === 'image' ? (
                  <img
                    src={previewUrl}
                    alt="Receipt Preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border-0"
                    title="PDF Preview"
                  />
                )}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-medium truncate">Previewing Uploaded Document</p>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Analysis Active
              </p>
            </div>
          )}
        </div>
      </DialogContent>

      <AddShopDialog
        open={isAddShopOpen}
        onOpenChange={setIsAddShopOpen}
        onShopAdded={handleShopAdded}
        initialData={shopInitialData}
      />
    </Dialog >
  );
}

