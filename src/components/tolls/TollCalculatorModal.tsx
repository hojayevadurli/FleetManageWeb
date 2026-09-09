import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { tollsApi, TollRecord } from "@/lib/tollsApi";
import { Equipment } from "@/lib/types";
import { Loader2, Receipt } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: Equipment[];
  preselectedEquipmentId?: string;
  onSaved: (record: TollRecord) => void;
}

const PAYMENT_METHODS = [
  { value: "Cash",    label: "Cash" },
  { value: "EZPass",  label: "E-ZPass" },
  { value: "Other",   label: "Other" },
];

const TollRecordModal = ({ open, onOpenChange, equipment, preselectedEquipmentId, onSaved }: Props) => {
  const { toast } = useToast();
  const [equipmentId, setEquipmentId] = useState(preselectedEquipmentId ?? "");
  const [tripDate, setTripDate]       = useState(new Date().toISOString().slice(0, 16));
  const [amount, setAmount]           = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [plaza, setPlaza]             = useState("");
  const [route, setRoute]             = useState("");
  const [notes, setNotes]             = useState("");
  const [loading, setLoading]         = useState(false);

  const reset = () => {
    setEquipmentId(preselectedEquipmentId ?? "");
    setTripDate(new Date().toISOString().slice(0, 16));
    setAmount("");
    setPaymentMethod("Cash");
    setPlaza("");
    setRoute("");
    setNotes("");
  };

  const handleSave = async () => {
    if (!equipmentId) {
      toast({ title: "Select a unit", variant: "destructive" });
      return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) < 0) {
      toast({ title: "Enter a valid toll amount", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const isCash   = paymentMethod === "Cash";
      const isEzPass = paymentMethod === "EZPass";

      const record = await tollsApi.manual({
        equipmentId,
        originAddress: plaza.trim() || undefined,
        routeDescription: route.trim() || undefined,
        vehicleType: "5AxlesTruck",
        tripDate: new Date(tripDate).toISOString(),
        totalCostCash:    isCash   ? parseFloat(amount) : 0,
        totalCostEzPass:  isEzPass ? parseFloat(amount) : undefined,
        notes: [paymentMethod !== "Cash" && paymentMethod !== "EZPass" ? `Paid via ${paymentMethod}` : "", notes.trim()]
               .filter(Boolean).join(" — ") || undefined,
      });

      toast({ title: "Toll recorded", description: `$${parseFloat(amount).toFixed(2)} saved for ${record.unitNumber}.` });
      onSaved(record);
      onOpenChange(false);
      reset();
    } catch (err: any) {
      toast({ title: "Save failed", description: err?.message ?? "Unknown error.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-black">
            <Receipt className="w-5 h-5 text-blue-600" />
            Record Toll Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          {/* Unit */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Unit *</Label>
            <Select value={equipmentId} onValueChange={setEquipmentId}>
              <SelectTrigger className="h-10 bg-white border-slate-200">
                <SelectValue placeholder="Select unit..." />
              </SelectTrigger>
              <SelectContent>
                {equipment.map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.unitNumber}{e.make ? ` · ${e.year} ${e.make} ${e.model}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Date Paid *</Label>
            <Input
              type="datetime-local"
              className="h-10 bg-white border-slate-200 text-sm"
              value={tripDate}
              onChange={e => setTripDate(e.target.value)}
            />
          </div>

          {/* Amount + Payment method */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Amount Paid ($) *</Label>
              <Input
                type="number" min="0" step="0.01"
                className="h-10 bg-white border-slate-200 text-sm"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-10 bg-white border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Plaza / Location */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Plaza / Location</Label>
            <Input
              className="h-10 bg-white border-slate-200 text-sm"
              placeholder="e.g. Lincoln Tunnel, Exit 14 NJ Turnpike"
              value={plaza}
              onChange={e => setPlaza(e.target.value)}
            />
          </div>

          {/* Route */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Route / Highway</Label>
            <Input
              className="h-10 bg-white border-slate-200 text-sm"
              placeholder="e.g. I-95 N, NJ Turnpike"
              value={route}
              onChange={e => setRoute(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Notes</Label>
            <Input
              className="h-10 bg-white border-slate-200 text-sm"
              placeholder="Optional notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="mt-5 gap-2">
          <Button variant="outline" onClick={() => { onOpenChange(false); reset(); }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 text-white hover:bg-blue-700 font-bold"
          >
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Toll Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TollRecordModal;
