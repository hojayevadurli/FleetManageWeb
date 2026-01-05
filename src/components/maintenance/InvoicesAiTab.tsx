import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import VehicleSelector from "@/components/workorder/VehicleSelector"; // adjust path if different
import { uploadsApi } from "@/lib/uploadsApi";
import { documentsApi, DocumentDto } from "@/lib/documentsApi";
import { parseReceipt } from "@/lib/gemini";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const dataUrl = String(r.result || "");
      const base64 = dataUrl.split(",")[1] || "";
      resolve(base64);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function InvoicesAiTab() {
  const [vehicleId, setVehicleId] = useState("");
  const [vehicleType, setVehicleType] = useState<string>("truck");

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<DocumentDto[]>([]);

  const canRun = useMemo(() => !!vehicleId && !!file && !loading, [vehicleId, file, loading]);

  const loadInvoices = async () => {
    if (!vehicleId) return;
    const data = await documentsApi.list({ assetType: vehicleType, assetId: vehicleId, page: 1, pageSize: 200 });
    setDocs((data || []).filter((d) => (d.docKind || "").toLowerCase() === "invoice"));
  };

  useEffect(() => {
    loadInvoices().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, vehicleType]);

  const onImport = async () => {
    if (!file || !vehicleId) return;

    setLoading(true);
    try {
      // 1) upload file
      const [url] = await uploadsApi.uploadWorkOrderFiles([file]);
      if (!url) throw new Error("Upload failed (no URL returned).");

      // 2) create document record
      const doc = await documentsApi.create({
        fileUrl: url,
        fileType: file.type || "application/octet-stream",
        docKind: "invoice",
        vendorNameRaw: null,
        assetType: vehicleType,
        assetId: vehicleId,
        runAiExtract: false,
      });

      // 3) AI parse client-side
      const base64 = await fileToBase64(file);
      const parsed = await parseReceipt(base64, file.type);

      if (!parsed) {
        toast.error("AI could not parse this invoice. It was uploaded but needs manual review.");
        await loadInvoices();
        return;
      }

      // 4) save extracted json to backend doc
      await documentsApi.updateExtracted(doc.id, {
        extractedJson: parsed,
        vendorNameRaw: parsed.businessName || null,
        confidenceScore: null,
        status: "needs_review",
      });

      toast.success("Invoice uploaded + parsed.");
      setFile(null);
      await loadInvoices();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to import invoice.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4">
        <div className="text-lg font-semibold">Invoices (AI Import)</div>
        <div className="text-sm text-muted-foreground">
          Upload an invoice → AI extracts vendor/total/line items → saved into Documents.
        </div>

        <div className="mt-4">
          <VehicleSelector
            selectedVehicleId={vehicleId}
            selectedVehicleType={vehicleType}
            onVehicleSelect={(id: string, type: string) => {
              setVehicleId(id);
              setVehicleType(type);
            }}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Button disabled={!canRun} onClick={onImport}>
            {loading ? "Importing..." : "Upload + Parse"}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="font-medium mb-2">Invoices for selected vehicle</div>
        {!vehicleId ? (
          <div className="text-sm text-muted-foreground">Select a truck/trailer first.</div>
        ) : docs.length === 0 ? (
          <div className="text-sm text-muted-foreground">No invoices yet.</div>
        ) : (
          <div className="space-y-2">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded border p-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{d.vendorNameRaw || "Unknown vendor"}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(d.createdAt).toLocaleString()} • {d.status}
                  </div>
                </div>
                <a className="text-sm underline" href={d.fileUrl} target="_blank" rel="noreferrer">
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
