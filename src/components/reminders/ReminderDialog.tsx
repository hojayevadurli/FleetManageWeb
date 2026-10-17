import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bell } from "lucide-react";
import { REMINDER_TYPES, Reminder, ReminderUpsert } from "@/lib/remindersApi";
import ComboboxInput from "@/components/common/ComboboxInput";

interface OptionItem { id: string; label: string }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Reminder | null;
  defaultEquipmentId?: string;
  equipmentOptions: OptionItem[];
  operatorOptions: OptionItem[];
  onSubmit: (dto: ReminderUpsert) => Promise<void>;
}

const ReminderDialog = ({ open, onOpenChange, initial, defaultEquipmentId, equipmentOptions, operatorOptions, onSubmit }: Props) => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueAtOdometer, setDueAtOdometer] = useState("");
  const [repeatDays, setRepeatDays] = useState("");
  const [repeatMiles, setRepeatMiles] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? "");
    setType(initial?.type ?? "");
    setEquipmentId(initial?.equipmentId ?? defaultEquipmentId ?? "");
    setOperatorId(initial?.operatorId ?? "");
    setDueDate(initial?.dueDate?.slice(0, 10) ?? "");
    setDueAtOdometer(initial?.dueAtOdometer != null ? String(initial.dueAtOdometer) : "");
    setRepeatDays(initial?.repeatIntervalDays != null ? String(initial.repeatIntervalDays) : "");
    setRepeatMiles(initial?.repeatIntervalMiles != null ? String(initial.repeatIntervalMiles) : "");
    setNotes(initial?.notes ?? "");
  }, [open, initial, defaultEquipmentId]);

  const currentOdometer = equipmentOptions.find(o => o.id === equipmentId) ? initial?.currentOdometer : undefined;

  const handleSave = async () => {
    if (!title.trim()) return toast({ title: "Title is required", variant: "destructive" });
    if (!dueDate && !dueAtOdometer) return toast({ title: "Set a due date, a due odometer reading, or both", variant: "destructive" });

    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        type: type.trim() || "Other",
        equipmentId: equipmentId || undefined,
        operatorId: operatorId || undefined,
        dueDate: dueDate || undefined,
        dueAtOdometer: dueAtOdometer ? Number(dueAtOdometer) : undefined,
        repeatIntervalDays: repeatDays ? Number(repeatDays) : undefined,
        repeatIntervalMiles: repeatMiles ? Number(repeatMiles) : undefined,
        notes: notes.trim() || undefined,
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
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-black">
            <Bell className="w-5 h-5 text-blue-600" />
            {initial ? "Edit Reminder" : "New Reminder"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Title *</Label>
            <Input className="h-10 bg-white border-slate-200" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Oil Change Due" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Type</Label>
            <ComboboxInput
              value={type}
              onChange={setType}
              suggestions={REMINDER_TYPES}
              placeholder="e.g. Oil Change, Registration Renewal"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Unit (optional)</Label>
              <Select value={equipmentId || "__none__"} onValueChange={v => setEquipmentId(v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-10 bg-white border-slate-200"><SelectValue placeholder="Select unit..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Fleet-wide —</SelectItem>
                  {equipmentOptions.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Driver (optional)</Label>
              <Select value={operatorId || "__none__"} onValueChange={v => setOperatorId(v === "__none__" ? "" : v)}>
                <SelectTrigger className="h-10 bg-white border-slate-200"><SelectValue placeholder="Select driver..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Unassigned —</SelectItem>
                  {operatorOptions.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Due Date</Label>
              <Input type="date" className="h-10 bg-white border-slate-200" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Due At Odometer (mi)</Label>
              <Input type="number" className="h-10 bg-white border-slate-200" value={dueAtOdometer} onChange={e => setDueAtOdometer(e.target.value)} placeholder="Optional" />
              {currentOdometer != null && (
                <p className="text-[11px] text-slate-400">Current: {currentOdometer.toLocaleString()} mi</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Repeat Every (days)</Label>
              <Input type="number" className="h-10 bg-white border-slate-200" value={repeatDays} onChange={e => setRepeatDays(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Repeat Every (miles)</Label>
              <Input type="number" className="h-10 bg-white border-slate-200" value={repeatMiles} onChange={e => setRepeatMiles(e.target.value)} placeholder="Optional" />
            </div>
          </div>
          {(repeatDays || repeatMiles) && (
            <p className="text-[11px] text-slate-400 -mt-2">When you mark this complete, the next reminder is created automatically that far out.</p>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Notes</Label>
            <Textarea className="bg-white border-slate-200" value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter className="mt-5 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white hover:bg-blue-700 font-bold">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (initial ? "Save Changes" : "Create Reminder")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReminderDialog;
