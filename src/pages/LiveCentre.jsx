import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, MapPin, Activity, DollarSign, Recycle, Users, ArrowRight, Compass, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useSEO } from "@/lib/seo";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import { REGIONS } from "@/lib/regions";
import { CITIES } from "@/lib/cities";
import { LIVE_CATEGORIES } from "@/lib/liveCategories";
import IntelligencePreview from "@/components/home/IntelligencePreview";
import ActivityGauge from "@/components/live/ActivityGauge";
import LiveActivityMap from "@/components/live/LiveActivityMap";
import LiveCommunityFeed from "@/components/live/LiveCommunityFeed";
import RexPriceCompare from "@/components/home/RexPriceCompare";

const DAY_OPTIONS = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
  { value: 365, label: "Last 12 months" },
];

// Same Day Recycling LIVE — the public intelligence destination. Real records
// only, progressive disclosure, no account needed. Rex stays available as a
// supporting assistant, never the centrepiece.
export default function LiveCentre() {
  useSEO({
    title: "Same Day Recycling LIVE | Canadian Service Intelligence Centre",
    description: "Explore national service activity, demand observations, verified contractor coverage, pricing intelligence and community requests across Canada. Free to explore — no account needed.",
    path: "/live",
  });
  const cov = useCoverageStatus();
  const [filters, setFilters] = useState({ province: "", city: "", category: "", days: 30 });
  const [gauge, setGauge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const regionName = (code) => REGIONS.find((r) => r.code === code)?.name || "";

  const provinceCityOptions = useMemo(() => {
    const target = regionName(filters.province);
    return CITIES.filter((c) => !filters.province || String(c.province || "") === target);
  }, [filters.province]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    base44.functions.invoke("liveIntelligence", {
      action: "gauge",
      days: filters.days,
      province: filters.province,
      city: filters.city,
      category: filters.category,
    })
      .then((res) => {
        if (!alive) return;
        setGauge(res.data);
        setError(false);
      })
      .catch(() => alive && setError(true));
    return () => { alive = false; };
  }, [filters]);

  const setFilter = (key) => (e) =>
    setFilters((f) => ({ ...f, [key]: e.target.value, ...(key !== "city" && key !== "days" ? { city: "" } : {}) }));

  const pickCategory = (key) => setFilters((f) => ({ ...f, category: f.category === key ? "" : key }));

  const refreshedAt = gauge?.generated_at ? new Date(gauge.generated_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : null;
  const matchingCities = cov.matchingCityNames || [];
  const recruitingCities = cov.matchingCityNames ? (cov.territoryLinks, null) : null;

  return (
    <div className="min-h-screen bg-warm-white pb-16">
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-[#187B65]">← Back to home</Link>

        <div className="mt-5 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#187B65]/10 px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-[#187B65] uppercase">
            <Compass className="w-3.5 h-3.5" /> Same Day Recycling LIVE
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-[#102B2A]">
            Explore What's Happening Across Canada.
          </h1>
          <p className="mt-3 text-lg text-slate-600 leading-relaxed">
            Discover local service demand, compare pickup options, explore recycling information, and find help when you need it.
          </p>
          <p className="mt-2 text-sm font-bold text-[#187B65]">Free to explore — no account needed.</p>
        </div>

        {/* Data freshness indicator */}
        <div className="mt-4 rounded-2xl bg-white border border-slate-200 px-4 py-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5 font-bold text-slate-600">
            <Clock className="w-3.5 h-3.5" />
            {refreshedAt ? `Demand intelligence refreshed ${refreshedAt}` : "Loading demand intelligence…"}
          </span>
          <span className="mt-1 block">
            Sources: verified service requests (platform records) · contractor coverage (verified partner territories) · market signals (external observations, source-labelled) · demand figures are record counts, never live traffic.
          </span>
        </div>
      </div>

      {/* Top: national activity overview */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <SectionHead title="National Activity Overview" note="National totals, last 30 days. The filters below apply to the map, gauge and trend.">
          <IntelligencePreview />
        </SectionHead>

        {/* Filters */}
        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <label className="text-xs font-bold text-slate-500">
              Province
              <select value={filters.province} onChange={setFilter("province")} className="input mt-1">
                <option value="">All Canada</option>
                {REGIONS.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-500">
              City
              <select value={filters.city} onChange={setFilter("city")} className="input mt-1" disabled={!filters.province}>
                <option value="">All cities</option>
                {provinceCityOptions.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-500">
              Service category
              <select value={filters.category} onChange={setFilter("category")} className="input mt-1">
                <option value="">All categories</option>
                {Object.entries(LIVE_CATEGORIES).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-500">
              Reporting period
              <select value={filters.days} onChange={setFilter("days")} className="input mt-1">
                {DAY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          </div>
        </div>

        {/* Middle: map + demand gauge + trend */}
        <SectionHead title="Service Activity Across Canada" note="Verified coverage plus observed demand, filtered by your selection above.">
          <LiveActivityMap cities={gauge?.cities || []} coverageCities={cov.verifiedCityNames || []} />
        </SectionHead>

        <SectionHead title="National Demand Composition" note="Tap a segment or row to focus on one service category.">
          {error ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 text-sm text-slate-500">Live demand intelligence is unavailable right now. Please try again shortly.</div>
          ) : (
            <ActivityGauge data={gauge} loading={loading} selected={filters.category} onSelectCategory={pickCategory} />
          )}
        </SectionHead>

        <SectionHead title="Service-Interest Trend" note="Demand observations per month, matching the filters above.">
          {error ? null : gauge && gauge.trend && gauge.trend.length >= 2 ? (
            <TrendBars trend={gauge.trend} />
          ) : (
            <p className="rounded-2xl bg-white border border-slate-200 p-5 text-sm text-slate-500">Not enough history to show a trend yet. Observations accumulate over time — nothing here is estimated.</p>
          )}
        </SectionHead>

        <SectionHead title="Community Requests" note="Recent public posts from Canadians — moderated, personal details never shown.">
          <LiveCommunityFeed />
        </SectionHead>

        {/* Bottom: pricing, resources, opportunities, participation */}
        <div className="mt-10 grid md:grid-cols-2 gap-5">
          <section className="rounded-2xl bg-white border border-slate-200 p-5">
            <h2 className="flex items-center gap-2 font-bold text-[#102B2A]"><DollarSign className="w-4 h-4 text-[#187B65]" /> Pricing Intelligence</h2>
            <p className="mt-1 text-sm text-slate-600">Published rates and sourced public prices — advertised starting prices clearly separated from approved final prices.</p>
            <div className="mt-3"><RexPriceCompare /></div>
          </section>

          <section className="rounded-2xl bg-white border border-slate-200 p-5">
            <h2 className="flex items-center gap-2 font-bold text-[#102B2A]"><Recycle className="w-4 h-4 text-[#187B65]" /> Recycling Resources</h2>
            <p className="mt-1 text-sm text-slate-600">Where materials really go, with cited sources and location-aware guidance.</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-[#187B65]">
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/recycling-centers">Recycling centre directory <ArrowRight className="w-3.5 h-3.5" /></Link></li>
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/recycling-assistant">Disposal advisor <ArrowRight className="w-3.5 h-3.5" /></Link></li>
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/demand">Full market intelligence <ArrowRight className="w-3.5 h-3.5" /></Link></li>
            </ul>
          </section>

          <section className="rounded-2xl bg-white border border-slate-200 p-5">
            <h2 className="flex items-center gap-2 font-bold text-[#102B2A]"><MapPin className="w-4 h-4 text-[#187B65]" /> Regional Service Opportunities</h2>
            <p className="mt-1 text-sm text-slate-600">Cities actively matching requests or welcoming new contractors — from verified coverage records.</p>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Open matching activity</div>
                {cov.loaded ? (
                  matchingCities.length ? <p className="mt-1 text-slate-700">{matchingCities.join(", ")}</p> : <p className="mt-1 text-slate-500">No cities currently awaiting contractor matches.</p>
                ) : <LoadingLine />}
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Recruiting new contractors</div>
                {cov.loaded ? (
                  (cov.matchingCityNames || []).length || true ? (
                    <p className="mt-1 text-slate-700">{(cov.territoryLinks, cov.matchingCityNames, (cov.totals, (cov.capacityFor, null))) ? "" : ""}{(recruitingText(cov))}</p>
                  ) : null
                ) : <LoadingLine />}
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white border border-slate-200 p-5">
            <h2 className="flex items-center gap-2 font-bold text-[#102B2A]"><Users className="w-4 h-4 text-[#187B65]" /> Get Involved</h2>
            <p className="mt-1 text-sm text-slate-600">Use the platform as a customer — every verified interaction improves national service intelligence.</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-[#187B65]">
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/community">Community & requests <ArrowRight className="w-3.5 h-3.5" /></Link></li>
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/request-service">Request a pickup <ArrowRight className="w-3.5 h-3.5" /></Link></li>
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/move-assist">Plan a moving cleanout <ArrowRight className="w-3.5 h-3.5" /></Link></li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function recruitingText(cov) {
  const cities = Array.from(cov.matchingCities || []);
  const recruiting = (cov.totals ? null : null) || null;
  return cities.length ? "" : "";
}

function LoadingLine() {
  return <p className="mt-1 flex items-center gap-1.5 text-slate-500"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading coverage records…</p>;
}

function SectionHead({ title, note, children }) {
  return (
    <section className="mt-8">
      <h2 className="font-bold text-lg text-[#102B2A]">{title}</h2>
      {note && <p className="mt-0.5 text-xs text-slate-500 mb-3">{note}</p>}
      {children}
    </section>
  );
}

function TrendBars({ trend }) {
  const max = Math.max(...trend.map((t) => t.count), 1);
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5">
      <div className="flex items-end gap-2 h-40">
        {trend.map((t) => (
          <div key={t.month} className="flex-1 flex flex-col items-center justify-end gap-1.5 min-w-0">
            <span className="text-xs font-bold text-[#102B2A] tabular-nums">{t.count}</span>
            <div className="w-full max-w-10 rounded-t-lg bg-[#187B65]" style={{ height: `${Math.max(4, (t.count / max) * 100)}%` }} aria-hidden="true" />
            <span className="text-[10px] text-slate-500 truncate w-full text-center">{t.month}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-slate-400">Counts of verified demand records per month. Search interest appears only as its own labelled record type — never as request volume.</p>
    </div>
  );
}