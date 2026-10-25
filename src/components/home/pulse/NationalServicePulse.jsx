import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import PulseRing from "./PulseRing";
import { pulseIndex, trendDirection, freshness, CATEGORY_LABELS } from "./serviceCatalog";

const PROVINCES = [
  ["", "All of Canada"], ["BC", "British Columbia"], ["AB", "Alberta"], ["SK", "Saskatchewan"],
  ["MB", "Manitoba"], ["ON", "Ontario"], ["QC", "Quebec"], ["NB", "New Brunswick"],
  ["NS", "Nova Scotia"], ["PE", "Prince Edward Island"], ["NL", "Newfoundland"],
];

const scope = { days: undefined, province: "", city: "", category: "" };

// Gauge A — Canadian Service Pulse: normalized 0-100 national activity index
// across every monitored service category, with drill-down by province, city
// and category. Index = last-7-day signals ÷ average weekly volume over the
// trailing 90 days (capped at 100). Same liveIntelligence signal engine the
// admin observatory uses.
export default function NationalServicePulse() {
  const [scopeState, setScopeState] = useState(scope);
  const { days, province, city, category } = scopeState;
  const [data, setData] = useState({ 7: null, 30: null, 90: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const base = { province, city, category };
    Promise.allSettled(
      [7, 30, 90].map((d) => base44.functions.invoke("liveIntelligence", { action: "gauge", days: d, ...base }))
    ).then((results) => {
      if (!alive) return;
      const next = {};
      [7, 30, 90].forEach((d, i) => {
        const p = results[i];
        next[d] = p.status === "fulfilled" ? (p.value?.data ?? p.value) : null;
      });
      setData(next);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [province, city, category]);

  const c7 = data[7]?.total ?? 0;
  const c30 = data[30]?.total ?? 0;
  const c90 = data[90]?.total ?? 0;
  const index = pulseIndex(c7, c90);
  const trend = trendDirection(c7, c30);
  const rows = data[90]?.rows || [];
  const cityOptions = data[90]?.cities || [];
  const fresh = freshness(data[90]?.generated_at);
  const scopeLabel = [
    province ? PROVINCES.find(([p]) => p === province)?.[1] : "Canada",
    city || null,
    category ? CATEGORY_LABELS[category] : null,
  ].filter(Boolean).join(" · ");

  const selectCls =
    "min-h-[44px] rounded-xl border border-white/15 bg-white/[0.08] px-3 py-2 text-sm font-semibold text-white focus:border-white/40 focus:outline-none";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr] items-start">
      <PulseRing
        tone="dark"
        title="Canadian Service Pulse"
        subtitle={scopeLabel}
        index={index}
        trend={trend}
        freshness={fresh}
        loading={loading}
        methodology="Activity index = verified demand signals recorded in the last 7 days ÷ their average weekly volume over the trailing 90 days, capped at 100. Public request posts, platform inquiries, confirmed bookings and search interest are counted by type and labelled separately — never blended into one number. This measures only the signals this platform can legitimately observe, not every Canadian search or online service request."
        source="Recycling OS signal engine (same engine as the admin observatory)"
        coverage={`Trailing 90 days · ${c90} observed signals${province ? ` · ${PROVINCES.find(([p]) => p === province)?.[1]}` : " · all provinces"}`}
      >
        {/* Category mix */}
        {rows.length > 0 && (
          <div className="space-y-1.5">
            <div className="font-plex text-[10px] font-semibold uppercase tracking-wider text-white/50">Activity by category</div>
            {rows.slice(0, 4).map((r) => (
              <button
                key={r.key}
                onClick={() => setScopeState((s) => ({ ...s, category: s.category === r.key ? "" : r.key }))}
                className="w-full text-left focus:outline-none focus:ring-2 focus:ring-white/40 rounded-md"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`text-xs font-semibold ${category === r.key ? "text-white" : "text-white/70"}`}>{CATEGORY_LABELS[r.key] || r.key}</span>
                  <span className="font-plex text-xs text-white/70 tabular-nums">{r.count}</span>
                </div>
                <div className="mt-0.5 h-1.5 rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-[#2FD9C8] transition-all duration-700 motion-reduce:transition-none" style={{ width: `${Math.max(3, Math.round((r.count / Math.max(1, c90)) * 100))}%` }} />
                </div>
              </button>
            ))}
          </div>
        )}
      </PulseRing>

      {/* Drill-down controls */}
      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 md:p-7">
        <h3 className="text-lg font-bold text-white">Drill down</h3>
        <p className="mt-1 text-sm text-white/60">Narrow the pulse to a province, city or service category. The gauge and every number update instantly.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <select aria-label="Province" value={province} onChange={(e) => setScopeState((s) => ({ ...s, province: e.target.value, city: "" }))} className={selectCls}>
            {PROVINCES.map(([code, label]) => <option key={code} value={code} className="text-li-carbon">{label}</option>)}
          </select>
          <select aria-label="City" value={city} onChange={(e) => setScopeState((s) => ({ ...s, city: e.target.value }))} className={selectCls}>
            <option value="" className="text-li-carbon">All cities</option>
            {cityOptions.map((c) => <option key={c.city} value={c.city} className="text-li-carbon">{c.city} ({c.count})</option>)}
          </select>
          <select aria-label="Category" value={category} onChange={(e) => setScopeState((s) => ({ ...s, category: e.target.value }))} className={selectCls}>
            <option value="" className="text-li-carbon">All categories</option>
            {rows.map((r) => <option key={r.key} value={r.key} className="text-li-carbon">{CATEGORY_LABELS[r.key] || r.key}</option>)}
          </select>
        </div>

        <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            ["Last 7 days", c7],
            ["Last 30 days", c30],
            ["Last 90 days", c90],
          ].map(([label, n]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.06] px-2 py-4">
              <dt className="font-plex text-[10px] font-semibold uppercase tracking-wider text-white/50">{label}</dt>
              <dd className="mt-1 font-plex text-2xl font-bold text-white tabular-nums">{loading ? "…" : n}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-5 border-t border-white/10 pt-4 text-[11px] leading-relaxed text-white/50">
          Counts include only observations this platform can legitimately access and verify: public request posts
          (with attribution), first-party inquiries and bookings, and labelled search-interest records. Records with
          an unresolved location are never assigned to a city or province. If there are no signals yet for a selection,
          the gauge reports "Awaiting verified signals" instead of a zero.
        </p>
      </div>
    </div>
  );
}