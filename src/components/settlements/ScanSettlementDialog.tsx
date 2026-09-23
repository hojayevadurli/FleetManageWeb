import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { parseSettlementDocument } from "@/lib/gemini";
import { settlementsApi, SettlementDetail, SettlementScanResult } from "@/lib/settlementsApi";
import { Upload, Loader2, ScanLine, AlertTriangle, Route, Receipt, FileText, MinusCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settlement: SettlementDetail;
  onImported: (updated: SettlementDetail) => void;
}

const money = (n?: number) => `$${(n ?? 0).toFixed(2)}`;

const ScanSettlementDialog = ({ open, onOpenChange, settlement, onImported }: Props) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<SettlementScanResult | null>(null);
  const [checkDate, setCheckDate] = useState("");
  const [externalId, setExternalId] = useState("");
  const [settlementNumber, setSettlementNumber] = useState("");

  const reset = () => {
    setResult(null);
    setParsing(false);
    setCheckDate("");
    setExternalId("");
    setSettlementNumber("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    setParsing(true);
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64 = dataUrl.split(",")[1];
      const parsed = await parseSettlementDocument(base64, file.type);
      if (!parsed) {
        toast({ title: "Could not read this document", description: "Try a clearer scan or a different file.", variant: "destructive" });
        return;
      }
      setResult(parsed);
      setCheckDate(parsed.checkDate ?? "");
      setExternalId(parsed.externalId ?? "");
      setSettlementNumber(parsed.settlementNumber ?? "");
      toast({ title: "Document scanned", description: `Found ${parsed.loads.length} loads, ${parsed.tollTransactions.length} tolls, ${parsed.billInformation.length} bill items, ${parsed.deductionItems.length} deductions.` });
    } catch (err: any) {
      toast({ title: "Scan failed", description: err?.message, variant: "destructive" });
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!result) return;
    setImporting(true);
    try {
      const updated = await settlementsApi.importScan(settlement.id, {
        checkDate: checkDate || undefined,
        externalId: externalId || undefined,
        settlementNumber: settlementNumber || undefined,
        importedTotalGrossBill: result.totalGrossBill,
        importedDeductionsTotal: result.deductions,
        importedTotalNetBill: result.totalNetBill,
        loads: result.loads,
        tollTransactions: result.tollTransactions,
        billInfoItems: result.billInformation,
        deductionItems: result.deductionItems,
      });
      onImported(updated);
      toast({ title: "Settlement updated from scan" });
      onOpenChange(false);
      reset();
    } catch (err: any) {
      toast({ title: "Import failed", description: err?.response?.data?.error ?? err?.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const mismatch = (label: string, scanned?: string, current?: string) => {
    if (!scanned || !current) return null;
    if (scanned.trim().toLowerCase() === current.trim().toLowerCase()) return null;
    return (
      <div key={label} className="flex items-start gap-2 text-[11px] text-amber-700">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span><b>{label}</b> on the scan (“{scanned}”) doesn't match this settlement's current {label.toLowerCase()} (“{current}”). Vendor, Unit and Driver are never changed by a scan — fix them via Edit if needed.</span>
      </div>
    );
  };

  const SummaryRow = ({ icon, label, count, total }: { icon: React.ReactNode; label: string; count: number; total: number }) => (
    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 border border-slate-100">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-slate-900">{count} {label}</p>
      </div>
      <p className="text-sm font-black text-slate-900">{money(total)}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-black">
            <ScanLine className="w-5 h-5 text-blue-600" />
            Scan Settlement PDF
          </DialogTitle>
          <p className="text-xs text-slate-400 font-medium">
            Upload the original settlement document and AI will pull the loads, tolls, bill information and deductions into this settlement.
          </p>
        </DialogHeader>

        {!result ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`mt-2 border-4 border-dashed rounded-[2rem] p-12 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${parsing ? "border-blue-400 bg-blue-50/50" : "border-slate-200 bg-slate-50/30 hover:bg-blue-50/30 hover:border-blue-300"}`}
          >
            {parsing ? (
              <>
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
                <p className="text-sm font-bold text-slate-600">Reading document...</p>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-slate-400 mb-3" />
                <p className="text-sm font-bold text-slate-700">Click to select a PDF or image</p>
                <p className="text-xs text-slate-400 mt-1">The settlement statement as received from the vendor</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,application/pdf"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
        ) : (
          <div className="space-y-5 mt-1">
            <div className="space-y-1.5">
              {mismatch("Vendor Name", result.vendorName, settlement.vendorName)}
              {mismatch("Unit Number", result.unitNumber, settlement.unitNumber)}
              {mismatch("Driver Name", result.driverName, settlement.driverName)}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">ID</Label>
                <Input className="h-10 bg-white border-slate-200" value={externalId} onChange={e => setExternalId(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Settlement Number</Label>
                <Input className="h-10 bg-white border-slate-200" value={settlementNumber} onChange={e => setSettlementNumber(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Check Date</Label>
                <Input type="date" className="h-10 bg-white border-slate-200" value={checkDate} onChange={e => setCheckDate(e.target.value)} />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 -mt-3">ID, Settlement Number and Check Date only fill in if this settlement doesn't already have one set.</p>

            <div className="grid grid-cols-3 gap-3 text-center bg-slate-900 rounded-2xl p-4 text-white">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Gross Bill</p>
                <p className="text-lg font-black mt-0.5">{money(result.totalGrossBill)}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Deductions</p>
                <p className="text-lg font-black mt-0.5">{money(result.deductions)}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Net Bill</p>
                <p className="text-lg font-black mt-0.5">{money(result.totalNetBill)}</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 -mt-3">These are stored as the "originally imported" snapshot and won't change as you edit line items afterward.</p>

            <div className="space-y-2">
              <SummaryRow icon={<Route className="w-4 h-4 text-slate-500" />} label="Loads" count={result.loads.length} total={result.loads.reduce((a, l) => a + l.grossAmount, 0)} />
              <SummaryRow icon={<Receipt className="w-4 h-4 text-slate-500" />} label="Toll Transactions" count={result.tollTransactions.length} total={result.tollTransactions.reduce((a, t) => a + t.totalAmount, 0)} />
              <SummaryRow icon={<FileText className="w-4 h-4 text-slate-500" />} label="Bill Information items" count={result.billInformation.length} total={result.billInformation.reduce((a, b) => a + b.totalAmount, 0)} />
              <SummaryRow icon={<MinusCircle className="w-4 h-4 text-slate-500" />} label="Deductions" count={result.deductionItems.length} total={result.deductionItems.reduce((a, d) => a + d.totalAmount, 0)} />
            </div>
            <p className="text-[11px] text-slate-400">These rows will be added to this settlement's existing sections. You can edit or delete any of them afterward.</p>
          </div>
        )}

        <DialogFooter className="mt-5 gap-2">
          <Button variant="outline" onClick={() => { onOpenChange(false); reset(); }}>Cancel</Button>
          {result && (
            <Button variant="outline" onClick={reset} disabled={importing}>Scan a different file</Button>
          )}
          {result && (
            <Button onClick={handleImport} disabled={importing} className="bg-blue-600 text-white hover:bg-blue-700 font-bold">
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import into Settlement"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ScanSettlementDialog;
