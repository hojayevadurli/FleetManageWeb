import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

import VehicleSelector from "./VehicleSelector";
import WorkOrderItems from "./WorkOrderItems";
import FileUpload from "./FileUpload";

import { WorkOrderDto, WorkOrderUpsertDto, workOrdersApi } from "@/lib/workOrdersApi";

const shortWoNumber = (wo: WorkOrderDto) => (wo.woNumber ?? wo.id.slice(0, 8).toUpperCase());

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

const EditWorkOrderDialog = ({ workOrder, open, onOpenChange, onWorkOrderUpdated }: EditWorkOrderDialogProps) => {
  const [loading, setLoading] = useState(false);

  // Keep a local copy so we can refresh documents after upload
  const [currentWo, setCurrentWo] = useState<WorkOrderDto | null>(null);

  const [workOrderItems, setWorkOrderItems] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [editData, setEditData] = useState({
    vehicle_id: "",
    vehicle_type: "truck" as "truck" | "trailer",
    status: "open" as WorkOrderDto["status"],
    odometer: "",
    service_date: "", // yyyy-mm-dd
    description: "" // maps to summary
  });

  // Init when opened
  useEffect(() => {
    if (!workOrder || !open) return;

    setCurrentWo(workOrder);

    const itemsFromLines = (workOrder.lines ?? [])
      .map((l) => (l.description ?? "").trim())
      .filter(Boolean);

    setWorkOrderItems(itemsFromLines.length ? itemsFromLines : []);
    setSelectedFiles([]);

    setEditData({
      vehicle_id: workOrder.assetId,
      vehicle_type: workOrder.assetType,
      status: workOrder.status,
      odometer: workOrder.odometer?.toString() ?? "",
      service_date: workOrder.serviceDate ? new Date(workOrder.serviceDate).toISOString().slice(0, 10) : "",
      description: workOrder.summary ?? ""
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workOrder, open]);

  const computedLines = useMemo(() => {
    const items = (workOrderItems ?? []).map((x) => x.trim()).filter(Boolean);
    if (!items.length) return [];
    return items.map((desc) => ({
      type: "misc" as const,
      description: desc,
      qty: 1,
      unitPrice: 0,
      amount: 0,
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
        : currentWo.serviceDate;

      /**
       * IMPORTANT:
       * Do NOT send documentIds here.
       * Your backend UpdateWorkOrder() replaces links when DocumentIds is present.
       * We want attachments handled ONLY by /attachments endpoint.
       */
      const body: WorkOrderUpsertDto = {
        assetType: editData.vehicle_type,
        assetId: editData.vehicle_id,
        vendorId: currentWo.vendorId ?? null,
        woNumber: currentWo.woNumber ?? null,
        odometer: editData.odometer ? Number(editData.odometer) : null,
        serviceDate: serviceDateIso,
        summary: editData.description?.trim() ? editData.description.trim() : null,

        totalAmount: 0,
        taxAmount: currentWo.taxAmount ?? 0,

        status: editData.status,
        lines: computedLines,

        // // NOTE: if your TS type forces this field, you must FIX WorkOrderUpsertDto to make it optional.
        // // @ts-expect-error documentIds intentionally omitted (attachments handled separately)
        documentIds: undefined
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

  if (!currentWo) return null;

  const updateDisabled = loading || !editData.vehicle_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Work Order - {shortWoNumber(currentWo)}</DialogTitle>
          <DialogDescription>Update work order details, status, and attachments</DialogDescription>
        </DialogHeader>

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

          {/* Vehicle */}
          <VehicleSelector
            selectedVehicleId={editData.vehicle_id}
            selectedVehicleType={editData.vehicle_type}
            onVehicleSelect={(vehicleId: string, vehicleType: string) =>
              setEditData({
                ...editData,
                vehicle_id: vehicleId,
                vehicle_type: vehicleType === "trailer" ? "trailer" : "truck"
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
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

          {/* Summary */}
          <div>
            <Label htmlFor="description">Summary / Notes</Label>
            <Textarea
              id="description"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Notes, symptoms, vendor notes, etc."
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

                  if (isPdfUrl(url)) {
                    return (
                      <a
                        key={d.id}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm underline px-2 py-1 border rounded"
                      >
                        📄 View PDF
                      </a>
                    );
                  }

                  if (isVideoUrl(url)) {
                    return (
                      <a
                        key={d.id}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm underline px-2 py-1 border rounded"
                      >
                        🎥 View Video
                      </a>
                    );
                  }

                  return (
                    <a key={d.id} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt="attachment" className="h-20 w-20 object-cover rounded border" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upload New Attachments */}
          <div>
            <Label>Add Attachments (Optional)</Label>

            {/* ✅ THIS is the new flow:
                - user selects files
                - clicks Upload Files (button appears because workOrderId is passed)
                - backend creates docs + links
                - we refresh work order to show them
            */}
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
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateDisabled}>
              {loading ? "Updating..." : "Update Work Order"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditWorkOrderDialog;
