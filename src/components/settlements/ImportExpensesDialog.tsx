import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  settlementsApi, SettlementDetail, SettlementImportable,
} from "@/lib/settlementsApi";
import { Loader2, Download, Receipt, Fuel, Wrench } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settlement: SettlementDetail;
  onImported: (updated: SettlementDetail) => void;
}

const money = (n: number) => `$${n.toFixed(2)}`;
const fmtDate = (d: string) => format(parseISO(d), "M/d/yyyy");

const ImportExpensesDialog = ({ open, onOpenChange, settlement, onImported }: Props) => {
  const { toast } = useToast();
  const [data, setData] = useState<SettlementImportable | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedTolls, setSelectedTolls] = useState<Set<string>>(new Set());
  const [selectedFuel, setSelectedFuel] = useState<Set<string>>(new Set());
  const [selectedMaintenance, setSelectedMaintenance] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelectedTolls(new Set());
    setSelectedFuel(new Set());
    setSelectedMaintenance(new Set());
    settlementsApi.getImportable(settlement.id)
      .then(setData)
      .catch(() => toast({ title: "Failed to load fleet records", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [open, settlement.id]);

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    setter(next);
  };

  const toggleAll = (ids: string[], set: Set<string>, setter: (s: Set<string>) => void) => {
    setter(set.size === ids.length ? new Set() : new Set(ids));
  };

  const totalSelected = selectedTolls.size + selectedFuel.size + selectedMaintenance.size;

  const handleImport = async () => {
    if (totalSelected === 0) return;
    setImporting(true);
    try {
      const updated = await settlementsApi.import(settlement.id, {
        tollRecordIds: Array.from(selectedTolls),
        fuelRecordIds: Array.from(selectedFuel),
        workOrderIds: Array.from(selectedMaintenance),
      });
      onImported(updated);
      toast({ title: `Imported ${totalSelected} record${totalSelected !== 1 ? "s" : ""}` });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Import failed", description: err?.response?.data?.error ?? err?.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const GroupHeader = ({ icon, label, ids, set, setter }: { icon: React.ReactNode; label: string; ids: string[]; set: Set<string>; setter: (s: Set<string>) => void }) => (
    <div className="flex items-center justify-between px-1 py-2">
      <span className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider">
        {icon} {label} <span className="text-slate-400 font-bold normal-case">({ids.length})</span>
      </span>
      {ids.length > 0 && (
        <button onClick={() => toggleAll(ids, set, setter)} className="text-[11px] font-bold text-blue-600 hover:text-blue-700">
          {set.size === ids.length ? "Deselect all" : "Select all"}
        </button>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-black">
            <Download className="w-5 h-5 text-blue-600" />
            Pull Expenses for Unit {settlement.unitNumber}
          </DialogTitle>
          <p className="text-xs text-slate-400 font-medium">
            {fmtDate(settlement.periodStart)} – {fmtDate(settlement.periodEnd)} · Toll, fuel and maintenance records already recorded elsewhere in FleetManage for this unit in this period.
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : !data || (data.tolls.length === 0 && data.fuel.length === 0 && data.maintenance.length === 0) ? (
          <div className="py-12 text-center text-sm font-bold text-slate-400">
            No matching toll, fuel, or maintenance records found for this unit and period.
          </div>
        ) : (
          <div className="space-y-5 mt-1">
            {/* Tolls */}
            {data.tolls.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <GroupHeader
                  icon={<Receipt className="w-3.5 h-3.5" />} label="Toll Transactions"
                  ids={data.tolls.map(t => t.tollRecordId)} set={selectedTolls} setter={setSelectedTolls}
                />
                <div className="divide-y divide-slate-50">
                  {data.tolls.map(t => (
                    <label key={t.tollRecordId} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                      <Checkbox checked={selectedTolls.has(t.tollRecordId)} onCheckedChange={() => toggle(selectedTolls, setSelectedTolls, t.tollRecordId)} />
                      <div className="flex-1 min-w-0 text-xs">
                        <span className="font-bold text-slate-900">{fmtDate(t.tripDate)}</span>
                        {t.routeDescription && <span className="text-slate-500 ml-2 truncate">{t.routeDescription}</span>}
                        {(t.originAddress || t.destinationAddress) && (
                          <span className="text-slate-400 ml-2 truncate">{t.originAddress} {t.originAddress && t.destinationAddress ? "→" : ""} {t.destinationAddress}</span>
                        )}
                      </div>
                      <span className="text-xs font-black text-slate-900 shrink-0">{money(t.totalCostEzPass ?? t.totalCostCash)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Fuel */}
            {data.fuel.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <GroupHeader
                  icon={<Fuel className="w-3.5 h-3.5" />} label="Fuel"
                  ids={data.fuel.map(f => f.fuelRecordId)} set={selectedFuel} setter={setSelectedFuel}
                />
                <div className="divide-y divide-slate-50">
                  {data.fuel.map(f => (
                    <label key={f.fuelRecordId} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                      <Checkbox checked={selectedFuel.has(f.fuelRecordId)} onCheckedChange={() => toggle(selectedFuel, setSelectedFuel, f.fuelRecordId)} />
                      <div className="flex-1 min-w-0 text-xs">
                        <span className="font-bold text-slate-900">{fmtDate(f.date)}</span>
                        <span className="text-slate-500 ml-2 truncate">{f.vendorName} · {f.fuelType} · {f.gallons.toFixed(2)} gal</span>
                      </div>
                      <span className="text-xs font-black text-slate-900 shrink-0">{money(f.totalAmount)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Maintenance */}
            {data.maintenance.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <GroupHeader
                  icon={<Wrench className="w-3.5 h-3.5" />} label="Maintenance"
                  ids={data.maintenance.map(m => m.workOrderId)} set={selectedMaintenance} setter={setSelectedMaintenance}
                />
                <div className="divide-y divide-slate-50">
                  {data.maintenance.map(m => (
                    <label key={m.workOrderId} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                      <Checkbox checked={selectedMaintenance.has(m.workOrderId)} onCheckedChange={() => toggle(selectedMaintenance, setSelectedMaintenance, m.workOrderId)} />
                      <div className="flex-1 min-w-0 text-xs">
                        <span className="font-bold text-slate-900">{fmtDate(m.date)}</span>
                        <span className="text-slate-500 ml-2 truncate">{m.title || m.category}{m.vendorName ? ` · ${m.vendorName}` : ""}</span>
                      </div>
                      <span className="text-xs font-black text-slate-900 shrink-0">{money(m.totalCost)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-5 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleImport}
            disabled={importing || totalSelected === 0}
            className="bg-blue-600 text-white hover:bg-blue-700 font-bold"
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : `Import Selected (${totalSelected})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportExpensesDialog;
