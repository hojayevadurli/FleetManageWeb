import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import VehicleSelector from "@/components/workorder/VehicleSelector";
import { uploadsApi } from "@/lib/uploadsApi";
import { documentsApi, type DocumentDto } from "@/lib/documentsApi";

export default function InvoicesAiTab() {
  const [vehicleId, setVehicleId] = useState("");
  const [vehicleType, setVehicleType] = useState<"truck" | "trailer">("truck");

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<DocumentDto[]>([]);

  const canRun = useMemo(
    () => Boolean(vehicleId && file && !loading),
    [vehicleId, file, loading]
  );

  const loadInvoices = async () => {
    if (!vehicleId) {
      setDocs([]);
      return;
    }

    const data = await documentsApi.list({
      assetType: vehicleType,
      assetId: vehicleId,
      page: 1,
      pageSize: 200,
    });

    setDocs(
      (data || []).filter(
        (document) => (document.docKind || "").toLowerCase() === "invoice"
      )
    );
  };

  useEffect(() => {
    loadInvoices().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, vehicleType]);

  const onImport = async () => {
    if (!file || !vehicleId) return;

    setLoading(true);

    try {
      const [url] = await uploadsApi.uploadWorkOrderFiles([file]);

      if (!url) {
        throw new Error("Upload failed. No URL returned.");
      }

      await documentsApi.create({
        fileUrl: url,
        fileType: file.type || "application/octet-stream",
        docKind: "invoice",
        vendorNameRaw: null,
        assetType: vehicleType,
        assetId: vehicleId,

        // Backend runs Gemini AI via GeminiAiService.
        // Frontend does NOT call Gemini directly — all AI is server-side.
        runAiExtract: true,
      });

      toast.success("Invoice uploaded. Backend AI parsing started.");

      setFile(null);
      await loadInvoices();
    } catch (error: unknown) {
      console.error("Invoice import error:", error);

      const err = error as {
        response?: {
          data?: {
            message?: string;
            title?: string;
            error?: string;
          };
        };
        message?: string;
      };

      toast.error(
        err.response?.data?.message ||
        err.response?.data?.title ||
        err.response?.data?.error ||
        err.message ||
        "Failed to import invoice."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <div className="text-lg font-semibold">Invoices AI Import</div>

        <div className="text-sm text-muted-foreground">
          Upload an invoice and FleetManage will send it to the backend for AI
          extraction.
        </div>

        <div className="mt-4">
          <VehicleSelector
            selectedVehicleId={vehicleId}
            selectedVehicleType={vehicleType}
            onVehicleSelect={(id: string, type: string) => {
              setVehicleId(id);
              setVehicleType(type as "truck" | "trailer");
            }}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />

          <Button disabled={!canRun} onClick={onImport}>
            {loading ? "Importing..." : "Upload + Parse"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="font-medium mb-2">Invoices for selected vehicle</div>

        {!vehicleId ? (
          <div className="text-sm text-muted-foreground">
            Select a truck or trailer first.
          </div>
        ) : docs.length === 0 ? (
          <div className="text-sm text-muted-foreground">No invoices yet.</div>
        ) : (
          <div className="space-y-2">
            {docs.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between rounded border p-2"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {document.vendorNameRaw || "Unknown vendor"}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {new Date(document.createdAt).toLocaleString()} •{" "}
                    {document.status}
                  </div>
                </div>

                <a
                  className="text-sm underline"
                  href={document.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}