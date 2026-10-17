import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { remindersApi, Reminder } from "@/lib/remindersApi";
import { operatorsApi } from "@/lib/operatorsApi";
import { Equipment } from "@/lib/types";
import ReminderDialog from "./ReminderDialog";
import ReminderList from "./ReminderList";
import { Plus, Loader2 } from "lucide-react";

interface Props {
  equipment: Equipment;
}

const RemindersEquipmentTab = ({ equipment }: Props) => {
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [operatorOptions, setOperatorOptions] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogState, setDialogState] = useState<{ open: boolean; initial: Reminder | null }>({ open: false, initial: null });

  const equipmentOptions = [{ id: equipment.id, label: equipment.unitNumber }];

  const fetchData = async () => {
    setLoading(true);
    try {
      const list = await remindersApi.list({ equipmentId: equipment.id });
      setReminders(list);
    } catch {
      toast({ title: "Failed to load reminders", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    operatorsApi.getAll(1, 500)
      .then(ops => setOperatorOptions(ops.map((o: any) => ({ id: o.id, label: o.fullName }))))
      .catch(() => {});
  }, [equipment.id]);

  const handleSubmit = async (dto: any) => {
    if (dialogState.initial) {
      const updated = await remindersApi.update(dialogState.initial.id, dto);
      setReminders(prev => prev.map(r => r.id === updated.id ? updated : r));
      toast({ title: "Reminder updated" });
    } else {
      const created = await remindersApi.create(dto);
      setReminders(prev => [created, ...prev]);
      toast({ title: "Reminder created" });
    }
  };

  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleComplete = async (r: Reminder) => {
    if (pendingId) return;
    setPendingId(r.id);
    try {
      await remindersApi.complete(r.id);
      await fetchData();
      toast({ title: "Reminder completed" });
    } catch {
      toast({ title: "Failed to complete", variant: "destructive" });
    } finally {
      setPendingId(null);
    }
  };

  const handleDismiss = async (r: Reminder) => {
    if (pendingId) return;
    setPendingId(r.id);
    try {
      const updated = await remindersApi.dismiss(r.id);
      setReminders(prev => prev.map(x => x.id === updated.id ? updated : x));
    } catch {
      toast({ title: "Failed to dismiss", variant: "destructive" });
    } finally {
      setPendingId(null);
    }
  };

  const handleReopen = async (r: Reminder) => {
    if (pendingId) return;
    setPendingId(r.id);
    try {
      const updated = await remindersApi.reopen(r.id);
      setReminders(prev => prev.map(x => x.id === updated.id ? updated : x));
    } catch {
      toast({ title: "Failed to reopen", variant: "destructive" });
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (r: Reminder) => {
    if (pendingId) return;
    if (!window.confirm(`Delete reminder "${r.title}"?`)) return;
    setPendingId(r.id);
    try {
      await remindersApi.remove(r.id);
      setReminders(prev => prev.filter(x => x.id !== r.id));
      toast({ title: "Reminder deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setPendingId(null);
    }
  };

  const openCount = reminders.filter(r => r.status === "Open").length;
  const overdueCount = reminders.filter(r => r.isOverdue).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-900">Reminders</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {openCount} open{overdueCount > 0 ? ` · ${overdueCount} overdue` : ""}
          </p>
        </div>
        <Button
          onClick={() => setDialogState({ open: true, initial: null })}
          className="bg-blue-600 text-white h-9 px-4 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700 text-sm"
        >
          <Plus className="w-4 h-4" /> New Reminder
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : (
        <ReminderList
          reminders={reminders}
          showUnitColumn={false}
          pendingId={pendingId}
          onEdit={(r) => setDialogState({ open: true, initial: r })}
          onComplete={handleComplete}
          onDismiss={handleDismiss}
          onReopen={handleReopen}
          onDelete={handleDelete}
        />
      )}

      <ReminderDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState(prev => ({ ...prev, open }))}
        initial={dialogState.initial}
        defaultEquipmentId={equipment.id}
        equipmentOptions={equipmentOptions}
        operatorOptions={operatorOptions}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default RemindersEquipmentTab;
