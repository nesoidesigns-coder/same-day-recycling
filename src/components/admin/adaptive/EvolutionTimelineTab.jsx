import { useMemo, useState } from "react";
import { fmtDate, STAGES, buildTimeline, stageOf } from "./adaptiveData";

const card = "rounded-2xl border border-li-steel bg-white p-4";
const STAGE_LABEL = {
  observed: "Observed",
  diagnosed: "Diagnosed",
  proposed: "Proposed",
  approved: "Approved",
  implemented: "Implemented",
  measured: "Measured",
};
const STAGE_TONE = {
  observed: "bg-li-pale text-li-carbon",
  diagnosed: "bg-amber-100 text-[#8f5d00]",
  proposed: "bg-sky-100 text-[#0b4a63]",
  approved: "bg-emerald-100 text-emerald-800",
  implemented: "bg-li-forest text-white",
  measured: "bg-emerald-600 text-white",
};

// Chronological record of what the platform observed, proposed and changed.
// Every row is an event already stored on its source record.
export default function EvolutionTimelineTab({ data }) {
  const rows = useMemo(() => buildTimeline(data), [data]);
  const [stage, setStage] = useState("all");
  const [kind, setKind] = useState("all");
  const kinds = [...new Set(rows.map((r) => r.kind))];
  const filtered = rows.filter((r) => (stage === "all" || stageOf(r.event) === stage) && (kind === "all" || r.kind === kind));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <select value={stage} onChange={(e) => setStage(e.target.value)} className="rounded-lg border border-li-steel bg-white px-3 py-1.5 text-xs text-li-carbon">
          <option value="all">Every stage</option>
          {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="rounded-lg border border-li-steel bg-white px-3 py-1.5 text-xs text-li-carbon">
          <option value="all">Every record type</option>
          {kinds.map((k) => <option key={k} value={k}>{k}</option>)}
        </select>
        <span className="self-center text-xs text-li-slate">{filtered.length} events</span>
      </div>

      {filtered.length === 0 ? (
        <div className={card}><p className="text-sm text-li-slate">No recorded events match this filter.</p></div>
      ) : (
        <ol className="space-y-2">
          {filtered.map((r) => (
            <li key={r.key} className={card}>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STAGE_TONE[stageOf(r.event)]}`}>{STAGE_LABEL[stageOf(r.event)]}</span>
                <span className="text-[11px] font-semibold text-li-slate">{r.kind}</span>
                <span className="text-[11px] text-li-slate">{fmtDate(r.date)}</span>
                <span className="text-[11px] italic text-li-slate">event: {r.event}</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-li-carbon">{r.title || "Untitled record"}</div>
              {r.note && <p className="mt-0.5 text-xs text-li-slate">{r.note}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}