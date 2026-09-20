import { SettlementDetail } from "@/lib/settlementsApi";
import { TruckOwner } from "@/lib/truckOwnersApi";
import { format, parseISO } from "date-fns";

interface Props {
  settlement: SettlementDetail;
  truckOwner: TruckOwner | null;
  companyName: string;
}

const money = (n: number) => `$${n.toFixed(2)}`;
const fmtDate = (d?: string) => (d ? format(parseISO(d), "M/d/yyyy") : "—");

const barStyle: React.CSSProperties = {
  background: "#4c4f9e",
  color: "#fff",
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact",
} as React.CSSProperties;

const SectionBar = ({ children }: { children: React.ReactNode }) => (
  <div style={barStyle} className="px-3 py-1.5 text-[11px] font-bold text-center">
    {children}
  </div>
);

const th = "text-left text-[9px] font-bold uppercase tracking-wide text-slate-500 px-2 py-1.5 border-b border-slate-300";
const thR = th + " text-right";
const td = "text-[10px] px-2 py-1.5 border-b border-slate-100 text-slate-800";
const tdR = td + " text-right";
const totalRow = "bg-slate-100 font-bold";

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between px-3 py-1.5 text-[10px] border-b border-slate-100 last:border-0">
    <span className="text-slate-500">{label}:</span>
    <span className="font-bold text-slate-900">{value}</span>
  </div>
);

const SettlementPrintView = ({ settlement: s, truckOwner, companyName }: Props) => {
  const importedNetDiffers = s.importedTotalNetBill != null && Math.abs(s.importedTotalNetBill - s.totalNetBill) > 0.005;

  return (
    <div className="bg-white text-slate-900 w-full max-w-[8.5in] mx-auto" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Document header */}
      <div className="flex items-start justify-between pb-4 border-b-2 border-slate-800 mb-4">
        <div>
          <p className="text-lg font-black">{companyName}</p>
        </div>
        <div className="text-[10px] text-right space-y-0.5">
          <div className="flex justify-between gap-4"><span className="text-slate-500">Bill Date:</span><span className="font-bold">{fmtDate(s.billDate)}</span></div>
          <div className="flex justify-between gap-4"><span className="text-slate-500">Period Start:</span><span className="font-bold">{fmtDate(s.periodStart)}</span></div>
          <div className="flex justify-between gap-4"><span className="text-slate-500">Period End:</span><span className="font-bold">{fmtDate(s.periodEnd)}</span></div>
          <div className="flex justify-between gap-4"><span className="text-slate-500">Check Date:</span><span className="font-bold">{fmtDate(s.checkDate)}</span></div>
        </div>
      </div>

      {/* Section 1: Settlement Information */}
      <div className="border border-slate-300 rounded overflow-hidden mb-4">
        <SectionBar>Truck Owner Settlement</SectionBar>
        <div className="grid grid-cols-2">
          <div>
            <InfoRow label="Vendor name" value={s.vendorName} />
            <InfoRow label="MC number" value={truckOwner?.mcNumber || "—"} />
            <InfoRow label="Trucks" value={s.trucks} />
            <InfoRow label="Drivers" value={s.drivers} />
            <InfoRow label="Trips" value={s.trips} />
          </div>
          <div>
            <InfoRow label="ID" value={s.externalId || "—"} />
            <InfoRow label="Units" value={s.unitNumber} />
            <InfoRow label="Total gross bill" value={money(s.totalGrossBill)} />
            <InfoRow label="Deductions" value={money(s.deductionsTotal)} />
            <InfoRow label="Total net bill" value={money(s.totalNetBill)} />
          </div>
        </div>
      </div>

      {/* Section 2: Total Gross */}
      <div className="border border-slate-300 rounded overflow-hidden mb-4">
        <SectionBar>Total Gross</SectionBar>
        <div className="flex flex-wrap gap-x-6 gap-y-0.5 px-3 py-2 text-[10px] border-b border-slate-200 bg-slate-50">
          <span><b>Driver Name:</b> {s.driverName}</span>
          <span><b>Settlement Number:</b> {s.settlementNumber || "—"}</span>
          <span><b>Unit Number:</b> {s.unitNumber}</span>
          <span><b>Driver ID:</b> {s.driverId || "—"}</span>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Load Number</th><th className={th}>PU</th><th className={th}>DEL</th>
              <th className={th}>DEL Date</th><th className={thR}>Loaded Miles</th><th className={thR}>Empty Miles</th>
              <th className={thR}>Total Miles</th><th className={thR}>Gross</th><th className={thR}>Payment</th>
            </tr>
          </thead>
          <tbody>
            {s.loads.map(l => (
              <tr key={l.id}>
                <td className={td}>{l.loadNumber || "—"}</td>
                <td className={td}>{l.pickupLocation || "—"}</td>
                <td className={td}>{l.deliveryLocation || "—"}</td>
                <td className={td}>{fmtDate(l.deliveryDate)}</td>
                <td className={tdR}>{l.loadedMiles.toFixed(2)}</td>
                <td className={tdR}>{l.emptyMiles.toFixed(2)}</td>
                <td className={tdR}>{l.totalMiles.toFixed(2)}</td>
                <td className={tdR}>{money(l.grossAmount)}</td>
                <td className={tdR}>{money(l.paymentAmount)}</td>
              </tr>
            ))}
            {s.loads.length > 0 && (
              <tr className={totalRow}>
                <td className={td} colSpan={4}>Total:</td>
                <td className={tdR}>{s.loads.reduce((a, l) => a + l.loadedMiles, 0).toFixed(2)}</td>
                <td className={tdR}>{s.loads.reduce((a, l) => a + l.emptyMiles, 0).toFixed(2)}</td>
                <td className={tdR}>{s.loads.reduce((a, l) => a + l.totalMiles, 0).toFixed(2)}</td>
                <td className={tdR}>{money(s.loads.reduce((a, l) => a + l.grossAmount, 0))}</td>
                <td className={tdR}>{money(s.loads.reduce((a, l) => a + l.paymentAmount, 0))}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Section 3: Toll Transactions */}
      <div className="border border-slate-300 rounded overflow-hidden mb-4">
        <SectionBar>Toll Transactions</SectionBar>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Type</th><th className={th}>Driver name</th><th className={th}>Date</th>
              <th className={th}>Description</th><th className={th}>Exit plaza</th><th className={th}>City</th>
              <th className={th}>State</th><th className={thR}>Total amount</th>
            </tr>
          </thead>
          <tbody>
            {s.tollTransactions.map(t => (
              <tr key={t.id}>
                <td className={td}>{t.type}</td>
                <td className={td}>{t.driverName || "—"}</td>
                <td className={td}>{fmtDate(t.transactionDate)}</td>
                <td className={td}>{t.description || "—"}</td>
                <td className={td}>{t.exitPlaza || "—"}</td>
                <td className={td}>{t.city || "—"}</td>
                <td className={td}>{t.state || "—"}</td>
                <td className={tdR}>{money(t.totalAmount)}</td>
              </tr>
            ))}
            {s.tollTransactions.length > 0 && (
              <tr className={totalRow}>
                <td className={td} colSpan={7}>Total:</td>
                <td className={tdR}>{money(s.tollTransactions.reduce((a, t) => a + t.totalAmount, 0))}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Section 4: Bill Information */}
      <div className="border border-slate-300 rounded overflow-hidden mb-4">
        <SectionBar>Bill Information</SectionBar>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Nature</th><th className={th}>Description</th>
              <th className={thR}>Quantity</th><th className={thR}>Rate</th><th className={thR}>Total amount</th>
            </tr>
          </thead>
          <tbody>
            {s.billInfoItems.map(b => (
              <tr key={b.id}>
                <td className={td}>{b.nature}</td>
                <td className={td}>{b.description || "—"}</td>
                <td className={tdR}>{b.quantity.toFixed(2)}</td>
                <td className={tdR}>{money(b.rate)}</td>
                <td className={tdR}>{money(b.totalAmount)}</td>
              </tr>
            ))}
            {s.billInfoItems.length > 0 && (
              <tr className={totalRow}>
                <td className={td} colSpan={4}>Total:</td>
                <td className={tdR}>{money(s.totalGrossBill)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Section 5: Deductions */}
      <div className="border border-slate-300 rounded overflow-hidden mb-4">
        <SectionBar>Deductions</SectionBar>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Type</th><th className={th}>Description</th>
              <th className={thR}>Quantity</th><th className={thR}>Rate</th><th className={thR}>Total amount</th>
            </tr>
          </thead>
          <tbody>
            {s.deductionItems.map(d => (
              <tr key={d.id}>
                <td className={td}>{d.type}</td>
                <td className={td}>{d.description || "—"}</td>
                <td className={tdR}>{d.quantity.toFixed(2)}</td>
                <td className={tdR}>{money(d.rate)}</td>
                <td className={tdR}>{money(d.totalAmount)}</td>
              </tr>
            ))}
            {s.deductionItems.length > 0 && (
              <tr className={totalRow}>
                <td className={td} colSpan={4}>Total:</td>
                <td className={tdR}>{money(s.deductionsTotal)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Section 6: Other Expenses (FleetManage-only, kept separate) */}
      {s.otherExpenses.length > 0 && (
        <div className="border border-amber-300 rounded overflow-hidden mb-4">
          <div style={{ background: "#b45309", color: "#fff", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties}
               className="px-3 py-1.5 text-[11px] font-bold text-center">
            Other Expenses (FleetManage) — not part of the original settlement
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>Date</th><th className={th}>Type</th><th className={th}>Description</th>
                <th className={th}>Unit</th><th className={th}>Driver</th>
                <th className={thR}>Quantity</th><th className={thR}>Rate</th><th className={thR}>Total amount</th>
              </tr>
            </thead>
            <tbody>
              {s.otherExpenses.map(e => (
                <tr key={e.id}>
                  <td className={td}>{fmtDate(e.expenseDate)}</td>
                  <td className={td}>{e.type}</td>
                  <td className={td}>{e.description || "—"}</td>
                  <td className={td}>{e.unitNumber || "—"}</td>
                  <td className={td}>{e.driverName || "—"}</td>
                  <td className={tdR}>{e.quantity.toFixed(2)}</td>
                  <td className={tdR}>{money(e.rate)}</td>
                  <td className={tdR}>{money(e.totalAmount)}</td>
                </tr>
              ))}
              <tr className={totalRow}>
                <td className={td} colSpan={7}>Total:</td>
                <td className={tdR}>{money(s.otherExpensesTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Net Pay footer */}
      <div className="mt-6 pt-3 border-t-4 border-double border-slate-800">
        {importedNetDiffers && (
          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
            <span>Originally Imported Net Bill:</span>
            <span>{money(s.importedTotalNetBill!)}</span>
          </div>
        )}
        <div className="flex justify-between text-[11px] mb-1">
          <span className="font-bold">Total Net Bill:</span>
          <span className="font-bold">{money(s.totalNetBill)}</span>
        </div>
        <div className="flex justify-between text-[11px] mb-1">
          <span className="font-bold">Other Expenses:</span>
          <span className="font-bold">−{money(s.otherExpensesTotal)}</span>
        </div>
        <div className="flex justify-between text-base font-black pt-2 mt-1 border-t-2 border-slate-800">
          <span>Adjusted Net Pay:</span>
          <span>{money(s.adjustedNetPay)}</span>
        </div>
      </div>
    </div>
  );
};

export default SettlementPrintView;
