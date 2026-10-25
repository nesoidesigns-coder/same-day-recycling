import { ExternalLink, Clock, ShieldAlert } from "lucide-react";

const MARKET_LABELS = {
  furniture_appliance_removal: "Furniture & appliance removal",
  moving_downsizing: "Moving & downsizing",
  renovation_construction_debris: "Renovation & construction debris",
  property_management_turnover: "Property management & turnover",
  recycling_specialty_disposal: "Recycling & specialty disposal",
  commercial_office_cleanouts: "Commercial & office cleanouts",
  urgent_same_day: "Urgent & same-day removal",
  donation_reuse_circular: "Donation, reuse & circular economy",
};

const TYPE_BASIS = {
  observed_public_request: "Source-backed public posts — not confirmed bookings",
  search_interest: "Aggregate keyword data — never individual leads",
  market_indicator: "Contextual evidence — not a lead",
  platform_inquiry: "Real Recycling OS inquiries (anonymized)",
  qualified_opportunity: "Owner-reviewed, relevant requests",
  confirmed_booking: "Customer-approved bookings",
};

const fmt = (v) => (v && new Date(v).getTime() ? new Date(v).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "unavailable");

export default function OverviewTab({ feed }) {
  const c = feed.counts;
  return (
    <div className="space-y-7">
      <section>
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-slate-500">Live demand by type — each type is measured separately</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {Object.entries(TYPE_BASIS).map(([type, basis]) => (
            <div key={type} className="rounded-2xl border border-slate-100 bg-[#f6f9f8] p-4">
              <div className="text-3xl font-extrabold text-[#102B2A]">{c.by_type[type] || 0}</div>
              <div className="mt-1 text-sm font-bold text-[#102B2A]">{feed.type_labels[type]}</div>
              <div className="mt-1 text-xs text-slate-500">{basis}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-slate-500">Eight core markets (signals can belong to several)</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(MARKET_LABELS).map(([key, label]) => (
            <span key={key} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${(c.by_market[key] || 0) > 0 ? "border-[#187B65]/50 bg-[#187B65]/10 text-[#0d5c4b]" : "border-slate-200 text-slate-400"}`}>
              {label} · {c.by_market[key] || 0}
            </span>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-slate-500">Top municipalities (supported locations only)</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-sm">
              <thead><tr className="bg-[#f6f9f8] text-left text-xs uppercase tracking-wide text-slate-500"><th className="p-3">City</th><th className="p-3">Signals</th><th className="p-3">High intent</th></tr></thead>
              <tbody>
                {(feed.top_cities || []).slice(0, 10).map((r) => (
                  <tr key={`${r.city}|${r.province_code}`} className="border-t border-slate-100">
                    <td className="p-3 font-bold text-[#102B2A]">{r.city}{r.province_code ? `, ${r.province_code}` : ""}{r.unresolved_nearby && <span className="ml-1 text-xs font-normal text-slate-400">(province-level)</span>}</td>
                    <td className="p-3 text-slate-600">{r.count}</td>
                    <td className="p-3 text-slate-600">{r.high_intent}</td>
                  </tr>
                ))}
                {!feed.top_cities?.length && <tr><td className="p-3 text-slate-400" colSpan={3}>No located signals yet. Location-unresolved signals are never guessed onto the map.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-slate-500">Recent source-backed findings</h2>
          <div className="space-y-2">
            {(feed.findings || []).slice(0, 8).map((s) => (
              <div key={s.id} className="rounded-2xl border border-slate-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-[#102B2A]">{s.title}</p>
                  {s.source_url && <a href={s.source_url} target="_blank" rel="noreferrer" className="shrink-0 text-[#187B65]"><ExternalLink className="h-4 w-4" /></a>}
                </div>
                <p className="mt-1 text-xs text-slate-500">{s.city ? `${s.city}, ${s.province_code}` : "Location unresolved"} · score {s.confidence_score} · {s.market_categories.map((m) => MARKET_LABELS[m] || m).slice(0, 2).join(" · ")}</p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400"><Clock className="h-3 w-3" /> published {fmt(s.source_published_at)} · collected {fmt(s.collected_at)} · via {s.source_platform}</p>
              </div>
            ))}
            {!feed.findings?.length && <p className="text-sm text-slate-400">No recent findings. Run a sync to collect from connected sources.</p>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-[#f6f9f8] border border-slate-100 p-4">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#102B2A]"><ShieldAlert className="h-4 w-4 text-[#187B65]" /> Data honesty</h2>
        <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600">
          {feed.notes.map((n, i) => <li key={i}>{n}</li>)}
          <li>Review queue: {c.review.pending} pending · {c.review.qualified} qualified · {c.review.dismissed} dismissed · Coverage: {c.coverage.covered} covered / {c.coverage.uncovered} uncovered / {c.coverage.unresolved} location-unresolved.</li>
        </ul>
      </section>
    </div>
  );
}