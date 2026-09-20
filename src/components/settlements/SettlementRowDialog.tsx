import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  DEDUCTION_TYPES, BILL_INFO_NATURES, OTHER_EXPENSE_TYPES,
} from "@/lib/settlementsApi";

export type RowSection = "load" | "toll" | "billInfo" | "deduction" | "expense";

interface OptionItem { id: string; label: string }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: RowSection;
  initial?: any | null;
  /** Pre-selected unit for the "expense" section's Unit field when adding a new row. Ignored when editing. */
  defaultEquipmentId?: string;
  equipmentOptions: OptionItem[];
  operatorOptions: OptionItem[];
  onSubmit: (payload: any) => Promise<void>;
}

const SECTION_TITLES: Record<RowSection, string> = {
  load: "Load",
  toll: "Toll Transaction",
  billInfo: "Bill Information Item",
  deduction: "Deduction",
  expense: "Other Expense",
};

const emptyForm = () => ({
  loadNumber: "", pickupLocation: "", deliveryLocation: "", deliveryDate: "",
  loadedMiles: "", emptyMiles: "", totalMiles: "", grossAmount: "", paymentAmount: "",

  type: "", operatorId: "", driverNameRaw: "", transactionDate: "", description: "",
  exitPlaza: "", city: "", state: "", totalAmount: "",

  nature: "",

  quantity: "1", rate: "", syncFromTollTotal: false,

  expenseDate: "", equipmentId: "",
});

const SettlementRowDialog = ({ open, onOpenChange, section, initial, defaultEquipmentId, equipmentOptions, operatorOptions, onSubmit }: Props) => {
  const { toast } = useToast();
  const [form, setForm] = useState<any>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        ...emptyForm(),
        ...initial,
        loadedMiles: initial.loadedMiles ?? "",
        emptyMiles: initial.emptyMiles ?? "",
        totalMiles: initial.totalMiles ?? "",
        grossAmount: initial.grossAmount ?? "",
        paymentAmount: initial.paymentAmount ?? "",
        totalAmount: initial.totalAmount ?? "",
        quantity: initial.quantity ?? 1,
        rate: initial.rate ?? "",
        deliveryDate: initial.deliveryDate?.slice(0, 10) ?? "",
        transactionDate: initial.transactionDate?.slice(0, 10) ?? "",
        expenseDate: initial.expenseDate?.slice(0, 10) ?? "",
        operatorId: initial.operatorId ?? "",
        equipmentId: initial.equipmentId ?? "",
        syncFromTollTotal: initial.syncFromTollTotal ?? false,
      });
    } else {
      setForm({ ...emptyForm(), equipmentId: defaultEquipmentId ?? "" });
    }
  }, [open, initial, defaultEquipmentId]);

  const set = (field: string) => (e: any) => {
    const value = e?.target ? e.target.value : e;
    setForm((prev: any) => {
      const next = { ...prev, [field]: value };
      // Auto-total: Quantity * Rate for billInfo / deduction / expense sections
      if ((field === "quantity" || field === "rate") && ["billInfo", "deduction", "expense"].includes(section)) {
        const q = parseFloat(field === "quantity" ? value : next.quantity);
        const r = parseFloat(field === "rate" ? value : next.rate);
        if (!isNaN(q) && !isNaN(r)) next.totalAmount = (q * r).toFixed(2);
      }
      // Auto-total miles for loads
      if ((field === "loadedMiles" || field === "emptyMiles") && section === "load") {
        const lm = parseFloat(field === "loadedMiles" ? value : next.loadedMiles);
        const em = parseFloat(field === "emptyMiles" ? value : next.emptyMiles);
        if (!isNaN(lm) && !isNaN(em)) next.totalMiles = (lm + em).toFixed(2);
      }
      return next;
    });
  };

  const num = (v: any) => (v === "" || v === null || v === undefined ? 0 : parseFloat(v));

  const handleSave = async () => {
    if (section === "expense" && form.type?.toLowerCase() === "other" && !form.description?.trim()) {
      toast({ title: "Description is required when Type is \"Other\"", variant: "destructive" });
      return;
    }
    if (section === "billInfo" && !form.nature?.trim()) {
      toast({ title: "Nature is required", variant: "destructive" });
      return;
    }
    if ((section === "deduction" || section === "expense") && !form.type?.trim()) {
      toast({ title: "Type is required", variant: "destructive" });
      return;
    }

    let payload: any;
    switch (section) {
      case "load":
        payload = {
          loadNumber: form.loadNumber || undefined,
          pickupLocation: form.pickupLocation || undefined,
          deliveryLocation: form.deliveryLocation || undefined,
          deliveryDate: form.deliveryDate || undefined,
          loadedMiles: num(form.loadedMiles),
          emptyMiles: num(form.emptyMiles),
          totalMiles: num(form.totalMiles),
          grossAmount: num(form.grossAmount),
          paymentAmount: num(form.paymentAmount),
        };
        break;
      case "toll":
        payload = {
          type: form.type || "Toll",
          operatorId: form.operatorId || undefined,
          driverNameRaw: form.driverNameRaw || undefined,
          transactionDate: form.transactionDate || undefined,
          description: form.description || undefined,
          exitPlaza: form.exitPlaza || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          totalAmount: num(form.totalAmount),
        };
        break;
      case "billInfo":
        payload = {
          nature: form.nature,
          description: form.description || undefined,
          quantity: num(form.quantity) || 1,
          rate: num(form.rate),
          totalAmount: num(form.totalAmount),
        };
        break;
      case "deduction":
        payload = {
          type: form.type,
          description: form.description || undefined,
          quantity: num(form.quantity) || 1,
          rate: num(form.rate),
          totalAmount: num(form.totalAmount),
          syncFromTollTotal: !!form.syncFromTollTotal,
        };
        break;
      case "expense":
        payload = {
          expenseDate: form.expenseDate,
          type: form.type,
          description: form.description || undefined,
          equipmentId: form.equipmentId || undefined,
          operatorId: form.operatorId || undefined,
          quantity: num(form.quantity) || 1,
          rate: num(form.rate),
          totalAmount: num(form.totalAmount),
        };
        break;
    }

    setSaving(true);
    try {
      await onSubmit(payload);
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Save failed", description: err?.response?.data?.error ?? err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, children: React.ReactNode) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  );

  const textInput = (name: string, placeholder = "", type = "text") => (
    <Input
      type={type}
      className="h-10 bg-white border-slate-200"
      value={form[name] ?? ""}
      onChange={set(name)}
      placeholder={placeholder}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-black">
            {initial ? "Edit" : "Add"} {SECTION_TITLES[section]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          {section === "load" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {field("Load Number", textInput("loadNumber"))}
                {field("DEL Date", textInput("deliveryDate", "", "date"))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {field("PU (Pickup)", textInput("pickupLocation", "City, ST"))}
                {field("DEL (Delivery)", textInput("deliveryLocation", "City, ST"))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {field("Loaded Miles", textInput("loadedMiles", "0.00", "number"))}
                {field("Empty Miles", textInput("emptyMiles", "0.00", "number"))}
                {field("Total Miles", textInput("totalMiles", "0.00", "number"))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {field("Gross ($)", textInput("grossAmount", "0.00", "number"))}
                {field("Payment ($)", textInput("paymentAmount", "0.00", "number"))}
              </div>
            </>
          )}

          {section === "toll" && (
            <>
              <p className="text-[11px] text-slate-400 -mt-1">This also creates/updates a matching entry in the unit's Tolls history.</p>
              <div className="grid grid-cols-2 gap-3">
                {field("Type", textInput("type", "Toll"))}
                {field("Date", textInput("transactionDate", "", "date"))}
              </div>
              {field("Driver", (
                <Select value={form.operatorId || "__none__"} onValueChange={v => set("operatorId")(v === "__none__" ? "" : v)}>
                  <SelectTrigger className="h-10 bg-white border-slate-200"><SelectValue placeholder="Select driver..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Not linked —</SelectItem>
                    {operatorOptions.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ))}
              {!form.operatorId && field("Driver Name (free text)", textInput("driverNameRaw", "If driver isn't in the list"))}
              {field("Description", textInput("description"))}
              <div className="grid grid-cols-3 gap-3">
                {field("Exit Plaza", textInput("exitPlaza"))}
                {field("City", textInput("city"))}
                {field("State", textInput("state"))}
              </div>
              {field("Total Amount ($)", textInput("totalAmount", "0.00", "number"))}
            </>
          )}

          {section === "billInfo" && (
            <>
              {field("Nature", (
                <>
                  <Input
                    list="bill-info-natures"
                    className="h-10 bg-white border-slate-200"
                    value={form.nature ?? ""}
                    onChange={set("nature")}
                    placeholder="e.g. Driver Pay, Total Gross"
                  />
                  <datalist id="bill-info-natures">
                    {BILL_INFO_NATURES.map(n => <option key={n} value={n} />)}
                  </datalist>
                </>
              ))}
              {field("Description", textInput("description"))}
              <div className="grid grid-cols-3 gap-3">
                {field("Quantity", textInput("quantity", "1", "number"))}
                {field("Rate ($)", textInput("rate", "0.00", "number"))}
                {field("Total Amount ($)", textInput("totalAmount", "0.00", "number"))}
              </div>
            </>
          )}

          {section === "deduction" && (
            <>
              {field("Type", (
                <>
                  <Input
                    list="deduction-types"
                    className="h-10 bg-white border-slate-200"
                    value={form.type ?? ""}
                    onChange={set("type")}
                    placeholder="e.g. Trailer Rental, Tolls"
                  />
                  <datalist id="deduction-types">
                    {DEDUCTION_TYPES.map(t => <option key={t} value={t} />)}
                  </datalist>
                </>
              ))}
              {field("Description", textInput("description", "e.g. Trailer rental, Dispatch Fee"))}
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="syncFromTollTotal"
                  checked={!!form.syncFromTollTotal}
                  onCheckedChange={(v) => set("syncFromTollTotal")(!!v)}
                />
                <Label htmlFor="syncFromTollTotal" className="text-xs font-bold text-slate-600">
                  Sync amount to current Toll Transactions total
                </Label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {field("Quantity", textInput("quantity", "1", "number"))}
                {field("Rate ($)", <Input type="number" className="h-10 bg-white border-slate-200" value={form.rate ?? ""} onChange={set("rate")} disabled={form.syncFromTollTotal} />)}
                {field("Total Amount ($)", <Input type="number" className="h-10 bg-white border-slate-200" value={form.totalAmount ?? ""} onChange={set("totalAmount")} disabled={form.syncFromTollTotal} />)}
              </div>
              {form.syncFromTollTotal && (
                <p className="text-[11px] text-slate-400">Amount will be set automatically to match the Toll Transactions total when saved.</p>
              )}
            </>
          )}

          {section === "expense" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                {field("Date", textInput("expenseDate", "", "date"))}
                {field("Type", (
                  <>
                    <Input
                      list="expense-types"
                      className="h-10 bg-white border-slate-200"
                      value={form.type ?? ""}
                      onChange={set("type")}
                      placeholder="e.g. Fuel, Parking, Other"
                    />
                    <datalist id="expense-types">
                      {OTHER_EXPENSE_TYPES.map(t => <option key={t} value={t} />)}
                    </datalist>
                  </>
                ))}
              </div>
              {form.type?.trim().toLowerCase() === "fuel" && (
                <p className="text-[11px] text-slate-400">This also creates/updates a matching entry in the unit's Fuel history (Quantity → gallons, Rate → price/gal).</p>
              )}
              {field(`Description${form.type?.toLowerCase() === "other" ? " *" : ""}`, textInput("description", "e.g. Driver hotel due to breakdown"))}
              <div className="grid grid-cols-2 gap-3">
                {field("Unit (optional)", (
                  <Select value={form.equipmentId || "__none__"} onValueChange={v => set("equipmentId")(v === "__none__" ? "" : v)}>
                    <SelectTrigger className="h-10 bg-white border-slate-200"><SelectValue placeholder="Select unit..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Unassigned —</SelectItem>
                      {equipmentOptions.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ))}
                {field("Driver (optional)", (
                  <Select value={form.operatorId || "__none__"} onValueChange={v => set("operatorId")(v === "__none__" ? "" : v)}>
                    <SelectTrigger className="h-10 bg-white border-slate-200"><SelectValue placeholder="Select driver..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Unassigned —</SelectItem>
                      {operatorOptions.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {field(form.type?.trim().toLowerCase() === "fuel" ? "Gallons" : "Quantity", textInput("quantity", "1", "number"))}
                {field(form.type?.trim().toLowerCase() === "fuel" ? "Price/Gal ($)" : "Rate ($)", textInput("rate", "0.00", "number"))}
                {field("Total Amount ($)", textInput("totalAmount", "0.00", "number"))}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-5 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700 font-bold">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettlementRowDialog;
