import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileCheck } from "lucide-react";
import TruckOwnerPicker from "./TruckOwnerPicker";
import { SettlementDetail, SettlementUpsert } from "@/lib/settlementsApi";

interface OptionItem { id: string; label: string }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: SettlementDetail | null;
  /** Pre-selected unit when creating a new settlement (e.g. from an asset's detail page). Ignored when editing. */
  defaultEquipmentId?: string;
  equipmentOptions: OptionItem[];
  operatorOptions: OptionItem[];
  onSubmit: (dto: SettlementUpsert) => Promise<void>;
}

const SettlementHeaderDialog = ({ open, onOpenChange, initial, defaultEquipmentId, equipmentOptions, operatorOptions, onSubmit }: Props) => {
  const { toast } = useToast();
  const [truckOwnerId, setTruckOwnerId] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [primaryOperatorId, setPrimaryOperatorId] = useState("");
  const [externalId, setExternalId] = useState("");
  const [settlementNumber, setSettlementNumber] = useState("");
  const [billDate, setBillDate] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [checkDate, setCheckDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTruckOwnerId(initial?.truckOwnerId ?? "");
    setEquipmentId(initial?.equipmentId ?? defaultEquipmentId ?? "");
    setPrimaryOperatorId(initial?.primaryOperatorId ?? "");
    setExternalId(initial?.externalId ?? "");
    setSettlementNumber(initial?.settlementNumber ?? "");
    setBillDate(initial?.billDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10));
    setPeriodStart(initial?.periodStart?.slice(0, 10) ?? "");
    setPeriodEnd(initial?.periodEnd?.slice(0, 10) ?? "");
    setCheckDate(initial?.checkDate?.slice(0, 10) ?? "");
    setNotes(initial?.notes ?? "");
  }, [open, initial, defaultEquipmentId]);

  const handleSave = async () => {
    if (!truckOwnerId) return toast({ title: "Select a vendor", variant: "destructive" });
    if (!equipmentId) return toast({ title: "Select a unit", variant: "destructive" });
    if (!primaryOperatorId) return toast({ title: "Select a driver", variant: "destructive" });
    if (!billDate || !periodStart || !periodEnd) return toast({ title: "Bill Date, Period Start and Period End are required", variant: "destructive" });

    setSaving(true);
    try {
      await onSubmit({
        truckOwnerId, equipmentId, primaryOperatorId,
        externalId: externalId || undefined,
        settlementNumber: settlementNumber || undefined,
        billDate, periodStart, periodEnd,
        checkDate: checkDate || undefined,
        notes: notes || undefined,
      });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Save failed", description: err?.response?.data?.error ?? err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-black">
            <FileCheck className="w-5 h-5 text-blue-600" />
            {initial ? "Edit Settlement Information" : "New Truck Owner Settlement"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Vendor Name *</Label>
            <TruckOwnerPicker value={truckOwnerId} onChange={setTruckOwnerId} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Unit Number *</Label>
              <Select value={equipmentId} onValueChange={setEquipmentId}>
                <SelectTrigger className="h-10 bg-white border-slate-200"><SelectValue placeholder="Select unit..." /></SelectTrigger>
                <SelectContent>
                  {equipmentOptions.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Driver Name *</Label>
              <Select value={primaryOperatorId} onValueChange={setPrimaryOperatorId}>
                <SelectTrigger className="h-10 bg-white border-slate-200"><SelectValue placeholder="Select driver..." /></SelectTrigger>
                <SelectContent>
                  {operatorOptions.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">ID</Label>
              <Input className="h-10 bg-white border-slate-200" value={externalId} onChange={e => setExternalId(e.target.value)} placeholder="e.g. BL-005342" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Settlement Number</Label>
              <Input className="h-10 bg-white border-slate-200" value={settlementNumber} onChange={e => setSettlementNumber(e.target.value)} placeholder="e.g. ST-007239" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Bill Date *</Label>
              <Input type="date" className="h-10 bg-white border-slate-200" value={billDate} onChange={e => setBillDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Check Date</Label>
              <Input type="date" className="h-10 bg-white border-slate-200" value={checkDate} onChange={e => setCheckDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Period Start *</Label>
              <Input type="date" className="h-10 bg-white border-slate-200" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Period End *</Label>
              <Input type="date" className="h-10 bg-white border-slate-200" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Notes</Label>
            <Textarea className="bg-white border-slate-200" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter className="mt-5 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700 font-bold">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (initial ? "Save Changes" : "Create Settlement")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettlementHeaderDialog;
