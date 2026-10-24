import { useState } from "react";
import { Loader2, Sparkles, ShieldCheck, HelpCircle, ChevronDown, ChevronUp, DollarSign, Ban } from "lucide-react";
import { base44 } from "@/api/base44Client";

const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-CA");
const fmtPct = (v) => (v === null || v === undefined ? "—" : `${v}%`);

const CONFIDENCE_LABEL = { high: "solid sample", medium: "medium sample", low: "small sample", very_low: "very small sample" };

export function FunnelPanel({ window: win }) {
  const funnel = win?.funnel;
  if (!funnel) return null;
  const maxCount = Math.max(...funnel.stages.map((s) => s.count), 0);
  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
      <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">Booking funnel</h2>
      <p className="text-xs text-slate-500 mb-5">Visitor → service exploration → quote request → quote approved → booking confirmed → job completed → payment verified. Cancelled and test records excluded.</p>
      <div className="space-y-3">
        {funnel.stages.map((s, i) => {
          const rate = i > 0 ? funnel.rates[i - 1] : null;
          return (
            <div key={s.key}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-sm font-bold text-[#102B2A]">{s.label}</span>
                <span className="text-sm font-extrabold text-[#187B65]">{s.count.toLocaleString("en-CA")}</span>
              </div>
              <div className="mt-1.5 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-[#187B65]" style={{ width: `${maxCount > 0 ? Math.max((s.count / maxCount) * 100, s.count > 0 ? 2 : 0) : 0}%` }} />
              </div>
              <div className="mt-1 flex flex-wrap justify-between gap-x-3 text-[11px] text-slate-500">
                <span>{s.note}</span>
                {rate && <span>{fmtPct(rate.pct)} step conversion <span className="text-slate-400">({CONFIDENCE_LABEL[rate.confidence]})</span></span>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[11px] text-slate-500">
        Where customers abandon: the largest step-to-step drop-off is visible in the rates above. Rates show "—" instead of a percentage whenever the upstream stage is zero, so no misleading number is displayed.
      </p>
    </div>
  );
}

export function RevenuePanel({ window: win }) {
  const r = win?.revenue;
  if (!r) return null;
  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
      <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4 inline-flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#187B65]" />Revenue intelligence</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#eef4f0] border border-[#187B65]/25 px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#187B65]">Verified revenue</div>
          <div className="mt-1 text-2xl font-extrabold text-[#102B2A]">{money(r.verified_revenue)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Platform-captured + reconciled external</div>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Platform-paid</div>
          <div className="mt-1 text-2xl font-extrabold text-[#102B2A]">{money(r.platform_paid_value)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Processed through Recycling OS</div>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">External, reconciled</div>
          <div className="mt-1 text-2xl font-extrabold text-[#102B2A]">{money(r.external_verified_value)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Cash / e-transfer verified by owner</div>
        </div>
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600">External, pending</div>
          <div className="mt-1 text-2xl font-extrabold text-[#102B2A]">{money(r.external_pending_value)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{r.external_pending_count} job(s) awaiting reconciliation</div>
        </div>
        <div className="col-span-2 rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Platform commissions earned</div>
          <div className="mt-1 text-xl font-extrabold text-[#102B2A]">{money(r.commissions_earned)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">On completed jobs · completed job value {money(r.completed_job_value)}</div>
        </div>
      </div>
      <p className="mt-4 text-[11px] text-slate-500">{r.note}</p>
    </div>
  );
}

export function DataQualityPanel({ report }) {
  const [open, setOpen] = useState(false);
  const dq = report?.data_quality;
  if (!dq) return null;
  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3 text-left">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 inline-flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#187B65]" />Data quality &amp; limitations</h2>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {!open && (
        <p className="mt-2 text-[11px] text-slate-500">
          Legacy (no session key): {dq.legacy_records_all_time.toLocaleString("en-CA")} · Unattributed: {dq.unattributed_records_all_time.toLocaleString("en-CA")} · Unclassified: {dq.unclassified_records_all_time.toLocaleString("en-CA")} — preserved as recorded, labeled rather than filled.
        </p>
      )}
      {open && (
        <div className="mt-4 space-y-3 text-[12px] leading-relaxed text-slate-600">
          <p><span className="font-bold text-slate-800">Preservation:</span> {dq.classification_change_note}</p>
          <p><span className="font-bold text-slate-800">Attribution:</span> {dq.attribution_note}</p>
          <p><span className="font-bold text-slate-800">Definitions:</span> {dq.definitions_note}</p>
          <p><span className="font-bold text-slate-800">Reporting basis:</span> {report.tz_note}</p>
          <p><span className="font-bold text-slate-800">Records in this report:</span> {dq.record_counts ? `${dq.record_counts.visits.toLocaleString("en-CA")} visits · ${dq.record_counts.quote_leads.toLocaleString("en-CA")} quote requests · ${dq.record_counts.bookings.toLocaleString("en-CA")} bookings` : "—"}{dq.truncated ? ` (truncated at caps: ${[dq.truncated.visits && "visits", dq.truncated.quote_leads && "quotes", dq.truncated.bookings && "bookings"].filter(Boolean).join(", ")})` : ""}</p>
          <div>
            <p className="font-bold text-slate-800 mb-1 inline-flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5 text-slate-400" />Standardized definitions</p>
            <ul className="space-y-1">
              {Object.entries(report.definitions || {}).map(([k, v]) => (
                <li key={k}><span className="font-semibold text-slate-700">{k.replace(/_/g, " ")}:</span> {v}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export function AiBusinessMasterPanel() {
  const [state, setState] = useState({ loading: false, insights: null, error: null, at: null });
  const run = async () => {
    setState({ loading: true, insights: null, error: null, at: null });
    try {
      const res = await base44.functions.invoke("trafficIntelligence", {});
      setState({ loading: false, insights: res.data.insights || [], error: null, at: res.data.generated_at });
    } catch (e) {
      setState({ loading: false, insights: null, error: e?.message || "Analysis failed", at: null });
    }
  };
  return (
    <div className="rounded-3xl bg-[#102B2A] text-white p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#54D9AE] inline-flex items-center gap-2"><Sparkles className="w-4 h-4" />AI Business Master analysis</h2>
          <p className="text-xs text-white/60 mt-1 max-w-xl">Analyzes the same verified evidence shown above — never estimated data. Recommendations are labeled as advice and cite real counts.</p>
        </div>
        <button onClick={run} disabled={state.loading} className="inline-flex items-center gap-2 rounded-full bg-[#187B65] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#1e9678] disabled:opacity-50">
          {state.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {state.loading ? "Analyzing…" : "Run analysis"}
        </button>
      </div>
      {state.error && <p role="alert" className="mt-4 rounded-xl bg-red-500/15 border border-red-400/30 px-4 py-3 text-xs text-red-200">{state.error}</p>}
      {state.insights && state.insights.length === 0 && <p className="mt-4 text-xs text-white/60">No insights returned — try again.</p>}
      {state.insights && state.insights.length > 0 && (
        <div className="mt-5 grid md:grid-cols-2 gap-3">
          {state.insights.map((ins, i) => (
            <div key={i} className={`rounded-2xl px-4 py-3 border ${ins.kind === "ai_recommendation" ? "border-[#54D9AE]/30 bg-[#187B65]/15" : "border-white/10 bg-white/5"}`}>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                <span className={ins.kind === "ai_recommendation" ? "text-[#54D9AE]" : "text-white/50"}>{ins.kind === "ai_recommendation" ? "Recommendation (advice)" : "Verified observation"}</span>
              </div>
              <div className="mt-1 text-sm font-bold">{ins.title}</div>
              <p className="mt-1 text-xs text-white/70 leading-relaxed">{ins.detail}</p>
              {ins.evidence && <p className="mt-2 text-[10px] text-white/45 leading-relaxed">Evidence: {ins.evidence}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ExcludedPanel({ window: win }) {
  const o = win?.owner;
  if (!o) return null;
  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
      <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">Tracked separately (excluded from customer metrics)</h2>
      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-4">
          <div className="text-2xl font-extrabold text-slate-600">{o.pageviews.toLocaleString("en-CA")}</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">Owner page views</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{o.sessions.toLocaleString("en-CA")} session(s)</div>
        </div>
        <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-4">
          <div className="text-2xl font-extrabold text-slate-600">{(win.bots?.pageviews || 0).toLocaleString("en-CA")}</div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1">Bot page views</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Crawlers &amp; automated</div>
        </div>
      </div>
      {o.top_paths?.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Owner's most-viewed pages (preserved, never counted as customers)</p>
          <ul className="space-y-1">
            {o.top_paths.map((p) => (
              <li key={p.path} className="flex justify-between gap-3 text-xs text-slate-600"><span className="min-w-0 truncate font-mono">{p.path}</span><span className="text-slate-400">{p.count}</span></li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-4 text-[11px] text-slate-500">Owner testing stays fully tracked for development intelligence and is excluded from every customer conversion rate on this page.</p>
    </div>
  );
}