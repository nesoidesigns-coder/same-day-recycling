import { useState } from "react";
import { Loader2, RefreshCw, AlertTriangle, Lock, TrendingUp, BarChart3, Users, HeartHandshake, Wrench } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Owner Intelligence Center — the unified dashboard inside Recycling OS
// administration. Renders the latest Rex briefing produced by the unified
// intelligence engine (market, acquisition, contractor, customer experience,
// operations), with prioritized recommendations and clearly labeled forecasts.
// Market figures are nationwide demand; company performance is separate.
const MODULE_ICONS = {
  market: TrendingUp,
  acquisition: BarChart3,
  contractor: Users,
  customer_experience: HeartHandshake,
  operations: Wrench,
};
const MODULE_LABELS = {
  market: "Market Intelligence",
  acquisition: "Customer Acquisition",
  contractor: "Contractor Intelligence",
  customer_experience: "Customer Experience",
  operations: "Operational Intelligence",
};
const PRIORITY_STYLES = {
  highest: "bg-[#187B65] text-white",
  high: "bg-[#187B65]/15 text-[#187B65]",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-slate-100 text-slate-600",
};
const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-CA");
const sigCount = (v) => (v === null || v === undefined ? "—" : v);

function ModuleCard({ name, data }) {
  const Icon = MODULE_ICONS[name] || Wrench;
  const unavailable = !data || data.unavailable;
  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-[#102B2A]">
        <Icon className="w-4 h-4 text-[#187B65]" /> {MODULE_LABELS[name] || name}
      </div>
      {unavailable ? (
        <p className="mt-2 text-xs text-slate-500">Not connected in this run — no substitute estimate is shown.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          {name === "market" && data.national && (
            <>
              <li><b>National demand ({data.latest_period}):</b> {data.national.available ? `${sigCount(data.national.value)} ${data.national.measure || ""}` : "not backfilled yet"}</li>
              <li><b>Rising terms:</b> {(data.rising_terms || []).map((r) => r.keyword).join(", ") || "—"}</li>
              <li><b>Top regions:</b> {(data.regional || []).map((r) => `${r.name} (${sigCount(r.value)})`).join(", ") || "—"}</li>
            </>
          )}
          {name === "acquisition" && (
            <>
              <li><b>Search Console (28d):</b> {data.search_console?.connected ? `clicks ${sigCount(data.search_console.totals_28d?.clicks)} · impressions ${sigCount(data.search_console.totals_28d?.impressions)}` : "not connected"}</li>
              <li><b>Quote → booking rate (30d):</b> {data.funnel_30d?.rates?.lead_to_booking_pct ?? "—"}%</li>
              <li><b>Visits → quotes:</b> {data.funnel_30d?.rates?.visit_to_lead_pct ?? "—"}%</li>
            </>
          )}
          {name === "contractor" && (
            <>
              <li><b>Verified provider cities:</b> {sigCount(data.coverage?.verified_cities)} · matching: {sigCount(data.coverage?.matching_cities)}</li>
              <li><b>Active partners:</b> {(data.active_partners || []).length}</li>
              <li><b>Requests awaiting a contractor:</b> {sigCount(data.requests_awaiting_contractor)}</li>
            </>
          )}
          {name === "customer_experience" && (
            <>
              <li><b>Uncontacted quote leads:</b> {sigCount(data.fresh_quotes_uncontacted)}</li>
              <li><b>New bookings awaiting contact:</b> {sigCount(data.new_bookings_awaiting_contact)}</li>
              <li><b>Ratings ≤3 stars on file:</b> {(data.low_ratings || []).length}</li>
            </>
          )}
          {name === "operations" && (
            <>
              <li><b>Outstanding transactions:</b> {data.outstanding_transactions?.count ?? "—"} ({money(data.outstanding_transactions?.total)})</li>
              <li><b>Rex actions failed/escalated:</b> {(data.rex_actions_failed_or_escalated || []).length}</li>
              <li><b>Rex successful actions (total):</b> {sigCount(data.rex_actions_success_total)}</li>
            </>
          )}
        </ul>
      )}
    </div>
  );
}

export default function OwnerIntelligenceCenter() {
  const [latest, setLatest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const page = await base44.entities.IntelligenceBriefing.list({ sort: "-created_date", limit: 1 });
      setLatest((page.items || [])[0] || null);
    } finally {
      setLoading(false);
    }
  };
  useState(() => { load(); }, []);
  const run = async () => {
    setRunning(true);
    setError("");
    try {
      await base44.functions.invoke("ownerIntelligence", { triggered_by: "manual" });
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "The intelligence run failed.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-[#102B2A]">Owner Intelligence Center</h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            One coordinated Rex briefing across market demand, acquisition, contractors, customer experience and operations.
            Market figures are nationwide demand; company performance is reported separately. Forecasts are labeled predictions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading} className="p-2.5 rounded-full bg-white border border-slate-200 hover:border-[#187B65] transition-colors" aria-label="Refresh briefing">
            <RefreshCw className={`w-4 h-4 text-[#102B2A] ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={run} disabled={running} className="inline-flex items-center gap-2 rounded-full bg-[#187B65] px-4 py-2 text-sm font-bold text-white hover:bg-[#126a56] transition-colors disabled:opacity-60">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {running ? "Rex is analyzing…" : "Run Rex briefing"}
          </button>
        </div>
      </div>

      {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</p>}
      {loading && !latest && <p className="py-6 text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Loading briefing…</p>}

      {latest && (
        <div className="mt-4 space-y-4">
          <p className="text-[11px] text-slate-500">
            Briefing of {latest.run_date} · {latest.triggered_by === "scheduled" ? "daily automation" : "manual run"}
          </p>
          <div className="rounded-2xl bg-[#f4f7f5] border border-slate-100 p-4 text-sm leading-relaxed text-[#102B2A]">
            {latest.summary || "Rex did not produce a summary for this run."}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(latest.modules || {}).map(([name, data]) => <ModuleCard key={name} name={name} data={data} />)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#102B2A]">Recommended actions (highest first)</h3>
            <ul className="mt-2 space-y-2">
              {(latest.recommendations || []).length === 0 && <li className="text-xs text-slate-500">No recommendations in this run.</li>}
              {(latest.recommendations || []).map((r, i) => (
                <li key={i} className="rounded-xl border border-slate-200/70 bg-white p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${PRIORITY_STYLES[r.priority] || "bg-slate-100 text-slate-600"}`}>{r.priority}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{MODULE_LABELS[r.module] || r.module}</span>
                    {r.needs_authorization && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800"><Lock className="w-3 h-3" />needs your authorization</span>}
                  </div>
                  <p className="mt-1.5 text-sm font-semibold text-[#102B2A]">{r.action}</p>
                  <p className="text-xs text-slate-500">{r.rationale}</p>
                </li>
              ))}
            </ul>
          </div>
          {(latest.forecasts || []).length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-[#102B2A]">Forecasts <span className="font-normal text-xs text-slate-500">(predictions — not confirmed bookings or guaranteed revenue)</span></h3>
              <ul className="mt-2 space-y-2">
                {latest.forecasts.map((f, i) => (
                  <li key={i} className="rounded-xl border border-slate-200/70 bg-[#f4f7f5] p-3 text-xs">
                    <p className="flex items-center gap-1.5 font-bold text-[#102B2A]"><TrendingUp className="w-3.5 h-3.5 text-[#187B65]" />{f.label} <span className="font-normal text-slate-500">· confidence: {f.confidence} · data period: {f.data_period}</span></p>
                    <p className="mt-1 text-slate-600">{f.prediction}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {!loading && !latest && (
        <p className="mt-4 flex items-center gap-2 text-sm text-slate-500"><AlertTriangle className="w-4 h-4 text-amber-500" />No briefing yet — run one to connect the five intelligence modules.</p>
      )}
    </div>
  );
}