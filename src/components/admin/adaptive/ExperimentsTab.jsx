import { useMemo } from "react";
import { Info } from "lucide-react";
import { buildExperiments, fmtDate } from "./adaptiveData";

const card = "rounded-2xl border border-li-steel bg-white p-4";

// Did the change actually help? Only records with a stored before/after reading
// appear here, and each states its own evidence basis so correlation is never
// presented as proven cause.
export default function ExperimentsTab({ data }) {
  const rows = useMemo(() => buildExperiments(data), [data]);

  return (
    <div className="space-y-4">
      <div className={`${card} flex items-start gap-3`}>
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-li-infra" />
        <p className="text-xs text-li-slate">
          A change is only counted as measured when a post-change reading was actually recorded. Records without one say so. Search Console comparisons are shown as correlation: other factors may contribute.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className={card}><p className="text-sm text-li-slate">No before-and-after measurements have been recorded yet.</p></div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((r) => (
            <div key={r.id} className={card}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${r.verified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-[#8f5d00]"}`}>
                  {r.verified ? "Measured" : "Not measured"}
                </span>
                <span className="text-[11px] text-li-slate">{fmtDate(r.date)}</span>
              </div>
              <div className="mt-2 text-sm font-semibold text-li-carbon">{r.title}</div>
              <div className="mt-1 text-[11px] text-li-slate">Success metric: {r.metric}</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-li-steel/70 p-2">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-li-slate">Before</div>
                  <div className="mt-0.5 text-xs text-li-carbon">{r.before}</div>
                </div>
                <div className="rounded-xl border border-li-steel/70 p-2">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-li-slate">After</div>
                  <div className="mt-0.5 text-xs text-li-carbon">{r.after}</div>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-li-slate">{r.basis}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}