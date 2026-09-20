import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Page } from "@/components/layout/Page";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  settlementsApi, SettlementDetail,
} from "@/lib/settlementsApi";
import { truckOwnersApi, TruckOwner } from "@/lib/truckOwnersApi";
import { equipmentApi } from "@/lib/equipmentApi";
import { operatorsApi } from "@/lib/operatorsApi";
import SettlementHeaderDialog from "@/components/settlements/SettlementHeaderDialog";
import SettlementRowDialog, { RowSection } from "@/components/settlements/SettlementRowDialog";
import SettlementPrintView from "@/components/settlements/SettlementPrintView";
import ImportExpensesDialog from "@/components/settlements/ImportExpensesDialog";
import { useAuth } from "@/components/auth/AuthContext";
import {
  ArrowLeft, Loader2, Pencil, Trash2, Plus, FileCheck, Info, Printer, Download,
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface OptionItem { id: string; label: string }

const money = (n: number) => `$${n.toFixed(2)}`;
const fmtDate = (d?: string) => (d ? format(parseISO(d), "M/d/yyyy") : "—");

const rowApi: Record<RowSection, { add: any; update: any; del: any }> = {
  load:      { add: settlementsApi.addLoad,           update: settlementsApi.updateLoad,           del: settlementsApi.deleteLoad },
  toll:      { add: settlementsApi.addToll,            update: settlementsApi.updateToll,            del: settlementsApi.deleteToll },
  billInfo:  { add: settlementsApi.addBillInfoItem,     update: settlementsApi.updateBillInfoItem,     del: settlementsApi.deleteBillInfoItem },
  deduction: { add: settlementsApi.addDeduction,        update: settlementsApi.updateDeduction,        del: settlementsApi.deleteDeduction },
  expense:   { add: settlementsApi.addExpense,          update: settlementsApi.updateExpense,          del: settlementsApi.deleteExpense },
};

const SettlementDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const companyName =
    (user as any)?.companyName || (user as any)?.CompanyName ||
    (user as any)?.tenant?.name || (user as any)?.Tenant?.Name ||
    (user as any)?.tenantName || (user as any)?.TenantName ||
    (user as any)?.company || (user as any)?.Company ||
    "Your Company";

  const [settlement, setSettlement] = useState<SettlementDetail | null>(null);
  const [truckOwner, setTruckOwner] = useState<TruckOwner | null>(null);
  const [equipmentOptions, setEquipmentOptions] = useState<OptionItem[]>([]);
  const [operatorOptions, setOperatorOptions] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [showEditHeader, setShowEditHeader] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [rowDialog, setRowDialog] = useState<{ section: RowSection; row: any | null } | null>(null);

  const fetchAll = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [s, equipment, operators] = await Promise.all([
        settlementsApi.get(id),
        equipmentApi.list(),
        operatorsApi.getAll(1, 500),
      ]);
      setSettlement(s);
      setEquipmentOptions(equipment.map((e: any) => ({ id: e.id, label: e.unitNumber })));
      setOperatorOptions(operators.map((o: any) => ({ id: o.id, label: o.fullName })));
      truckOwnersApi.get(s.truckOwnerId).then(setTruckOwner).catch(() => {});
    } catch {
      toast({ title: "Failed to load settlement", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handleHeaderSubmit = async (dto: any) => {
    if (!settlement) return;
    const updated = await settlementsApi.update(settlement.id, dto);
    setSettlement(updated);
    truckOwnersApi.get(updated.truckOwnerId).then(setTruckOwner).catch(() => {});
    toast({ title: "Settlement updated" });
  };

  const openAdd = (section: RowSection) => setRowDialog({ section, row: null });
  const openEdit = (section: RowSection, row: any) => setRowDialog({ section, row });

  const handleRowSubmit = async (payload: any) => {
    if (!settlement || !rowDialog) return;
    const { section, row } = rowDialog;
    const api = rowApi[section];
    const updated = row
      ? await api.update(settlement.id, row.id, payload)
      : await api.add(settlement.id, payload);
    setSettlement(updated);
    toast({ title: row ? "Row updated" : "Row added" });
  };

  const handleDeleteSettlement = async () => {
    if (!settlement) return;
    if (!window.confirm(`Delete this settlement for ${settlement.vendorName} (Unit ${settlement.unitNumber})? This cannot be undone.`)) return;
    try {
      await settlementsApi.remove(settlement.id);
      toast({ title: "Settlement deleted" });
      navigate("/app/settlements");
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.response?.data?.error ?? err?.message, variant: "destructive" });
    }
  };

  const handleDeleteRow = async (section: RowSection, rowId: string) => {
    if (!settlement) return;
    if (!window.confirm("Delete this row?")) return;
    try {
      const updated = await rowApi[section].del(settlement.id, rowId);
      setSettlement(updated);
      toast({ title: "Row deleted" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  if (loading || !settlement) {
    return (
      <Page>
        <div className="flex items-center justify-center p-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </Page>
    );
  }

  const s = settlement;
  const importedNetDiffers = s.importedTotalNetBill != null && Math.abs(s.importedTotalNetBill - s.totalNetBill) > 0.005;

  const SectionCard = ({
    title, onAdd, addLabel, accent, children,
  }: { title: string; onAdd: () => void; addLabel: string; accent?: "amber"; children: React.ReactNode }) => (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${accent === "amber" ? "border-amber-200" : "border-slate-100"}`}>
      <div className={`px-6 py-4 border-b flex items-center justify-between ${accent === "amber" ? "border-amber-100 bg-amber-50/50" : "border-slate-100"}`}>
        <h3 className="font-black text-slate-900">{title}</h3>
        <Button size="sm" onClick={onAdd} className="h-8 px-3 bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> {addLabel}
        </Button>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );

  const RowActions = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
    <div className="flex items-center gap-1 justify-end">
      <button onClick={onEdit} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700">
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button onClick={onDelete} className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <Page>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate("/app/settlements")} className="h-10 w-10 rounded-2xl border-slate-200 shadow-sm shrink-0">
          <ArrowLeft className="w-4 h-4 text-slate-400" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Truck Owner Settlement</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            {s.vendorName} · Unit {s.unitNumber} · {s.driverName}
          </p>
        </div>
        <Button variant="secondary" onClick={() => setShowImport(true)} className="h-10 px-4 rounded-xl gap-2 font-bold text-xs uppercase tracking-wider text-slate-600 bg-slate-100 hover:bg-slate-200">
          <Download className="w-4 h-4" /> Pull Expenses
        </Button>
        <Button variant="secondary" onClick={() => window.print()} className="h-10 px-4 rounded-xl gap-2 font-bold text-xs uppercase tracking-wider text-slate-600 bg-slate-100 hover:bg-slate-200">
          <Printer className="w-4 h-4" /> Export PDF
        </Button>
        <Button variant="secondary" onClick={() => setShowEditHeader(true)} className="h-10 px-4 rounded-xl gap-2 font-bold text-xs uppercase tracking-wider text-slate-600 bg-slate-100 hover:bg-slate-200">
          <Pencil className="w-4 h-4" /> Edit
        </Button>
        <Button variant="ghost" onClick={handleDeleteSettlement} className="h-10 w-10 p-0 rounded-xl hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors shrink-0">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-6">

        {/* ── Section 1: Settlement Information ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-slate-400" />
            <h3 className="font-black text-slate-900">Settlement Information</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 px-6 py-5 text-sm">
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill Date</p><p className="font-bold text-slate-900 mt-0.5">{fmtDate(s.billDate)}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Period Start</p><p className="font-bold text-slate-900 mt-0.5">{fmtDate(s.periodStart)}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Period End</p><p className="font-bold text-slate-900 mt-0.5">{fmtDate(s.periodEnd)}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Check Date</p><p className="font-bold text-slate-900 mt-0.5">{fmtDate(s.checkDate)}</p></div>

            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor Name</p><p className="font-bold text-slate-900 mt-0.5">{s.vendorName}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">MC Number</p><p className="font-bold text-slate-900 mt-0.5">{truckOwner?.mcNumber || "—"}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trucks</p><p className="font-bold text-slate-900 mt-0.5">{s.trucks}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Drivers</p><p className="font-bold text-slate-900 mt-0.5">{s.drivers}</p></div>

            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</p><p className="font-bold text-slate-900 mt-0.5">{s.externalId || "—"}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Units</p><p className="font-bold text-slate-900 mt-0.5">{s.unitNumber}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trips</p><p className="font-bold text-slate-900 mt-0.5">{s.trips}</p></div>
          </div>
          <div className="grid grid-cols-3 gap-x-6 px-6 py-5 border-t border-slate-100 bg-slate-50/50">
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Gross Bill</p><p className="font-black text-slate-900 mt-0.5">{money(s.totalGrossBill)}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deductions</p><p className="font-black text-slate-900 mt-0.5">{money(s.deductionsTotal)}</p></div>
            <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Net Bill</p><p className="font-black text-slate-900 mt-0.5">{money(s.totalNetBill)}</p></div>
          </div>
        </div>

        {/* ── Section 2: Total Gross (Loads) ── */}
        <SectionCard title="Total Gross" onAdd={() => openAdd("load")} addLabel="Add Load">
          <div className="px-6 py-3 flex flex-wrap gap-x-8 gap-y-1 text-xs border-b border-slate-100">
            <span><span className="font-black text-slate-400 uppercase tracking-wider mr-1.5">Driver Name:</span><span className="font-bold text-slate-900">{s.driverName}</span></span>
            <span><span className="font-black text-slate-400 uppercase tracking-wider mr-1.5">Settlement Number:</span><span className="font-bold text-slate-900">{s.settlementNumber || "—"}</span></span>
            <span><span className="font-black text-slate-400 uppercase tracking-wider mr-1.5">Unit Number:</span><span className="font-bold text-slate-900">{s.unitNumber}</span></span>
            <span><span className="font-black text-slate-400 uppercase tracking-wider mr-1.5">Driver ID:</span><span className="font-bold text-slate-900">{s.driverId || "—"}</span></span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Load Number</TableHead><TableHead>PU</TableHead><TableHead>DEL</TableHead>
                <TableHead>DEL Date</TableHead><TableHead className="text-right">Loaded Miles</TableHead>
                <TableHead className="text-right">Empty Miles</TableHead><TableHead className="text-right">Total Miles</TableHead>
                <TableHead className="text-right">Gross</TableHead><TableHead className="text-right">Payment</TableHead><TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.loads.map(l => (
                <TableRow key={l.id}>
                  <TableCell>{l.loadNumber || "—"}</TableCell>
                  <TableCell>{l.pickupLocation || "—"}</TableCell>
                  <TableCell>{l.deliveryLocation || "—"}</TableCell>
                  <TableCell>{fmtDate(l.deliveryDate)}</TableCell>
                  <TableCell className="text-right">{l.loadedMiles.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{l.emptyMiles.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{l.totalMiles.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{money(l.grossAmount)}</TableCell>
                  <TableCell className="text-right">{money(l.paymentAmount)}</TableCell>
                  <TableCell><RowActions onEdit={() => openEdit("load", l)} onDelete={() => handleDeleteRow("load", l.id)} /></TableCell>
                </TableRow>
              ))}
              {s.loads.length === 0 && <TableRow><TableCell colSpan={10} className="text-center text-slate-400 py-8">No loads yet</TableCell></TableRow>}
            </TableBody>
            {s.loads.length > 0 && (
              <TableFooter>
                <TableRow className="bg-slate-50/70 font-black">
                  <TableCell colSpan={4}>Total:</TableCell>
                  <TableCell className="text-right">{s.loads.reduce((a, l) => a + l.loadedMiles, 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{s.loads.reduce((a, l) => a + l.emptyMiles, 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{s.loads.reduce((a, l) => a + l.totalMiles, 0).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{money(s.loads.reduce((a, l) => a + l.grossAmount, 0))}</TableCell>
                  <TableCell className="text-right">{money(s.loads.reduce((a, l) => a + l.paymentAmount, 0))}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </SectionCard>

        {/* ── Section 3: Toll Transactions ── */}
        <SectionCard title="Toll Transactions" onAdd={() => openAdd("toll")} addLabel="Add Toll">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead><TableHead>Driver Name</TableHead><TableHead>Date</TableHead>
                <TableHead>Description</TableHead><TableHead>Exit Plaza</TableHead><TableHead>City</TableHead>
                <TableHead>State</TableHead><TableHead className="text-right">Total Amount</TableHead><TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.tollTransactions.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{t.type}</TableCell>
                  <TableCell>{t.driverName || "—"}</TableCell>
                  <TableCell>{fmtDate(t.transactionDate)}</TableCell>
                  <TableCell>{t.description || "—"}</TableCell>
                  <TableCell>{t.exitPlaza || "—"}</TableCell>
                  <TableCell>{t.city || "—"}</TableCell>
                  <TableCell>{t.state || "—"}</TableCell>
                  <TableCell className="text-right">{money(t.totalAmount)}</TableCell>
                  <TableCell><RowActions onEdit={() => openEdit("toll", t)} onDelete={() => handleDeleteRow("toll", t.id)} /></TableCell>
                </TableRow>
              ))}
              {s.tollTransactions.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-slate-400 py-8">No toll transactions yet</TableCell></TableRow>}
            </TableBody>
            {s.tollTransactions.length > 0 && (
              <TableFooter>
                <TableRow className="bg-slate-50/70 font-black">
                  <TableCell colSpan={7}>Total:</TableCell>
                  <TableCell className="text-right">{money(s.tollTransactions.reduce((a, t) => a + t.totalAmount, 0))}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </SectionCard>

        {/* ── Section 4: Bill Information ── */}
        <SectionCard title="Bill Information" onAdd={() => openAdd("billInfo")} addLabel="Add Bill Item">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nature</TableHead><TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead><TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Total Amount</TableHead><TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.billInfoItems.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-bold">{b.nature}</TableCell>
                  <TableCell>{b.description || "—"}</TableCell>
                  <TableCell className="text-right">{b.quantity.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{money(b.rate)}</TableCell>
                  <TableCell className="text-right">{money(b.totalAmount)}</TableCell>
                  <TableCell><RowActions onEdit={() => openEdit("billInfo", b)} onDelete={() => handleDeleteRow("billInfo", b.id)} /></TableCell>
                </TableRow>
              ))}
              {s.billInfoItems.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">No bill information yet</TableCell></TableRow>}
            </TableBody>
            {s.billInfoItems.length > 0 && (
              <TableFooter>
                <TableRow className="bg-slate-50/70 font-black">
                  <TableCell colSpan={4}>Total:</TableCell>
                  <TableCell className="text-right">{money(s.totalGrossBill)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </SectionCard>

        {/* ── Section 5: Deductions ── */}
        <SectionCard title="Deductions" onAdd={() => openAdd("deduction")} addLabel="Add Deduction">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead><TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead><TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Total Amount</TableHead><TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.deductionItems.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-bold">{d.type}{d.syncFromTollTotal && <span className="ml-1.5 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">synced</span>}</TableCell>
                  <TableCell>{d.description || "—"}</TableCell>
                  <TableCell className="text-right">{d.quantity.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{money(d.rate)}</TableCell>
                  <TableCell className="text-right">{money(d.totalAmount)}</TableCell>
                  <TableCell><RowActions onEdit={() => openEdit("deduction", d)} onDelete={() => handleDeleteRow("deduction", d.id)} /></TableCell>
                </TableRow>
              ))}
              {s.deductionItems.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-slate-400 py-8">No deductions yet</TableCell></TableRow>}
            </TableBody>
            {s.deductionItems.length > 0 && (
              <TableFooter>
                <TableRow className="bg-slate-50/70 font-black">
                  <TableCell colSpan={4}>Total:</TableCell>
                  <TableCell className="text-right">{money(s.deductionsTotal)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </SectionCard>

        {/* ── Section 6: Other Expenses (FleetManage-only, kept separate) ── */}
        <SectionCard title="Other Expenses" onAdd={() => openAdd("expense")} addLabel="Add Expense" accent="amber">
          <div className="px-6 py-2.5 flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50/50 border-b border-amber-100">
            <Info className="w-3.5 h-3.5 shrink-0" />
            FleetManage-entered expenses, kept separate from the settlement's Deductions. These reduce Adjusted Net Pay only.
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Description</TableHead>
                <TableHead>Unit</TableHead><TableHead>Driver</TableHead>
                <TableHead className="text-right">Quantity</TableHead><TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Total Amount</TableHead><TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.otherExpenses.map(e => (
                <TableRow key={e.id}>
                  <TableCell>{fmtDate(e.expenseDate)}</TableCell>
                  <TableCell className="font-bold">{e.type}</TableCell>
                  <TableCell>{e.description || "—"}</TableCell>
                  <TableCell>{e.unitNumber || "—"}</TableCell>
                  <TableCell>{e.driverName || "—"}</TableCell>
                  <TableCell className="text-right">{e.quantity.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{money(e.rate)}</TableCell>
                  <TableCell className="text-right">{money(e.totalAmount)}</TableCell>
                  <TableCell><RowActions onEdit={() => openEdit("expense", e)} onDelete={() => handleDeleteRow("expense", e.id)} /></TableCell>
                </TableRow>
              ))}
              {s.otherExpenses.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-slate-400 py-8">No other expenses yet</TableCell></TableRow>}
            </TableBody>
            {s.otherExpenses.length > 0 && (
              <TableFooter>
                <TableRow className="bg-amber-50/60 font-black">
                  <TableCell colSpan={7}>Total:</TableCell>
                  <TableCell className="text-right">{money(s.otherExpensesTotal)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </SectionCard>

        {/* ── Net Pay Summary ── */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Net Bill</p>
              <p className="text-2xl font-black mt-0.5">{money(s.totalNetBill)}</p>
              {importedNetDiffers && (
                <p className="text-[11px] text-amber-300 mt-1">Originally Imported: {money(s.importedTotalNetBill!)}</p>
              )}
            </div>
            <div className="text-4xl font-black text-slate-600 hidden sm:block">−</div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Other Expenses</p>
              <p className="text-2xl font-black mt-0.5 text-amber-400">{money(s.otherExpensesTotal)}</p>
            </div>
            <div className="text-4xl font-black text-slate-600 hidden sm:block">=</div>
            <div className="sm:text-right">
              <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Adjusted Net Pay</p>
              <p className="text-3xl font-black mt-0.5 text-white">{money(s.adjustedNetPay)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print / PDF export target - hidden on screen, shown only when printing (see index.css) */}
      <div id="printable-area" className="hidden print:block">
        <SettlementPrintView settlement={s} truckOwner={truckOwner} companyName={companyName} />
      </div>

      <SettlementHeaderDialog
        open={showEditHeader}
        onOpenChange={setShowEditHeader}
        initial={s}
        equipmentOptions={equipmentOptions}
        operatorOptions={operatorOptions}
        onSubmit={handleHeaderSubmit}
      />

      <ImportExpensesDialog
        open={showImport}
        onOpenChange={setShowImport}
        settlement={s}
        onImported={setSettlement}
      />

      {rowDialog && (
        <SettlementRowDialog
          open={!!rowDialog}
          onOpenChange={(open) => { if (!open) setRowDialog(null); }}
          section={rowDialog.section}
          initial={rowDialog.row}
          equipmentOptions={equipmentOptions}
          operatorOptions={operatorOptions}
          onSubmit={handleRowSubmit}
        />
      )}
    </Page>
  );
};

export default SettlementDetailPage;
