import { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useRef } from "react";
import { Loader2, Sparkles, Upload, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { parseReceipt } from "@/lib/gemini";
import { ReceiptParsedData, Vendor } from "@/lib/types";
import { shopsApi } from "@/lib/shopsApi";
import { cn } from "@/lib/utils";
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


import { WorkOrderStatus, WorkOrderPriority, WorkOrderCostSource } from "@/lib/types";
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

interface CreateWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCompanyName: string;
  onAfterCreated?: () => Promise<void> | void;
}

export default function CreateWorkOrderDialog({
  open,
  onOpenChange,
  initialCompanyName,
  onAfterCreated
}: CreateWorkOrderDialogProps) {
  const [workOrderItems, setWorkOrderItems] = useState<WorkOrderItemData[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isParsingReceipt, setIsParsingReceipt] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [draftWorkOrderId, setDraftWorkOrderId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [showOptionalFields, setShowOptionalFields] = useState({
    eta: false,
    attachments: false
  });

  const [customWorkOrderNumber, setCustomWorkOrderNumber] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'pdf'>('image');

  const [newWorkOrder, setNewWorkOrder] = useState<NewWorkOrderState>({
    vehicle_id: "",
    vehicle_type: "truck",
    priority: "normal",
    eta_date: "",
    eta_hours: "",
    company_name: initialCompanyName,
    description: "",
    vendor_id: null,
    vendor_name: ""
  });

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorOpen, setVendorOpen] = useState(false);

  // Load vendors on mount
  useEffect(() => {
    shopsApi.list().then(data => {
      const mapped = data.map((s: any) => ({
        id: s.id,
        name: s.name || s.shopName,
      })) as Vendor[];
      setVendors(mapped);
    }).catch(console.error);
  }, []);

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

  const resetForm = () => {
    setNewWorkOrder({
      vehicle_id: "",
      vehicle_type: "truck",
      priority: "normal",
      eta_date: "",
      eta_hours: "",
      company_name: initialCompanyName,
      description: "",
      vendor_id: null,
      vendor_name: ""
    });
    setWorkOrderItems([]);
    setSelectedFiles([]);
    setDraftWorkOrderId(null);
    setIsSubmitting(false);
    setIsUploading(false);
    setShowOptionalFields({ eta: false, attachments: false });
    setPreviewUrl(null);
  };

  const generateNextWorkOrderNumber = async (vehicleId: string, unitNumber: string) => {
    try {
      // 1. Fetch all work orders for this vehicle
      const history = await workOrdersApi.list({ equipmentId: vehicleId });

      // 2. Filter for WOs that match the pattern "Unit#-WO-X"
      // Escape unitNumber for regex
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

      // 3. Generate next
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
    if (draftWorkOrderId) return draftWorkOrderId;

    if (!newWorkOrder.vehicle_id) {
      toast.error("Select a vehicle first.");
      throw new Error("Vehicle required");
    }

    // Backend requires lines -> create minimal draft then overwrite on update()
    const created = await workOrdersApi.create({
      equipmentId: newWorkOrder.vehicle_id,
      vendorId: newWorkOrder.vendor_id,
      workOrderNumber: customWorkOrderNumber,
      odometerAtService: null,
      openedAt: new Date().toISOString(),
      title: "Draft",
      complaint: "Draft",
      status: WorkOrderStatus.Open, // Or Draft if enum supports it
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

    const id = (created as any)?.id || (created as any)?.Id; // ✅ handle both
    if (!id) {
      throw new Error("Draft creation failed: backend did not return work order id.");
    }

    setDraftWorkOrderId(id);
    return id;
  };

  const handleCreate = async () => {
    if (!newWorkOrder.vehicle_id || computedLines.length === 0) return;

    if (isUploading) {
      toast.error("Attachments are still uploading. Please wait.");
      return;
    }

    const etaNote = newWorkOrder.eta_date
      ? `ETA: ${newWorkOrder.eta_date}${newWorkOrder.eta_hours ? ` ${newWorkOrder.eta_hours}` : ""}`
      : "";
    const priorityNote = newWorkOrder.priority ? `Priority: ${newWorkOrder.priority}` : "";
    const extraNotes = [priorityNote, etaNote].filter(Boolean).join(" | ");

    const mergedDescription =
      extraNotes && newWorkOrder.description
        ? `${extraNotes}\n\n${newWorkOrder.description}`
        : extraNotes
          ? extraNotes
          : newWorkOrder.description;

    try {
      setIsSubmitting(true);

      // ✅ If user uploaded files first, draft already exists.
      // ✅ If not, we still create draft now then update it to "open".
      const id = await ensureDraftExists();

      const dto: WorkOrderUpsertDto = {
        equipmentId: newWorkOrder.vehicle_id,
        vendorId: newWorkOrder.vendor_id,
        workOrderNumber: customWorkOrderNumber,
        odometerAtService: null,
        openedAt: new Date().toISOString(),
        title: mergedDescription?.trim() ? mergedDescription.split("\n")[0].slice(0, 100) : "New Work Order",
        complaint: mergedDescription?.trim() || "Manual Entry",
        status: WorkOrderStatus.Open,
        priority: newWorkOrder.priority === "low" ? WorkOrderPriority.Low :
          newWorkOrder.priority === "normal" ? WorkOrderPriority.Normal :
            newWorkOrder.priority === "high" ? WorkOrderPriority.High : WorkOrderPriority.Critical,
        costSource: WorkOrderCostSource.Estimated,
        estimatedTotal: 0,
        manualActualTotal: 0,
        lines: computedLines,
        documentIds: []
      };

      await workOrdersApi.update(id, dto);

      toast.success("Work order created.");
      await onAfterCreated?.();
      resetForm();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Failed to create work order.");
    } finally {
      setIsSubmitting(false);
    }
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

        // Auto-fill Vendor Name
        if (result.businessName) {
          const match = vendors.find(v => v.name.toLowerCase().includes(result.businessName.toLowerCase()) || result.businessName.toLowerCase().includes(v.name.toLowerCase()));
          if (match) {
            setNewWorkOrder(prev => ({ ...prev, vendor_id: match.id, vendor_name: match.name }));
            toast.success(`AI Match: Vendor found "${match.name}"`);
          } else {
            toast.info(`AI: Extracted vendor "${result.businessName}" (No direct match)`);
            setNewWorkOrder(prev => ({ ...prev, vendor_name: result.businessName || "", vendor_id: null }));
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

  const createDisabled = isSubmitting || !newWorkOrder.vehicle_id || computedLines.length === 0;

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={newWorkOrder.company_name}
                    onChange={(e) => setNewWorkOrder((p) => ({ ...p, company_name: e.target.value }))}
                    placeholder="Your Company Name"
                  />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input value={new Date().toLocaleDateString()} disabled className="bg-gray-50" />
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

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newWorkOrder.priority}
                  onValueChange={(value) => setNewWorkOrder((p) => ({ ...p, priority: value as Priority }))}
                >
                  <SelectTrigger id="priority" className="w-full">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <WorkOrderItems items={workOrderItems} onItemsChange={setWorkOrderItems} />

              {/* AI Scan Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" /> AI SCAN
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Instant extraction of costs and tasks</p>
                </div>

                <div
                  onClick={() => receiptInputRef.current?.click()}
                  className={`border-4 border-dashed rounded-xl p-8 transition-all group flex flex-col items-center justify-center text-center cursor-pointer relative ${isParsingReceipt ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 bg-slate-50/30 hover:bg-blue-50/30 hover:border-blue-300'}`}
                >
                  {isParsingReceipt ? (
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2" />
                      <p className="text-sm font-bold text-slate-700">Audit Invoice/Receipt</p>
                    </>
                  )}
                  <input type="file" ref={receiptInputRef} className="hidden" accept="image/*,application/pdf" onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUploadAi(file);
                    e.target.value = '';
                  }} />
                </div>
              </div>

              {/* Vendor Selection */}
              <div className="flex flex-col gap-2">
                <Label className="flex items-center gap-2">
                  Professional Service Partner <Sparkles className="h-3 w-3 text-blue-600" />
                </Label>
                <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={vendorOpen}
                      className="w-full justify-between"
                    >
                      {newWorkOrder.vendor_id
                        ? vendors.find((v) => v.id === newWorkOrder.vendor_id)?.name || "Select Vendor"
                        : (newWorkOrder.vendor_name ? newWorkOrder.vendor_name : "In-House / Select Vendor")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search vendor..." />
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
                          >
                            In_House / No Vendor
                            {newWorkOrder.vendor_id === null && <Check className="ml-auto h-4 w-4" />}
                          </CommandItem>
                          {vendors.map((vendor) => (
                            <CommandItem
                              key={vendor.id}
                              value={vendor.name}
                              onSelect={() => {
                                setNewWorkOrder((p) => ({ ...p, vendor_id: vendor.id, vendor_name: vendor.name }));
                                setVendorOpen(false);
                              }}
                            >
                              {vendor.name}
                              {newWorkOrder.vendor_id === vendor.id && (
                                <Check className="ml-auto h-4 w-4" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="description">Additional Notes (Optional)</Label>
                <Textarea
                  id="description"
                  value={newWorkOrder.description}
                  onChange={(e) => setNewWorkOrder((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Any additional notes or special instructions..."
                  className="min-h-20"
                />
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={showOptionalFields.attachments ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowOptionalFields((prev) => ({ ...prev, attachments: !prev.attachments }))}
                  >
                    {showOptionalFields.attachments ? "Hide" : "Add"} Attachments
                  </Button>
                </div>

                {showOptionalFields.attachments && (
                  <div className="p-4 border rounded-lg bg-gray-50 space-y-2">
                    <FileUpload
                      files={selectedFiles}
                      onFilesChange={setSelectedFiles}
                      ensureWorkOrderId={ensureDraftExists}
                      onUploadingChange={setIsUploading}
                      onUploaded={(id) => setDraftWorkOrderId(id)}
                    />
                    <p className="text-xs text-gray-600">
                      {selectedFiles.length === 0
                        ? "Attachments are optional."
                        : draftWorkOrderId
                          ? "Draft exists — Upload Files will attach to it."
                          : "Click Upload Files — we’ll create a draft work order automatically and attach files."}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button disabled={createDisabled} onClick={handleCreate}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    "Create Work Order"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* RIGHT: Preview */}
          {previewUrl && (
            <div className="hidden md:flex w-1/2 bg-slate-50 border-l border-slate-100 items-center justify-center p-8 overflow-hidden relative">
              <div className="w-full h-full bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden relative">
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
                <div className="absolute top-6 right-6 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl(null);
                      setPreviewType('image'); // reset
                      // optionally clear selectedFiles if desired, but user might want to keep attachment but close preview
                    }}
                    className="bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg text-slate-400 hover:text-rose-500 transition-all border border-slate-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

