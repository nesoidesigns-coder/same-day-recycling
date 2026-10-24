import { useState } from "react";
import { Loader2, Users, MapPin, Truck, AlertTriangle, ReceiptText, ChevronRight } from "lucide-react";
import JobFinanceDrawer from "@/components/admin/revenue/JobFinanceDrawer";

const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-CA");
const pct = (v) => `${Number(v) || 0}%`;

function Kpi({ label, value, sub, tone = "text-[#102B2A]" }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`mt-1 text-xl font-extrabold tabular-nums ${tone}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

function GroupTable({ title, icon: Icon, rows, moneyCols }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
      <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 flex items-center gap-2"><Icon className="w-4 h-4 text-[#187B65]" /> {title}</h2>
      {(rows || []).length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No completed jobs yet.</p>
      ) : (
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Jobs</th><th className="py-2 pr-4">Gross sales</th>
                <th className="py-2 pr-4">Payouts</th><th className="py-2 pr-4">From additions</th><th className="py-2 pr-4">Contribution</th><th className="py-2">Margin</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.key} className="border-t border-slate-100">
                  <td className="py-2.5 pr-4 font-semibold text-[#102B2A] capitalize">{g.key}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{g.jobs}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{money(g.gross)}</td>
                  <td className="py-2.5 pr-4 tabular-nums">{money(g.payout)}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-[#187B65]">{money(g.additional)}</td>
                  <td className="py-2.5 pr-4 tabular-nums font-semibold">{money(g.contribution)}</td>
                  <td className="py-2.5 tabular-nums font-bold text-[#187B65]">{pct(g.margin_pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {moneyCols && null}
    </div>
  );
}

export default function OperatorEconomics({ fin, onChanged }) {
  const [openJob, setOpenJob] = useState(null);
  const o = fin?.overview;
  const missing = fin?.missing_records;
  return (
    <div className="space-y-5">
      {o && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Kpi label="Jobs completed" value={(o.jobs || 0).toLocaleString("en-CA")} sub={`${o.verified_jobs || 0} with verified expenses`} />
          <Kpi label="Gross customer sales" value={money(o.gross_sales)} sub="Approved prices + additions, before tax" />
          <Kpi label="Contractor payouts" value={money(o.contractor_payouts)} sub={`Platform commission ${money(o.platform_commission)}`} />
          <Kpi label="Avg direct expenses" value={money(o.avg_expenses)} sub="Disposal, labour, fuel, other" />
          <Kpi label="Avg contribution / job" value={money(o.avg_contribution)} tone="text-[#187B65]" sub="Payout minus direct expenses" />
          <Kpi label="Contribution margin" value={pct(o.contribution_margin_pct)} tone="text-[#187B65]" sub="Contractor share of final price" />
          <Kpi label="Platform contribution" value={money(o.platform_profit_total)} sub={`${pct(o.platform_margin_pct)} of gross, net of fees`} />
          <Kpi label="Unverified profit records" value={(missing?.count || 0).toLocaleString("en-CA")} tone={missing?.count ? "text-amber-600" : "text-[#102B2A]"} sub="Missing expense records — not verified profit" />
        </div>
      )}

      {missing?.count > 0 && (
        <div className="rounded-3xl bg-amber-50 border border-amber-200 p-5">
          <h2 className="text-sm font-bold text-amber-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Incomplete financial records — {missing.count} completed job{missing.count === 1 ? "" : "s"} missing expenses</h2>
          <p className="mt-1 text-xs text-amber-700">Contribution profit on these jobs is not verified until expenses are recorded. Open a job to enter them.</p>
          <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {missing.sample.map((j, i) => (
              <button key={i} onClick={() => setOpenJob(j.booking_id || j)} className="text-left rounded-xl bg-white border border-amber-200 px-3 py-2 text-xs hover:border-[#187B65] transition-colors">
                <div className="font-bold text-[#102B2A]">{j.job_name || j.reference_code || "Job"}</div>
                <div className="text-amber-700">{(j.partner_name || "Unassigned")}{j.missing?.length ? ` · missing: ${j.missing.join(", ")}` : ""}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <GroupTable title="Performance by contractor" icon={Users} rows={fin?.by_contractor} />
      <GroupTable title="Performance by city" icon={MapPin} rows={fin?.by_city} />
      <GroupTable title="Profitability by load size" icon={Truck} rows={fin?.by_load} />

      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 flex items-center gap-2"><ReceiptText className="w-4 h-4 text-[#187B65]" /> Job financial ledger</h2>
        <p className="mt-1 text-xs text-slate-500">Every completed job: where the customer payment went, what the operator earned, what the platform earned. Open a job for its full audit trail.</p>
        {(fin?.jobs || []).length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No job financials synced yet — records appear when jobs complete.</p>
        ) : (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-2 pr-3">Job</th><th className="py-2 pr-3">Final price</th><th className="py-2 pr-3">Commission</th>
                  <th className="py-2 pr-3">Payout</th><th className="py-2 pr-3">Expenses</th><th className="py-2 pr-3">Contribution</th><th className="py-2 pr-3">Margin</th><th className="py-2">Records</th>
                </tr>
              </thead>
              <tbody>
                {(fin?.jobs || []).map((j) => (
                  <tr key={j.booking_id} className="border-t border-slate-100 hover:bg-[#eef4f0]/60">
                    <td className="py-2.5 pr-3">
                      <button onClick={() => setOpenJob(j.booking_id)} className="text-left font-semibold text-[#187B65] hover:underline inline-flex items-center gap-1">
                        {j.job_name || j.reference_code || "Job"} <ChevronRight className="w-3 h-3" />
                      </button>
                      <div className="text-[10px] text-slate-400">{j.city || "—"} · {j.partner_name || "Unassigned"}</div>
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums">{money(j.final_customer_price)}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{money(j.commission_earned)}<span className="text-[10px] text-slate-400"> {j.commission_rate}%</span></td>
                    <td className="py-2.5 pr-3 tabular-nums">{money(j.contractor_payout)}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{money((Number(j.expenses_disposal) || 0) + (Number(j.expenses_labour) || 0) + (Number(j.expenses_fuel) || 0) + (Number(j.expenses_other) || 0))}</td>
                    <td className="py-2.5 pr-3 tabular-nums font-semibold text-[#187B65]">{money(j.contractor_profit)}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{j.contribution_margin_pct}%</td>
                    <td className="py-2.5">
                      {j.expenses_verified ? <span className="rounded-full bg-[#187B65]/10 text-[#187B65] px-2 py-0.5 text-[9px] font-bold uppercase">verified</span> : <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[9px] font-bold uppercase">unverified</span>}
                      {j.additional_revenue > 0 && <span className="ml-1 rounded-full bg-[#102B2A]/10 text-[#102B2A] px-2 py-0.5 text-[9px] font-bold uppercase">+ upsell</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {openJob && (
        <JobFinanceDrawer
          bookingId={openJob}
          onClose={() => setOpenJob(null)}
          onChanged={onChanged}
        />
      )}
      {fin === null && <Loader2 className="w-6 h-6 animate-spin text-[#187B65] mx-auto py-10" />}
    </div>
  );
}