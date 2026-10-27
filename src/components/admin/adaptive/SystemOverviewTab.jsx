import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, History, ListChecks, ShieldAlert } from "lucide-react";
import { fmtDate } from "./adaptiveData";

const STATUS_TONE = {
  operational: "bg-emerald-100 text-emerald-800",
  warnings: "bg-amber-100 text-[#8f5d00]",
  errors: "bg-red-100 text-red-700",
  unavailable: "bg-slate-200 text-slate-700",
};

const card = "rounded-2xl border border-li-steel bg-white p-5";

const Counter = ({ label, value, hint }) => (
  <div className="rounded-2xl border border-li-steel bg-white p-4">
    <div className="text-2xl font-bold text-li-carbon tabular-nums">{value}</div>
    <div className="mt-1 text-xs font-semibold text-li-carbon">{label}</div>
    <div className="mt-0.5 text-[11px] text-li-slate">{hint}</div>
  </div>
);

export default function SystemOverviewTab({ data, onOpenTab }) {
  const health = data.health === "healthy"
    ? { Icon: CheckCircle2, cls: "text-li-infra", label: "Healthy", note: "Every recorded source returned a clean result on its last run." }
    : data.health === "attention"
      ? { Icon: ShieldAlert, cls: "text-li-red", label: "Needs attention", note: "A source reported errors on its last run." }
      : { Icon: AlertTriangle, cls: "text-li-amber", label: "Coverage incomplete", note: "Some sources have not run recently or at all." };

  return (
    <div className="space-y-5">
      <div className={`${card} flex flex-wrap items-start gap-4`}>
        <health.Icon className={`mt-0.5 h-8 w-8 shrink-0 ${health.cls}`} />
        <div className="min-w-0 flex-1">
          <div className="text-lg font-bold text-li-carbon">System health: {health.label}</div>
          <p className="mt-1 text-sm text-li-slate">{health.note}</p>
          <ul className="mt-2 space-y-1 text-xs text-li-slate">
            {data.problems.length === 0 && <li>No open integrity errors, failed syncs or critical findings.</li>}
            {data.problems.map((p) => <li key={p}>· {p}</li>)}
          </ul>
        </div>
        <div className="text-right text-xs text-li-slate">
          <div>Last integrity sweep</div>
          <div className="font-semibold text-li-carbon">{fmtDate(data.lastRun?.run_date)}</div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Counter label="Pending recommendations" value={data.pending.length} hint="Awaiting an owner decision" />
        <Counter label="Open findings" value={data.openFindings.length} hint="Rex findings not yet resolved" />
        <Counter label="Verified improvements" value={data.verified.length} hint="Retested and confirmed" />
        <Counter label="Applied search changes" value={data.changes.length} hint="Metadata changes with an audit trail" />
      </div>

      <div className={card}>
        <div className="mb-3 flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-li-infra" />
          <h3 className="text-sm font-bold text-li-carbon">Connected sources and last result</h3>
        </div>
        <div className="space-y-2">
          {data.sources.map((s) => (
            <div key={s.name} className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-li-steel/70 p-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-li-carbon">{s.name}</div>
                <div className="text-[11px] text-li-slate">{s.detail}</div>
                <div className="mt-1 text-xs text-li-carbon">{s.result}</div>
              </div>
              <div className="text-right">
                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_TONE[s.status]}`}>{s.status}</span>
                <div className="mt-1 text-[11px] text-li-slate">{s.stale ? `Stale · last ${fmtDate(s.last)}` : fmtDate(s.last)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={card}>
        <div className="mb-3 flex items-center gap-2">
          <History className="h-4 w-4 text-li-infra" />
          <h3 className="text-sm font-bold text-li-carbon">Recent verified outcomes</h3>
        </div>
        {data.verified.length === 0 ? (
          <p className="text-sm text-li-slate">No improvement has been retested and verified yet.</p>
        ) : (
          <ul className="space-y-2">
            {data.verified.slice(0, 5).map((i) => (
              <li key={i.id} className="rounded-xl border border-li-steel/70 p-3">
                <div className="text-sm font-semibold text-li-carbon">{i.title}</div>
                <div className="text-xs text-li-slate">{i.after_result || "Verification recorded without a measured result."}</div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <button onClick={() => onOpenTab("findings")} className="rounded-lg bg-li-forest px-3 py-1.5 font-semibold text-white">Open findings</button>
          <button onClick={() => onOpenTab("queue")} className="rounded-lg border border-li-steel px-3 py-1.5 font-semibold text-li-carbon">Approval queue</button>
          <Link to="/admin/integrity" className="rounded-lg border border-li-steel px-3 py-1.5 font-semibold text-li-carbon">Integrity detail</Link>
          <Link to="/admin/system" className="rounded-lg border border-li-steel px-3 py-1.5 font-semibold text-li-carbon">System administration</Link>
        </div>
      </div>
    </div>
  );
}