import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import VehicleSelector from "./VehicleSelector";
import { useRef } from "react";
import { Loader2, Sparkles, Upload, Trash2, X, Check, ChevronsUpDown } from "lucide-react";
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

import WorkOrderItems, { WorkOrderItemData } from "./WorkOrderItems";
import FileUpload from "./FileUpload";


import { WorkOrderDto, WorkOrderStatus, WorkOrderPriority, WorkOrderCostSource } from "@/lib/types";
import { WorkOrderUpsertDto, workOrdersApi } from "@/lib/workOrdersApi";

const shortWoNumber = (wo: WorkOrderDto) => (wo.workOrderNumber ?? wo.id.slice(0, 8).toUpperCase());

function isVideoUrl(url: string) {
  const clean = url.split("?")[0].toLowerCase();
  return [".mp4", ".mov", ".avi", ".webm"].some((x) => clean.endsWith(x));
}

function isPdfUrl(url: string) {
  const clean = url.split("?")[0].toLowerCase();
  return clean.endsWith(".pdf");
}

interface EditWorkOrderDialogProps {
  workOrder: WorkOrderDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWorkOrderUpdated: () => void; // refresh list in parent
}

import WriteReviewDialog from "@/components/shops/WriteReviewDialog";

const EditWorkOrderDialog = ({ workOrder, open, onOpenChange, onWorkOrderUpdated }: EditWorkOrderDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Keep a local copy so we can refresh documents after upload
  const [currentWo, setCurrentWo] = useState<WorkOrderDto | null>(null);

  const [workOrderItems, setWorkOrderItems] = useState<WorkOrderItemData[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isParsingReceipt, setIsParsingReceipt] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'image' | 'pdf'>('image');

  const [editData, setEditData] = useState<{
    vehicle_id: string;
    vehicle_type: string;
    status: string;
    odometer: string;
    service_date: string;
    title: string;
    complaint: string;
    vendor_id?: string | null;
    vendor_name?: string;
  }>({
    vehicle_id: "",
    vehicle_type: "truck",
    status: "Open",
    odometer: "",
    service_date: "", // yyyy-mm-dd
    title: "",
    complaint: "",
    vendor_id: null,
    vendor_name: ""
  });

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorOpen, setVendorOpen] = useState(false);

  // Init when opened
  useEffect(() => {
    if (!workOrder || !open) return;

    setCurrentWo(workOrder);

    const itemsFromLines = (workOrder.lines ?? [])
      .map((l) => ({
        description: (l.description ?? "").trim(),
        price: l.unitPrice || 0,
        quantity: l.qty || 1
      }))
      .filter(i => i.description);

    setWorkOrderItems(itemsFromLines);
    setSelectedFiles([]);

    setEditData({
      vehicle_id: workOrder.equipmentId,
      vehicle_type: "truck", // Default or determine from vehicle selector
      status: workOrder.status,
      odometer: workOrder.odometerAtService?.toString() ?? "",
      service_date: workOrder.openedAt ? new Date(workOrder.openedAt).toISOString().slice(0, 10) : "",
      title: workOrder.title || "",
      complaint: workOrder.complaint || "",
      vendor_id: workOrder.vendorId || null,
      vendor_name: "" // Will be populated by lookup if id exists
    });

    loadVendors(workOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workOrder, open]);

  const computedLines = useMemo(() => {
    const items = (workOrderItems ?? []).filter(x => x.description.trim());
    if (!items.length) return [];
    return items.map((item) => ({
      type: "misc" as const,
      description: item.description,
      qty: item.quantity,
      unitPrice: item.price,
      amount: item.price * item.quantity,
      partNumber: null
    }));
  }, [workOrderItems]);

  // Documents come from backend now:
  const documents = currentWo?.documents ?? [];

  const refreshThisWorkOrder = async () => {
    if (!currentWo) return;
    const fresh = await workOrdersApi.get(currentWo.id);
    setCurrentWo(fresh);
  };

  const handleUpdate = async () => {
    if (!currentWo) return;

    if (!editData.vehicle_id) {
      toast.error("Select a vehicle first");
      return;
    }

    setLoading(true);
    try {
      const serviceDateIso = editData.service_date
        ? new Date(editData.service_date + "T00:00:00.000Z").toISOString()
        : currentWo.openedAt;

      /**
       * IMPORTANT:
       * Do NOT send documentIds here.
       * Your backend UpdateWorkOrder() replaces links when DocumentIds is present.
       * We want attachments handled ONLY by /attachments endpoint.
       */
      const body: WorkOrderUpsertDto = {
        equipmentId: editData.vehicle_id,
        openedAt: serviceDateIso,
        title: editData.title,
        complaint: editData.complaint.trim(),
        diagnosis: currentWo.diagnosis ?? null,
        resolution: currentWo.resolution ?? null,
        notes: currentWo.notes ?? null,
        status: (WorkOrderStatus as any)[editData.status] ?? (typeof editData.status === 'number' ? editData.status : WorkOrderStatus.Open),
        priority: (WorkOrderPriority as any)[currentWo.priority] ?? (typeof currentWo.priority === 'number' ? currentWo.priority : WorkOrderPriority.Normal),
        costSource: (WorkOrderCostSource as any)[currentWo.costSource] ?? (typeof currentWo.costSource === 'number' ? currentWo.costSource : WorkOrderCostSource.Estimated),
        estimatedTotal: currentWo.estimatedTotal,
        manualActualTotal: currentWo.manualActualTotal,
        lines: computedLines,
        replaceDocuments: false,
        documentIds: [],
        vendorId: editData.vendor_id || undefined,
        odometerAtService: editData.odometer ? Number(editData.odometer) : undefined
      };

      await workOrdersApi.update(currentWo.id, body);

      toast.success("Work order updated");
      await refreshThisWorkOrder();
      onWorkOrderUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating work order:", error);
      toast.error("Failed to update work order");
    } finally {
      setLoading(false);
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
          toast.success(`AI Scan: Populated ${newItems.length} items from receipt.`);
        }

        // Optional: Auto-fill date if missing
        if (result.date && !editData.service_date) {
          setEditData(prev => ({ ...prev, service_date: result.date || prev.service_date }));
        }

        // Auto-fill Vendor Name
        if (result.businessName) {
          const match = vendors.find(v => v.name.toLowerCase().includes(result.businessName.toLowerCase()) || result.businessName.toLowerCase().includes(v.name.toLowerCase()));
          if (match) {
            setEditData(prev => ({ ...prev, vendor_id: match.id, vendor_name: match.name }));
            toast.success(`AI Match: Vendor found "${match.name}"`);
          } else {
            // If no match, we could stick the raw name somewhere or just warn. 
            // For now, let's just toast
            toast.info(`AI: Extracted vendor "${result.businessName}" (No direct match)`);
            setEditData(prev => ({ ...prev, vendor_name: result.businessName || "", vendor_id: null })); // Keep raw name
          }
        }
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

      setPreviewUrl(dataUrl);
      setPreviewType(file.type.includes('pdf') ? 'pdf' : 'image');

      if (file.type.includes('image') || file.type.includes('pdf')) {
        await processAIParsing(file, base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const loadVendors = async (currentWorkOrder?: WorkOrderDto) => {
    try {
      const data = await shopsApi.list();
      // map to Vendor type roughly
      const mapped = data.map((s: any) => ({
        id: s.id,
        name: s.shop_name || s.name || s.shopName || "Unknown Shop",
      })) as Vendor[];
      setVendors(mapped);

      // If we have an initial vendor_id, set the name
      // Use passed workOrder if available, otherwise fallback (though state might be stale, passing arg is safer)
      const targetVendorId = currentWorkOrder?.vendorId || currentWo?.vendorId;

      if (targetVendorId) {
        const found = mapped.find(v => v.id === targetVendorId);
        if (found) {
          setEditData(prev => ({ ...prev, vendor_name: found.name, vendor_id: found.id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAttachment = async (docId: string) => {
    if (!currentWo) return;
    try {
      await workOrdersApi.deleteAttachment(currentWo.id, docId);
      toast.success("Attachment removed");
      await refreshThisWorkOrder();
      onWorkOrderUpdated();
    } catch (error) {
      console.error("Failed to delete attachment:", error);
      toast.error("Failed to remove attachment");
    }
  };


  if (!currentWo) return null;

  const updateDisabled = loading || !editData.vehicle_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-full h-[95vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem]">
        <DialogHeader className="px-10 py-8 border-b border-slate-100 bg-white sticky top-0 z-10 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Edit Work Order - {shortWoNumber(currentWo)}</DialogTitle>
            <DialogDescription className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Update work order details, status, and attachments</DialogDescription>
          </div>
          {(currentWo.status === 'Closed' || currentWo.status === 'Paid') && currentWo.vendorId && (
            <Button
              onClick={() => setIsReviewOpen(true)}
              className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Rate This Service
            </Button>
          )}
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* LEFT: Form */}
          <div className={`flex-1 overflow-y-auto p-10 space-y-6 ${previewUrl ? 'md:w-1/2 border-r border-slate-100' : 'max-w-4xl mx-auto w-full'}`}>
            <div className="space-y-6">
              {/* Basic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Work Order Number</Label>
                  <Input value={shortWoNumber(currentWo)} disabled className="bg-gray-50" />
                </div>

                <div>
                  <Label htmlFor="service_date">Service Date</Label>
                  <Input
                    id="service_date"
                    type="date"
                    value={editData.service_date}
                    onChange={(e) => setEditData({ ...editData, service_date: e.target.value })}
                  />
                </div>
              </div>

              {/* Vendor */}
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
                      {editData.vendor_id
                        ? vendors.find((v) => v.id === editData.vendor_id)?.name || "Select Vendor"
                        : (editData.vendor_name ? editData.vendor_name : "In-House / Select Vendor")}
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
                              setEditData({ ...editData, vendor_id: null, vendor_name: "" });
                              setVendorOpen(false);
                            }}
                          >
                            In_House / No Vendor
                            {editData.vendor_id === null && <Check className="ml-auto h-4 w-4" />}
                          </CommandItem>
                          {vendors.map((vendor) => (
                            <CommandItem
                              key={vendor.id}
                              value={vendor.name}
                              onSelect={() => {
                                setEditData({ ...editData, vendor_id: vendor.id, vendor_name: vendor.name });
                                setVendorOpen(false);
                              }}
                            >
                              {vendor.name}
                              {editData.vendor_id === vendor.id && (
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

              {/* Vehicle */}
              <VehicleSelector
                selectedVehicleId={editData.vehicle_id}
                selectedVehicleType={editData.vehicle_type}
                onVehicleSelect={(vehicleId: string, vehicleType: string) =>
                  setEditData({
                    ...editData,
                    vehicle_id: vehicleId,
                    vehicle_type: vehicleType
                  })
                }
              />

              {/* Status + Odometer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editData.status}
                    onValueChange={(value) => setEditData({ ...editData, status: value as WorkOrderDto["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="odometer">Odometer</Label>
                  <Input
                    id="odometer"
                    type="number"
                    value={editData.odometer}
                    onChange={(e) => setEditData({ ...editData, odometer: e.target.value })}
                    placeholder="e.g. 450123"
                  />
                </div>
              </div>

              {/* Items */}
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

              {/* Title and Complaint */}
              <div>
                <Label htmlFor="title">Title / Summary</Label>
                <Input
                  id="title"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  placeholder="Brief summary of the work"
                />
              </div>

              <div>
                <Label htmlFor="complaint">Complaint / Details</Label>
                <Textarea
                  id="complaint"
                  value={editData.complaint}
                  onChange={(e) => setEditData({ ...editData, complaint: e.target.value })}
                  placeholder="Detailed description of the issue"
                  className="min-h-20"
                />
              </div>

              {/* Existing Attachments */}
              <div>
                <Label>Current Attachments</Label>

                {documents.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-2">No attachments yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {documents.map((d) => {
                      const url = d.fileUrl;

                      return (
                        <div key={d.id} className="relative group inline-block">
                          {/* Main Link/Preview */}
                          {d.fileType?.includes('pdf') || isPdfUrl(url) ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm underline px-2 py-1 border rounded block bg-white"
                            >
                              📄 View PDF
                            </a>
                          ) : d.fileType?.includes('video') || isVideoUrl(url) ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm underline px-2 py-1 border rounded block bg-white"
                            >
                              🎥 View Video
                            </a>
                          ) : (
                            <a href={url} target="_blank" rel="noreferrer" className="block">
                              <img src={url} alt="attachment" className="h-20 w-20 object-cover rounded border" />
                            </a>
                          )}

                          {/* Delete X Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              if (confirm("Remove this attachment?")) {
                                handleDeleteAttachment(d.id);
                              }
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove attachment"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Upload New Attachments */}
              <div>
                <Label>Add Attachments (Optional)</Label>
                <FileUpload
                  files={selectedFiles}
                  onFilesChange={setSelectedFiles}
                  workOrderId={currentWo.id}
                  onUploaded={async () => {
                    await refreshThisWorkOrder();
                    onWorkOrderUpdated();
                  }}
                />

                <p className="text-xs text-gray-500 mt-2">
                  Select files, then click <b>Upload Files</b>. Attachments upload immediately on edit.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} disabled={updateDisabled}>
                  {loading ? "Updating..." : "Update Work Order"}
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
                      setPreviewType('image');
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

      {currentWo.vendorId && (
        <WriteReviewDialog
          open={isReviewOpen}
          onOpenChange={setIsReviewOpen}
          shopId={currentWo.vendorId}
          shopName={editData.vendor_name || "Unknown Shop"}
          onReviewSubmitted={() => {
            toast.success("Review submitted successfully");
            setIsReviewOpen(false);
          }}
          context={{
            workOrderId: currentWo.id,
            workOrderNumber: shortWoNumber(currentWo),
            serviceDate: new Date(currentWo.openedAt).toLocaleDateString(),
            totalCost: currentWo.manualActualTotal || currentWo.estimatedTotal || 0,
            assetName: editData.vehicle_id // We might need to fetch name, but ID is okay for now or use editData derived logic if complex
          }}
        />
      )}
    </Dialog>
  );
};

export default EditWorkOrderDialog;
