import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, MapPin, Tag } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PulseRing from "./PulseRing";
import { SERVICES, ACTIONABLE_TYPES, TYPE_LABELS, pulseIndex, trendDirection, freshness } from "./serviceCatalog";

// Gauge B — Recycling OS Opportunity Pulse: a normalized 0-100 index built only
// from actionable signals (observed public requests, platform inquiries and
// confirmed bookings) in platform-relevant service categories. Selecting a
// service shows its matching signals, guidance, pricing and coverage paths.
export default function OpportunityPulse() {
  const [service, setService] = useState("Junk removal");
  const [data, setData] = useState({ 7: null, 30: null, 90: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.allSettled(
      [7, 30, 90].map((d) => base44.functions.invoke("liveIntelligence", { action: "gauge", days: d }))
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
  }, []);

  const actionable = (d) => {
    const rows = data[d]?.rows || [];
    let n = 0;
    rows.forEach((r) => {
      if (!SERVICES.find((s) => s.name === service).cats.includes(r.key)) return;
      Object.entries(r.demand_types || {}).forEach(([t, c]) => { if (ACTIONABLE_TYPES.includes(t)) n += c; });
    });
    return n;
  };
  const typeMix = () => {
    const rows = data[90]?.rows || [];
    const mix = {};
    rows.forEach((r) => {
      if (!SERVICES.find((s) => s.name === service).cats.includes(r.key)) return;
      Object.entries(r.demand_types || {}).forEach(([t, c]) => { mix[t] = (mix[t] || 0) + c; });
    });
    return mix;
  };

  const svc = SERVICES.find((s) => s.name === service);
  const c7 = actionable(7), c30 = actionable(30), c90 = actionable(90);
  const index = pulseIndex(c7, c90);
  const trend = trendDirection(c7, c30);
  const mix = typeMix();
  const fresh = freshness(data[90]?.generated_at);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr] items-start">
      <PulseRing
        title="Opportunity Pulse"
        subtitle={service}
        index={index}
        trend={trend}
        freshness={fresh}
        loading={loading}
        methodology="Opportunity index = actionable signals (observed public requests, platform inquiries and confirmed bookings) in the last 7 days ÷ their average weekly volume over the trailing 90 days, capped at 100. Search interest is deliberately excluded from this index and appears only as its own labelled signal type. Estimating future demand from it would be speculation, so it never is."
        source="Recycling OS signal engine (same engine as the admin observatory)"
        coverage={`Trailing 90 days · ${c90} actionable signals for ${service.toLowerCase()} categories`}
      >
        <div className="space-y-1.5">
          <div className="font-plex text-[10px] font-semibold uppercase tracking-wider text-li-slate">Signals by type · 90 days</div>
          {Object.keys(TYPE_LABELS).filter((t) => mix[t]).length ? (
            Object.keys(TYPE_LABELS).filter((t) => mix[t]).map((t) => (
              <div key={t}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-li-carbon">{TYPE_LABELS[t]}</span>
                  <span className="font-plex text-xs text-li-infra tabular-nums">{mix[t]}</span>
                </div>
                <div className="mt-0.5 h-1.5 rounded-full bg-li-pale">
                  <div className="h-full rounded-full bg-li-infra transition-all duration-700 motion-reduce:transition-none" style={{ width: `${Math.max(3, Math.round((mix[t] / Math.max(1, c90)) * 100))}%` }} />
                </div>
              </div>
            ))
          ) : (
            <p className="text-[11px] text-li-slate">No actionable signals recorded for this service yet — the gauge reports that instead of showing a zero.</p>
          )}
        </div>
      </PulseRing>

      {/* Service selector + matching information */}
      <div className="rounded-[24px] border border-li-steel bg-white p-5 md:p-7">
        <h3 className="text-lg font-bold text-li-carbon">Select a service</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {SERVICES.map((s) => (
            <button
              key={s.name}
              onClick={() => setService(s.name)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                service === s.name ? "border-li-forest bg-li-forest text-white" : "border-li-steel bg-li-cloud text-li-carbon hover:border-li-infra"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-li-cloud border border-li-steel p-5">
          <p className="text-sm text-li-slate">{svc.blurb}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link to="/pricing" className="flex items-center gap-3 rounded-xl border border-li-steel bg-white p-4 hover:border-li-infra transition-colors">
              <Tag className="w-5 h-5 text-li-infra shrink-0" />
              <span className="text-sm font-bold text-li-carbon">See pricing guidance<span className="block text-xs font-medium text-li-slate">Transparent rates, before you book</span></span>
            </Link>
            <Link to="/coverage" className="flex items-center gap-3 rounded-xl border border-li-steel bg-white p-4 hover:border-li-infra transition-colors">
              <MapPin className="w-5 h-5 text-li-infra shrink-0" />
              <span className="text-sm font-bold text-li-carbon">Check availability<span className="block text-xs font-medium text-li-slate">Verified coverage by city</span></span>
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-li-slate">
            <CheckCircle2 className="w-4 h-4 text-li-infra" /> Estimates are preliminary; final pricing is confirmed before any job.
          </div>
        </div>

        <Link to="/request-service" className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-[14px] bg-li-infra px-6 font-bold text-white hover:bg-li-forest transition-colors">
          Book {service.toLowerCase()} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}