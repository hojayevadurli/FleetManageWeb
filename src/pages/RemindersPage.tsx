import { useEffect, useState } from "react";
import { Page, PageHeader } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { remindersApi, Reminder } from "@/lib/remindersApi";
import { equipmentApi } from "@/lib/equipmentApi";
import { operatorsApi } from "@/lib/operatorsApi";
import ReminderDialog from "@/components/reminders/ReminderDialog";
import ReminderList from "@/components/reminders/ReminderList";
import { Plus, Loader2, AlertTriangle, Bell, CheckCircle2 } from "lucide-react";

type FilterTab = "open" | "overdue" | "completed" | "all";

const RemindersPage = () => {
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [equipmentOptions, setEquipmentOptions] = useState<{ id: string; label: string }[]>([]);
  const [operatorOptions, setOperatorOptions] = useState<{ id: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("open");
  const [dialogState, setDialogState] = useState<{ open: boolean; initial: Reminder | null }>({ open: false, initial: null });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [list, equipment, operators] = await Promise.all([
        remindersApi.list({ pageSize: 500 }),
        equipmentApi.list(),
        operatorsApi.getAll(1, 500),
      ]);
      setReminders(list);
      setEquipmentOptions(equipment.map((e: any) => ({ id: e.id, label: e.unitNumber })));
      setOperatorOptions(operators.map((o: any) => ({ id: o.id, label: o.fullName })));
    } catch {
      toast({ title: "Failed to load reminders", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCount = reminders.filter(r => r.status === "Open").length;
  const overdueCount = reminders.filter(r => r.isOverdue).length;
  const completedCount = reminders.filter(r => r.status === "Completed").length;

  const filtered = reminders.filter(r => {
    if (tab === "open") return r.status === "Open";
    if (tab === "overdue") return r.isOverdue;
    if (tab === "completed") return r.status === "Completed";
    return true;
  });

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

  const handleComplete = async (r: Reminder) => {
    try {
      await remindersApi.complete(r.id);
      fetchData(); // refetch - completing may have created a new follow-up reminder
      toast({ title: "Reminder completed" });
    } catch {
      toast({ title: "Failed to complete", variant: "destructive" });
    }
  };

  const handleDismiss = async (r: Reminder) => {
    try {
      const updated = await remindersApi.dismiss(r.id);
      setReminders(prev => prev.map(x => x.id === updated.id ? updated : x));
    } catch {
      toast({ title: "Failed to dismiss", variant: "destructive" });
    }
  };

  const handleReopen = async (r: Reminder) => {
    try {
      const updated = await remindersApi.reopen(r.id);
      setReminders(prev => prev.map(x => x.id === updated.id ? updated : x));
    } catch {
      toast({ title: "Failed to reopen", variant: "destructive" });
    }
  };

  const handleDelete = async (r: Reminder) => {
    if (!window.confirm(`Delete reminder "${r.title}"?`)) return;
    try {
      await remindersApi.remove(r.id);
      setReminders(prev => prev.filter(x => x.id !== r.id));
      toast({ title: "Reminder deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <Page>
        <div className="flex items-center justify-center p-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </Page>
    );
  }

  const TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: "open", label: "Open", count: openCount },
    { key: "overdue", label: "Overdue", count: overdueCount },
    { key: "completed", label: "Completed", count: completedCount },
    { key: "all", label: "All", count: reminders.length },
  ];

  return (
    <Page>
      <PageHeader title="Reminders" subtitle="Oil changes, maintenance, renewals, and anything else you need to stay on top of">
        <Button
          onClick={() => setDialogState({ open: true, initial: null })}
          className="bg-blue-600 text-white h-10 px-5 rounded-lg flex items-center gap-2 font-bold hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New Reminder
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-blue-500" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Open</p>
          </div>
          <p className="text-3xl font-black text-slate-900">{openCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Overdue</p>
          </div>
          <p className="text-3xl font-black text-rose-600">{overdueCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Completed</p>
          </div>
          <p className="text-3xl font-black text-slate-900">{completedCount}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 mt-6 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              tab === t.key ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {t.label} <span className="opacity-60">({t.count})</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        <ReminderList
          reminders={filtered}
          onEdit={(r) => setDialogState({ open: true, initial: r })}
          onComplete={handleComplete}
          onDismiss={handleDismiss}
          onReopen={handleReopen}
          onDelete={handleDelete}
        />
      </div>

      <ReminderDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState(prev => ({ ...prev, open }))}
        initial={dialogState.initial}
        equipmentOptions={equipmentOptions}
        operatorOptions={operatorOptions}
        onSubmit={handleSubmit}
      />
    </Page>
  );
};

export default RemindersPage;
