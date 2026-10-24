import { CircleDollarSign, TrendingUp, MessageSquareWarning, Layers } from "lucide-react";

const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-CA");

function Kpi({ label, value, sub, tone = "text-[#102B2A]" }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`mt-1 text-xl font-extrabold tabular-nums ${tone}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

function BarList({ title, note, rows, valueLabel }) {
  const max = Math.max(...(rows || []).map((r) => r.value), 1);
  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
      <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500">{title}</h2>
      {note && <p className="mt-1 text-[11px] text-slate-500">{note}</p>}
      {(rows || []).length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No approved additions yet.</p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#102B2A]">{r.label}</span>
                <span className="tabular-nums text-slate-600">{r.count > 1 ? `${r.count} · ` : ""}{money(r.value)}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-[#187B65]" style={{ width: `${Math.max((r.value / max) * 100, 3)}%` }} />
              </div>
            </div>
          ))}
          {valueLabel && <p className="text-[10px] text-slate-400 pt-1">{valueLabel}</p>}
        </div>
      )}
    </div>
  );
}

export default function SalesExpansion({ fin }) {
  const u = fin?.upsell;
  const labels = fin?.stage_labels || {};
  return (
    <div className="space-y-5">
      {u && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi label="Bookings with additions" value={`${u.pct_with_additions}%`} sub={`${u.bookings_with_additions} of ${fin?.overview?.jobs ?? 0} completed jobs`} tone="text-[#187B65]" />
            <Kpi label="Additional revenue" value={money(u.additional_revenue)} sub={`${money(u.avg_additional_per_booking)} per booking average`} />
            <Kpi label="Avg additional when added" value={money(u.avg_additional_when_added)} sub="Across jobs where the customer added items" />
            <Kpi label="Incremental contribution" value={money(u.incremental_contractor_profit)} tone="text-[#187B65]" sub={`Operator share · platform gained ${money(u.incremental_platform_profit)}`} />
            <Kpi label="Avg original quote" value={money(u.avg_original_quote)} sub="Estimate at booking time" />
            <Kpi label="Avg final approved price" value={money(u.avg_final_price)} sub="After approved additions" />
            <Kpi label="Quote-to-final uplift" value={u.avg_original_quote > 0 ? `${Math.round(((u.avg_final_price - u.avg_original_quote) / u.avg_original_quote) * 100)}%` : "—"} sub="Whether lower initial quotes led to higher final sales" />
            <Kpi label="Disputes after price changes" value={(u.disputes_with_price_changes?.count || 0).toLocaleString("en-CA")} tone={u.disputes_with_price_changes?.count ? "text-amber-600" : "text-[#102B2A]"} sub="Complaints on jobs with additions — customer-requested vs corrections still distinguished below" />
          </div>

          <div className="rounded-3xl bg-[#eef4f0] border border-[#187B65]/20 px-5 py-4 text-xs text-[#102B2A] leading-relaxed">
            <strong>What counts as an addition:</strong> only customer-approved change orders on an existing job (numbered, with their own approval).
            Mandatory price corrections are recorded as change orders with a negative or explanatory amount and are never counted as upsell revenue.
            Every addition keeps its original approved price untouched.
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <BarList
              title="When customers add items"
              note="Job stage captured from the live lifecycle timeline at the moment each addition was approved."
              rows={(u.by_stage || []).map((s) => ({ label: s.label || labels[s.stage] || s.stage, count: s.count, value: s.revenue }))}
            />
            <BarList
              title="Additional revenue by contractor"
              rows={(fin?.by_contractor || []).filter((c) => c.additional > 0).map((c) => ({ label: c.key, count: c.jobs, value: c.additional }))}
            />
          </div>

          <BarList
            title="Additional revenue by city"
            rows={(fin?.by_city || []).filter((c) => c.additional > 0).map((c) => ({ label: c.key, count: c.jobs, value: c.additional }))}
          />

          {u.disputes_with_price_changes?.count > 0 && (
            <div className="rounded-3xl bg-white border border-amber-200 p-5">
              <h2 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><MessageSquareWarning className="w-4 h-4 text-amber-600" /> Disputes associated with price changes ({u.disputes_with_price_changes.count})</h2>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                {u.disputes_with_price_changes.sample.map((s, i) => <li key={i}>· {s}</li>)}
              </ul>
            </div>
          )}

          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 flex items-center gap-2"><Layers className="w-4 h-4 text-[#187B65]" /> Where pricing adjustments may be justified</h2>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2 pr-4">Load tier</th><th className="py-2 pr-4">Jobs</th><th className="py-2 pr-4">Gross sales</th><th className="py-2 pr-4">Contribution</th><th className="py-2 pr-4">Margin</th><th className="py-2">From additions</th>
                  </tr>
                </thead>
                <tbody>
                  {(fin?.by_load || []).map((g) => (
                    <tr key={g.key} className="border-t border-slate-100">
                      <td className="py-2.5 pr-4 font-semibold text-[#102B2A] capitalize">{g.key}</td>
                      <td className="py-2.5 pr-4 tabular-nums">{g.jobs}</td>
                      <td className="py-2.5 pr-4 tabular-nums">{money(g.gross)}</td>
                      <td className="py-2.5 pr-4 tabular-nums">{money(g.contribution)}</td>
                      <td className="py-2.5 pr-4 tabular-nums font-bold text-[#187B65]">{g.margin_pct}%</td>
                      <td className="py-2.5 tabular-nums text-[#187B65]">{money(g.additional)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Tiers with strong contribution margins are the strongest candidates for pricing; tiers with weak margins may justify an adjustment. Verified from completed jobs only.</p>
          </div>
        </>
      )}
    </div>
  );
}