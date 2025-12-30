import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import VehicleSelector from "./VehicleSelector";
import WorkOrderItems from "./WorkOrderItems";
import FileUpload from "./FileUpload";

import { workOrdersApi, WorkOrderUpsertDto } from "@/lib/workOrdersApi";

type Priority = "low" | "medium" | "high" | "urgent";
type VehicleType = "truck" | "trailer";

type NewWorkOrderState = {
  vehicle_id: string;
  vehicle_type: VehicleType;
  priority: Priority;
  eta_date: string;
  eta_hours: string;
  company_name: string;
  description: string;
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
  const [workOrderItems, setWorkOrderItems] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [draftWorkOrderId, setDraftWorkOrderId] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [showOptionalFields, setShowOptionalFields] = useState({
    eta: false,
    attachments: false
  });

  const [newWorkOrder, setNewWorkOrder] = useState<NewWorkOrderState>({
    vehicle_id: "",
    vehicle_type: "truck",
    priority: "medium",
    eta_date: "",
    eta_hours: "",
    company_name: initialCompanyName,
    description: ""
  });

  const computedLines = useMemo(() => {
    const items = (workOrderItems ?? []).map((x) => x.trim()).filter(Boolean);
    return items.map((desc) => ({
      type: "misc" as const,
      description: desc,
      qty: 1,
      unitPrice: 0,
      amount: 0,
      partNumber: null
    }));
  }, [workOrderItems]);

  const resetForm = () => {
    setNewWorkOrder({
      vehicle_id: "",
      vehicle_type: "truck",
      priority: "medium",
      eta_date: "",
      eta_hours: "",
      company_name: initialCompanyName,
      description: ""
    });
    setWorkOrderItems([]);
    setSelectedFiles([]);
    setDraftWorkOrderId(null);
    setIsSubmitting(false);
    setIsUploading(false);
    setShowOptionalFields({ eta: false, attachments: false });
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

    const assetType = (newWorkOrder.vehicle_type === "trailer" ? "trailer" : "truck") as "truck" | "trailer";

    // Backend requires lines -> create minimal draft then overwrite on update()
    const created = await workOrdersApi.create({
  assetType,
  assetId: newWorkOrder.vehicle_id,
  vendorId: null,
  woNumber: null,
  odometer: null,
  serviceDate: new Date().toISOString(),
  summary: "Draft",
  totalAmount: 0,
  taxAmount: 0,
  status: "draft",
  lines: [
    {
      type: "misc",
      description: "Draft",
      qty: 1,
      unitPrice: 0,
      amount: 0,
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

      const assetType = (newWorkOrder.vehicle_type === "trailer" ? "trailer" : "truck") as "truck" | "trailer";

      const dto: WorkOrderUpsertDto = {
        assetType,
        assetId: newWorkOrder.vehicle_id,
        vendorId: null,
        woNumber: null,
        odometer: null,
        serviceDate: new Date().toISOString(),
        summary: mergedDescription?.trim() ? mergedDescription.trim() : null,
        totalAmount: 0,
        taxAmount: 0,
        status: "open",
        lines: computedLines,

        // attachments endpoint already links docs
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

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetForm();
    onOpenChange(isOpen);
  };

  const createDisabled = isSubmitting || !newWorkOrder.vehicle_id || computedLines.length === 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Work Order</DialogTitle>
          <DialogDescription>Create a new maintenance work order for your fleet</DialogDescription>
        </DialogHeader>

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
            onVehicleSelect={(vehicleId: string, vehicleType: string) => {
              // ✅ Fix: changing vehicle should invalidate draft + attachments
              setNewWorkOrder((p) => ({
                ...p,
                vehicle_id: vehicleId,
                vehicle_type: vehicleType === "trailer" ? "trailer" : "truck"
              }));

              setDraftWorkOrderId(null);
              setSelectedFiles([]);
              setIsUploading(false);
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
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <WorkOrderItems items={workOrderItems} onItemsChange={setWorkOrderItems} />

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
                {/* ✅ Create-mode usage: ONLY ensureWorkOrderId (no workOrderId prop) */}
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
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting || isUploading}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createDisabled || isUploading}>
              {isSubmitting ? "Creating..." : isUploading ? "Uploading..." : "Create Work Order"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
