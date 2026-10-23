import { Loader2, ShieldCheck, Sparkles, CheckCircle2, AlertTriangle, Clock, History } from "lucide-react";

const DIMENSIONS = [
  ["seo", "SEO"],
  ["discoverability", "Discoverability"],
  ["reputation", "Reputation"],
  ["credibility", "Credibility"],
  ["positioning", "Positioning"],
];

// Brand Scanner panel: runs the AI scan, shows explainable sub-scores and
// clearly separates verified findings from AI estimates.
export default function BrandScanner({ scan, history, running, onRun }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500">AI Brand Scanner</h2>
        <button
          onClick={onRun}
          disabled={running}
          className="rounded-full bg-[#187B65] text-white font-bold px-4 py-2 text-sm hover:bg-[#125C4E] transition-colors disabled:opacity-60 inline-flex items-center gap-2"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {running ? "Scanning samedayrecycling.ca…" : "Run brand scan"}
        </button>
      </div>

      {!scan ? (
        <p className="text-sm text-slate-600">
          No scan yet. The scanner reads your live site (home, pricing, contact, service pages) and any social URLs you
          add later, scores five dimensions 0–100 with explanations, and keeps every scan for comparison.
        </p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4 mb-5">
            {DIMENSIONS.map(([key, label]) => {
              const s = scan.scores?.[key];
              if (!s) return null;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs font-bold text-[#102B2A] mb-1">
                    <span className="inline-flex items-center gap-1.5">
                      {label}
                      {s.basis === "ai_estimate" && (
                        <span className="rounded-full bg-amber-50 border border-amber-200 px-1.5 text-[9px] uppercase text-amber-700">AI est.</span>
                      )}
                      {s.basis === "verified" && (
                        <span className="rounded-full bg-[#187B65]/10 px-1.5 text-[9px] uppercase text-[#187B65]">Verified</span>
                      )}
                    </span>
                    <span>{Math.round(s.score)}/100</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-[#187B65]" style={{ width: `${Math.max(2, Math.min(100, s.score))}%` }} />
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">{s.explanation}</div>
                </div>
              );
            })}
          </div>

          <p className="text-sm text-slate-700 leading-relaxed">{scan.summary}</p>

          <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm">
            <ListBlock title="Strengths" icon={<CheckCircle2 className="w-3.5 h-3.5 text-[#187B65]" />} items={scan.strengths} />
            <ListBlock title="Weaknesses" icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />} items={scan.weaknesses} />
            <ListBlock title="Opportunities" icon={<Sparkles className="w-3.5 h-3.5 text-[#187B65]" />} items={scan.opportunities} />
          </div>

          {scan.verified_findings?.length > 0 && (
            <div className="mt-4 rounded-2xl bg-[#eef4f0] border border-[#187B65]/25 px-4 py-3 text-xs">
              <div className="font-bold text-[#187B65] uppercase tracking-wider text-[10px] mb-1.5 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified findings (evidence from fetched content)
              </div>
              <ul className="space-y-1 text-[#102B2A]">
                {scan.verified_findings.slice(0, 6).map((f, i) => (
                  <li key={i}><span className="font-semibold">{f.finding}</span> — {f.evidence}</li>
                ))}
              </ul>
            </div>
          )}
          {scan.ai_estimates?.length > 0 && (
            <div className="mt-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs">
              <div className="font-bold text-amber-700 uppercase tracking-wider text-[10px] mb-1.5">AI estimates (not verified against live content)</div>
              <ul className="space-y-1 text-[#102B2A]">
                {scan.ai_estimates.slice(0, 5).map((f, i) => (
                  <li key={i}><span className="font-semibold">{f.finding}</span> — {f.reasoning}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 text-[11px] text-slate-500">
            <Clock className="w-3 h-3 inline mr-1 -mt-0.5" />
            Scanned {String(scan.created_date || "").slice(0, 16).replace("T", " ")} · sources: {(scan.sources || []).map((s) => String(s).replace(/^https?:\/\//, "")).join(", ")}
          </div>
        </>
      )}

      {history.length > 1 && (
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 inline-flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" /> Scan history
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((h) => (
              <span key={h.id} className="rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                {String(h.created_date || "").slice(0, 10)} · {h.overall_score}/100
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ListBlock({ title, icon, items }) {
  return (
    <div className="rounded-2xl bg-[#f4f7f5] border border-slate-100 px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 inline-flex items-center gap-1.5">{icon} {title}</div>
      <ul className="space-y-1 text-xs text-[#102B2A]">
        {(items || []).slice(0, 5).map((it, i) => <li key={i}>• {it}</li>)}
        {(!items || items.length === 0) && <li className="text-slate-400">—</li>}
      </ul>
    </div>
  );
}