import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Bot, CheckCircle2, XCircle, AlertTriangle, Inbox } from "lucide-react";
import RexOrb from "@/components/rex/RexOrb";

const OUTCOME_STYLE = {
  success: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  escalated: "bg-amber-50 text-amber-700",
  pending: "bg-slate-100 text-slate-600",
};

export default function RexMonitor() {
  const [log, setLog] = useState(null);

  useEffect(() => {
    (async () => {
      const page = await base44.entities.AiActionLog.list({ sort: "-created_date", limit: 100 });
      setLog(page.items || []);
    })().catch(() => setLog([]));
  }, []);

  if (log === null) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200/80 p-6">
        <div className="flex items-center gap-2 text-sm font-bold text-[#102B2A]">
          <Bot className="w-5 h-5 text-[#187B65]" /> Rex AI activity
        </div>
        <p className="text-sm text-slate-400 mt-3">Loading action log…</p>
      </div>
    );
  }

  const ok = log.filter((l) => (l.outcome || "success") === "success");
  const failed = log.filter((l) => l.outcome === "failed");
  const escalated = log.filter((l) => l.outcome === "escalated");
  const queue = [...failed, ...escalated];

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#102B2A]">
          <Bot className="w-5 h-5 text-[#187B65]" /> Rex AI activity
          <RexOrb state={queue.length > 0 ? "attention" : "success"} size={14} showLabel={false} />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">last {log.length} logged actions</span>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1 text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" /> {ok.length} successful</span>
          <span className="flex items-center gap-1 text-red-700"><XCircle className="w-3.5 h-3.5" /> {failed.length} failed</span>
          <span className="flex items-center gap-1 text-amber-700"><AlertTriangle className="w-3.5 h-3.5" /> {escalated.length} escalated</span>
        </div>
      </div>

      {log.length === 0 ? (
        <p className="text-sm text-slate-500 mt-4">No AI actions logged yet. Rex logs every significant action (quotes, bookings, payments, disputes, failures) here automatically.</p>
      ) : (
        <>
          {queue.length > 0 && (
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-amber-700 mb-2">
                <Inbox className="w-4 h-4" /> Human intervention queue ({queue.length})
              </div>
              <ul className="space-y-1.5">
                {queue.slice(0, 5).map((l) => (
                  <li key={l.id} className="text-sm text-amber-900">
                    <span className="font-bold capitalize">{l.outcome}</span> · {l.summary}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <ul className="mt-4 divide-y divide-slate-100">
            {log.slice(0, 15).map((l) => (
              <li key={l.id} className="py-2.5 flex items-start gap-3">
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${OUTCOME_STYLE[l.outcome] || OUTCOME_STYLE.success}`}>
                  {l.outcome || "success"}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#102B2A] break-words">{(l.action || "").replace(/_/g, " ")}</div>
                  <div className="text-xs text-slate-500 break-words">{l.summary}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {(l.created_date || "").replace("T", " ").slice(0, 16)}
                    {l.target_id ? ` · ${l.target_type || "record"}: ${l.target_id}` : ""}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}