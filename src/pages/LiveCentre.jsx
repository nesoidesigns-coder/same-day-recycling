import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, MapPin, DollarSign, Recycle, Users, ArrowRight, Compass, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useSEO } from "@/lib/seo";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import { REGIONS } from "@/lib/regions";
import { CITIES } from "@/lib/cities";
import { LIVE_CATEGORIES } from "@/lib/liveCategories";
import LiveActivityMap from "@/components/live/LiveActivityMap";
import LiveCommunityFeed from "@/components/live/LiveCommunityFeed";
import RexPriceCompare from "@/components/home/RexPriceCompare";
import NationalRadar from "@/components/live/NationalRadar";
import ServiceSearch from "@/components/live/ServiceSearch";
import InsightPanel from "@/components/live/InsightPanel";
import HowItWorks from "@/components/live/HowItWorks";

const DAY_OPTIONS = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
  { value: 365, label: "Last 12 months" },
];

// Same Day Recycling LIVE — the public intelligence destination. One shared
// filter state drives the radar, the geographic intelligence and the insight
// panel. Real records only, honest empty states, no account needed.
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

  const pickCategory = (key) => {
    if (key) base44.analytics.track({ eventName: "live_category_explore", properties: { category: key } });
    setFilters((f) => ({ ...f, category: f.category === key ? "" : key }));
  };

  const refreshedAt = gauge?.generated_at ? new Date(gauge.generated_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : null;
  const matchingCities = cov.matchingCityNames || [];
  const recruitingCities = cov.recruitingCityNames || [];
  const selectedRow = gauge?.rows?.find((r) => r.key === filters.category) || null;

  return (
    <div className="min-h-screen bg-ri-ivory pb-16">
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-ri-slate hover:text-ri-emerald-ink">← Back to home</Link>

        <div className="mt-5 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-ri-emerald/10 px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-ri-emerald-ink uppercase">
            <Compass className="w-3.5 h-3.5" /> Same Day Recycling LIVE
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-ri-charcoal">
            Explore What's Happening Across Canada.
          </h1>
          <p className="mt-3 text-lg text-ri-slate leading-relaxed">
            Discover local service demand, compare pickup options, explore recycling information, and find help when you need it.
          </p>
          <p className="mt-2 text-sm font-bold text-ri-emerald-ink">Free to explore — no account needed.</p>
        </div>

        <div className="mt-4 rounded-2xl bg-white border border-si-line px-4 py-3 text-xs text-ri-slate">
          <span className="inline-flex items-center gap-1.5 font-bold text-ri-charcoal">
            <Clock className="w-3.5 h-3.5" />
            {refreshedAt ? `Demand intelligence refreshed ${refreshedAt}` : "Loading demand intelligence…"}
          </span>
          <span className="mt-1 block">
            Sources: verified service requests (platform records) · contractor coverage (verified partner territories) · market signals (external observations, source-labelled) · demand figures are record counts, never live traffic.
          </span>
        </div>

        <div className="mt-3">
          <HowItWorks />
        </div>
      </div>

      {/* Customer-first service search */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <ServiceSearch
          cov={cov}
          onPickCity={(city) => {
            const code = REGIONS.find((r) => r.name === city.province)?.code || "";
            setFilters((f) => ({ ...f, province: code, city: city.name }));
          }}
        />
      </div>

      {/* Shared filters — drive radar, map, trend and insight panel */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="rounded-2xl bg-white border border-si-line p-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <label className="text-xs font-bold text-ri-slate">
              Province
              <select value={filters.province} onChange={setFilter("province")} className="input mt-1">
                <option value="">All Canada</option>
                {REGIONS.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-ri-slate">
              City
              <select value={filters.city} onChange={setFilter("city")} className="input mt-1" disabled={!filters.province}>
                <option value="">All cities</option>
                {provinceCityOptions.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-ri-slate">
              Service category
              <select value={filters.category} onChange={setFilter("category")} className="input mt-1">
                <option value="">All categories</option>
                {Object.entries(LIVE_CATEGORIES).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-ri-slate">
              Reporting period
              <select value={filters.days} onChange={setFilter("days")} className="input mt-1">
                {DAY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* National Intelligence Radar + Customer Insight Panel */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <SectionHead title="The National Intelligence Radar" note="Eight service categories, one interactive instrument. Select a segment or a row to focus the page.">
          <div className="grid lg:grid-cols-2 gap-5 items-start">
            <NationalRadar
              data={gauge}
              loading={loading}
              error={error}
              selected={filters.category}
              onSelect={pickCategory}
              days={filters.days}
            />
            <InsightPanel data={gauge} selectedRow={selectedRow} cov={cov} />
          </div>
        </SectionHead>

        <SectionHead title="Geographic Intelligence" note="Observed demand and verified contractor coverage, filtered by your selection above.">
          <LiveActivityMap cities={gauge?.cities || []} coverageCities={cov.verifiedCityNames || []} />
        </SectionHead>

        <SectionHead title="Service-Interest Trend" note="Demand observations per month, matching the filters above.">
          {error ? null : gauge && gauge.trend && gauge.trend.length >= 2 ? (
            <TrendBars trend={gauge.trend} />
          ) : (
            <p className="rounded-2xl bg-white border border-si-line p-5 text-sm text-ri-slate">Not enough history to show a trend yet. Observations accumulate over time — nothing here is estimated.</p>
          )}
        </SectionHead>

        <SectionHead title="Community Requests" note="Recent public posts from Canadians — moderated, personal details never shown.">
          <LiveCommunityFeed />
        </SectionHead>

        {/* Pricing, resources, opportunities, participation */}
        <div className="mt-10 grid md:grid-cols-2 gap-5">
          <section className="rounded-2xl bg-white border border-si-line p-5">
            <h2 className="flex items-center gap-2 font-bold text-ri-charcoal"><DollarSign className="w-4 h-4 text-ri-emerald-ink" /> Pricing Intelligence</h2>
            <p className="mt-1 text-sm text-ri-slate">Published rates and sourced public prices — advertised starting prices clearly separated from approved final prices.</p>
            <div className="mt-3"><RexPriceCompare /></div>
          </section>

          <section className="rounded-2xl bg-white border border-si-line p-5">
            <h2 className="flex items-center gap-2 font-bold text-ri-charcoal"><Recycle className="w-4 h-4 text-ri-emerald-ink" /> Recycling Resources</h2>
            <p className="mt-1 text-sm text-ri-slate">Where materials really go, with cited sources and location-aware guidance.</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-ri-forest">
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/recycling-centers">Recycling centre directory <ArrowRight className="w-3.5 h-3.5" /></Link></li>
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/recycling-assistant">Disposal advisor <ArrowRight className="w-3.5 h-3.5" /></Link></li>
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/demand">Full market intelligence <ArrowRight className="w-3.5 h-3.5" /></Link></li>
            </ul>
          </section>

          <section className="rounded-2xl bg-white border border-si-line p-5">
            <h2 className="flex items-center gap-2 font-bold text-ri-charcoal"><MapPin className="w-4 h-4 text-ri-emerald-ink" /> Regional Service Opportunities</h2>
            <p className="mt-1 text-sm text-ri-slate">Cities actively matching requests or welcoming new contractors — from verified coverage records.</p>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-ri-slate/70">Open matching activity</div>
                {cov.loaded ? (
                  matchingCities.length ? <p className="mt-1 text-ri-charcoal">{matchingCities.join(", ")}</p> : <p className="mt-1 text-ri-slate">No cities currently awaiting contractor matches.</p>
                ) : <LoadingLine />}
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-ri-slate/70">Recruiting new contractors</div>
                {cov.loaded ? (
                  recruitingCities.length ? <p className="mt-1 text-ri-charcoal">{recruitingCities.join(", ")}</p> : <p className="mt-1 text-ri-slate">Every active registry city already has verified coverage.</p>
                ) : <LoadingLine />}
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white border border-si-line p-5">
            <h2 className="flex items-center gap-2 font-bold text-ri-charcoal"><Users className="w-4 h-4 text-ri-emerald-ink" /> Get Involved</h2>
            <p className="mt-1 text-sm text-ri-slate">Use the platform as a customer — every verified interaction improves national service intelligence.</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-ri-forest">
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/community">Community &amp; requests <ArrowRight className="w-3.5 h-3.5" /></Link></li>
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/request-service">Request a pickup <ArrowRight className="w-3.5 h-3.5" /></Link></li>
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/move-assist">Plan a moving cleanout <ArrowRight className="w-3.5 h-3.5" /></Link></li>
            </ul>
          </section>
        </div>

        {/* Conversion: explore → understand → compare → quote → book */}
        <Link to="/request-service" className="mt-10 block rounded-[20px] bg-ri-forest px-6 py-10 text-center transition-colors hover:bg-ri-charcoal">
          <div className="text-2xl font-bold text-white">Ready to clear your space?</div>
          <div className="mt-2 text-sm text-ri-ivory/70">Request a pickup in any Canadian city — the price is approved by you before anything is scheduled.</div>
          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-ri-amber px-6 py-3 text-sm font-bold text-ri-charcoal">
            Get My Pickup Estimate <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}

function LoadingLine() {
  return <p className="mt-1 flex items-center gap-1.5 text-ri-slate"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading coverage records…</p>;
}

function SectionHead({ title, note, children }) {
  return (
    <section className="mt-8">
      <h2 className="font-bold text-lg text-ri-charcoal">{title}</h2>
      {note && <p className="mt-0.5 text-xs text-ri-slate mb-3">{note}</p>}
      {children}
    </section>
  );
}

function TrendBars({ trend }) {
  const max = Math.max(...trend.map((t) => t.count), 1);
  return (
    <div className="rounded-2xl bg-white border border-si-line p-5">
      <div className="flex items-end gap-2 h-40">
        {trend.map((t) => (
          <div key={t.month} className="flex-1 flex flex-col items-center justify-end gap-1.5 min-w-0">
            <span className="text-xs font-bold text-ri-charcoal tabular-nums">{t.count}</span>
            <div className="w-full max-w-10 rounded-t-lg bg-ri-emerald" style={{ height: `${Math.max(4, (t.count / max) * 100)}%` }} aria-hidden="true" />
            <span className="text-[10px] text-ri-slate truncate w-full text-center">{t.month}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-ri-slate/80">Counts of verified demand records per month. Search interest appears only as its own labelled record type — never as request volume.</p>
    </div>
  );
}