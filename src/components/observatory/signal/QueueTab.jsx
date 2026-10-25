import { useState } from "react";
import { ExternalLink, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const MARKET_LABELS = {
  furniture_appliance_removal: "Furniture/appliance", moving_downsizing: "Moving/downsizing",
  renovation_construction_debris: "Renovation debris", property_management_turnover: "Property turnover",
  recycling_specialty_disposal: "Recycling/specialty", commercial_office_cleanouts: "Commercial cleanout",
  urgent_same_day: "Urgent/same-day", donation_reuse_circular: "Donation/reuse",
};

// High-intent opportunity queue. Every item is source-linked and explains its
// score. Qualifying never contacts anyone: outreach and marketing remain
// owner-initiated actions after review.
export default function QueueTab({ feed, onRefresh }) {
  const [busy, setBusy] = useState("");
  const [notes, setNotes] = useState({});
  const queue = feed.queue || [];

  const decide = async (id, decision) => {
    setBusy(id);
    try {
      await base44.functions.invoke("demandSignalEngine", { action: "review", id, decision, note: notes[id] || "" });
      await onRefresh();
    } finally {
      setBusy("");
    }
  };

  if (!queue.length) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-[#f6f9f8] p-6 text-sm text-slate-500">
        The queue is empty. Requests enter here when their opportunity score reaches {feed.settings?.queue_threshold ?? 60} and they carry a supported location. No unverified demand is queued.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Owner review precedes any outreach or marketing action. Public requests are never converted into bookings without customer consent through Recycling OS.</p>
      {queue.map((s) => (
        <div key={s.id} className="rounded-2xl border border-slate-100 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#102B2A]">{s.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {s.city ? `${s.city}, ${s.province_code}` : "Location unresolved"} · {feed.type_labels[s.demand_type]} · urgency: {s.urgency} · intent: {s.commercial_intent} · coverage: {s.coverage_status}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {s.market_categories.map((m) => <span key={m} className="rounded-full bg-[#187B65]/10 px-2 py-0.5 text-[10px] font-bold text-[#0d5c4b]">{MARKET_LABELS[m] || m}</span>)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-[#187B65]">{s.confidence_score}</div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">opportunity score</div>
            </div>
          </div>
          <p className="mt-2 rounded-xl bg-[#f6f9f8] p-2 text-[11px] text-slate-600"><strong>Why this score:</strong> {s.score_explanation}</p>
          <p className="mt-1 text-[11px] text-slate-500"><strong>Recommended:</strong> {s.recommended_action}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">published {fmtD(s.source_published_at)} · collected {fmtD(s.collected_at)} · via {s.source_platform}{s.source_url && <> · <a href={s.source_url} target="_blank" rel="noreferrer" className="text-[#187B65] underline">original source <ExternalLink className="inline h-3 w-3" /></a></>}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input value={notes[s.id] || ""} onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })} placeholder="Review note (optional)" className="min-h-9 flex-1 rounded-lg border border-slate-200 px-3 text-xs" />
            <button onClick={() => decide(s.id, "qualified")} disabled={busy === s.id} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-[#187B65] px-3 text-xs font-bold text-white disabled:opacity-60">
              {busy === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Qualify
            </button>
            <button onClick={() => decide(s.id, "dismissed")} disabled={busy === s.id} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 disabled:opacity-60">
              <XCircle className="h-4 w-4" /> Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

const fmtD = (v) => (v && new Date(v).getTime() ? new Date(v).toLocaleDateString("en-CA", { month: "short", day: "numeric" }) : "unavailable");