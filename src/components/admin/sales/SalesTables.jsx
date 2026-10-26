const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-CA", { minimumFractionDigits: 2 });
const panel = "rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5";
const h = "text-sm font-bold uppercase tracking-[0.15em] text-[#102B2A] mb-3";

function Empty({ children }) {
  return <p className="text-sm text-slate-500 py-4">{children}</p>;
}

export function CityTable({ title, rows, note }) {
  return (
    <div className={panel}>
      <h2 className={h}>{title}</h2>
      {note && <p className="text-xs text-slate-500 -mt-2 mb-3">{note}</p>}
      {rows.length === 0 ? <Empty>No sales records yet — rows appear as jobs and inquiries are logged.</Empty> : (
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.city} className="flex items-center justify-between rounded-lg bg-[#f6f8f7] px-3 py-2 text-sm">
              <span className="font-semibold text-[#102B2A]">{r.city}</span>
              <span className="font-bold text-[#187B65] tabular-nums">{r.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GapTable({ rows }) {
  return (
    <div className={panel}>
      <h2 className={h}>Territory demand and supply gaps</h2>
      <p className="text-xs text-slate-500 -mt-2 mb-3">Open inquiries per city versus whether a verified, active contractor is on file in that city.</p>
      {rows.length === 0 ? <Empty>No open inquiries awaiting a contractor.</Empty> : (
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.city} className="flex items-center justify-between gap-2 rounded-lg bg-[#f6f8f7] px-3 py-2 text-sm">
              <span className="font-semibold text-[#102B2A]">{r.city}</span>
              <span className="text-slate-500 tabular-nums">{r.open_requests} open</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${r.has_verified_contractor ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {r.has_verified_contractor ? "Contractor on file" : "Supply gap"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ContractorTable({ rows }) {
  return (
    <div className={panel}>
      <h2 className={h}>Contractor performance</h2>
      <p className="text-xs text-slate-500 -mt-2 mb-3">
        Acceptance rate = offered jobs not declined. Acquisition cost is shown only where a platform-generated job has completed.
      </p>
      {rows.length === 0 ? <Empty>No jobs have been offered to contractors yet.</Empty> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th className="text-left py-2 px-2">Contractor</th>
                <th className="text-right py-2 px-2">Offered</th>
                <th className="text-right py-2 px-2">Accept %</th>
                <th className="text-right py-2 px-2">Completed</th>
                <th className="text-right py-2 px-2">Gross value</th>
                <th className="text-right py-2 px-2">Referral revenue</th>
                <th className="text-right py-2 px-2">Acq. cost / job</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => (
                <tr key={c.partner}>
                  <td className="py-2.5 px-2 font-semibold text-[#102B2A]">{c.partner}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums">{c.offered}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums">{c.acceptance_rate === null ? "—" : `${c.acceptance_rate}%`}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums">{c.completed}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums">{money(c.gross_job_value)}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums text-[#187B65] font-bold">{money(c.referral_revenue)}</td>
                  <td className="py-2.5 px-2 text-right tabular-nums">{c.effective_acquisition_cost === null ? "Not measurable yet" : money(c.effective_acquisition_cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}