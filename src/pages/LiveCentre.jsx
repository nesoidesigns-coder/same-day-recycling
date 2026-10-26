import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Compass, DollarSign, MapPin, Recycle, Users, ArrowRight, Clock, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useSEO } from "@/lib/seo";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import { REGIONS } from "@/lib/regions";
import { CITIES } from "@/lib/cities";
import { LIVE_CATEGORIES } from "@/lib/liveCategories";
import { setRexContext } from "@/lib/rexSession";
import ServiceRadar from "@/components/cinematic/ServiceRadar";
import CinematicCanadaMap from "@/components/cinematic/CinematicCanadaMap";
import useCanadaGeography from "@/components/cinematic/useCanadaGeography";
import Sparkline from "@/components/cinematic/Sparkline";
import RexIntelligenceStrip from "@/components/cinematic/RexIntelligenceStrip";
import ConsumerActions, { BookNowBar } from "@/components/cinematic/ConsumerActions";
import { CineCard, CineMetric, CineSectionLabel } from "@/components/cinematic/CinePrimitives";
import LiveCommunityFeed from "@/components/live/LiveCommunityFeed";
import RexPriceCompare from "@/components/home/RexPriceCompare";
import ServiceSearch from "@/components/live/ServiceSearch";
import InsightPanel from "@/components/live/InsightPanel";
import HowItWorks from "@/components/live/HowItWorks";

const DAY_OPTIONS = [
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
  { value: 90, label: "Last 90 days" },
  { value: 365, label: "Last 12 months" },
];

// Same Day Recycling LIVE — the Canadian Service Radar. A cinematic public
// intelligence observatory built on the platform's verified records. One
// shared filter state drives the radar, the map and every supporting panel.
// Real records only, honest empty states, no account needed.
export default function LiveCentre() {
  useSEO({
    title: "Same Day Recycling LIVE | Canadian Service Intelligence Observatory",
    description: "Explore Canadian service demand on the Canadian Service Radar — observed requests, verified contractor coverage, pricing intelligence and community research. Free to explore — no account needed.",
    path: "/live",
  });
  const cov = useCoverageStatus();
  const geo = useCanadaGeography();
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
    return () => {
      alive = false;
    };
  }, [filters]);

  const setFilter = (key) => (e) =>
    setFilters((f) => ({ ...f, [key]: e.target.value, ...(key !== "city" && key !== "days" ? { city: "" } : {}) }));

  const pickCategory = (key) => {
    if (key) base44.analytics.track({ eventName: "live_category_explore", properties: { category: key } });
    setFilters((f) => ({ ...f, category: f.category === key ? "" : key }));
  };

  const focusProvince = (code) => setFilters((f) => ({ ...f, province: f.province === code ? "" : code, city: "" }));
  const focusCity = (name) => {
    const city = CITIES.find((c) => c.name.toLowerCase() === String(name).toLowerCase());
    const code = city ? REGIONS.find((r) => r.name === city.province)?.code || "" : filters.province;
    setRexContext({ page: "live", city: name });
    setFilters((f) => ({ ...f, province: code, city: name }));
  };

  const refreshedAt = gauge?.generated_at ? new Date(gauge.generated_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : null;
  const matchingCities = cov.matchingCityNames || [];
  const recruitingCities = cov.recruitingCityNames || [];
  const verifiedCities = cov.verifiedCityNames || [];
  const monitored = verifiedCities.length + matchingCities.length + recruitingCities.length;
  const selectedRow = gauge?.rows?.find((r) => r.key === filters.category) || null;
  const coverageModel = cov.loaded ? { verified: verifiedCities.length, monitored } : null;

  return (
    <div className="relative min-h-screen overflow-x-clip bg-cine-bg pb-28 text-cine-ink lg:pb-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-[720px] max-w-full -translate-x-1/2 cine-glow rounded-full"
      />

      {/* Header */}
      <div className="relative mx-auto max-w-6xl px-4 pt-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-cine-muted transition-colors hover:text-cine-cyan">← Back to home</Link>
        <div className="mt-5 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-cine-cyan/30 bg-cine-cyan/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-cine-cyan">
            <Compass className="h-3.5 w-3.5" /> Same Day Recycling LIVE
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            The Canadian Service Radar.
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-cine-muted">
            Canada's live service intelligence observatory — observed demand, verified coverage and pricing guidance, rendered honestly.
          </p>
          <p className="mt-2 font-plex text-xs font-bold text-cine-cyan">Free to explore — no account needed.</p>
        </div>
        <p className="mt-4 flex flex-wrap items-center gap-x-2 font-plex text-[11px] text-cine-muted">
          <Clock className="h-3.5 w-3.5" />
          {refreshedAt ? `Demand intelligence refreshed ${refreshedAt}` : "Loading demand intelligence…"}
          <span aria-hidden="true">·</span>
          <span>Counts of real records, never live traffic. Search interest is always labelled separately.</span>
        </p>
        <div className="mt-4">
          <HowItWorks />
        </div>
      </div>

      {/* Shared filters */}
      <div className="relative mx-auto max-w-6xl px-4 pt-6">
        <div className="cine-glass grid grid-cols-2 gap-2 rounded-[24px] p-4 lg:grid-cols-4">
          <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-cine-muted">
            Province
            <select value={filters.province} onChange={setFilter("province")} className="cine-input mt-1.5">
              <option value="">All Canada</option>
              {REGIONS.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
            </select>
          </label>
          <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-cine-muted">
            City
            <select value={filters.city} onChange={setFilter("city")} className="cine-input mt-1.5" disabled={!filters.province}>
              <option value="">All cities</option>
              {provinceCityOptions.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </label>
          <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-cine-muted">
            Service category
            <select value={filters.category} onChange={setFilter("category")} className="cine-input mt-1.5">
              <option value="">All categories</option>
              {Object.entries(LIVE_CATEGORIES).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </label>
          <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-cine-muted">
            Reporting period
            <select value={filters.days} onChange={setFilter("days")} className="cine-input mt-1.5">
              {DAY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* The Canadian Service Radar — centrepiece */}
      <div className="relative mx-auto max-w-6xl px-4 pt-8">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <CineCard title="Canadian Service Radar" note="Eight service categories, one concentric instrument. Select a sector or a chip to focus the page.">
            <ServiceRadar
              data={gauge}
              loading={loading}
              error={error}
              selected={filters.category}
              onSelect={pickCategory}
              days={filters.days}
              coverage={coverageModel}
              onCityClick={focusCity}
            />
          </CineCard>

          <div className="flex flex-col gap-4">
            <Sparkline trend={gauge?.trend || []} />

            {/* Regional intelligence */}
            <div className="rounded-2xl border border-cine-line/60 bg-cine-surface/60 p-5">
              <CineSectionLabel>Regional intelligence</CineSectionLabel>
              {loading ? (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-cine-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Preparing city observations…</p>
              ) : gauge?.cities?.length ? (
                <ul className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {gauge.cities.slice(0, 9).map((c) => (
                    <li key={c.city}>
                      <button
                        onClick={() => focusCity(c.city)}
                        className={`w-full rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors ${
                          filters.city === c.city ? "border-cine-cyan/60 bg-cine-cyan/10 text-cine-cyan" : "border-cine-line/50 text-cine-ink hover:border-cine-cyan/40"
                        }`}
                      >
                        <span className="block truncate">{c.city}</span>
                        <span className="font-plex text-[10px] text-cine-muted">{c.count} record{c.count === 1 ? "" : "s"}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-cine-muted">Awaiting data — no records resolved to a city for this selection yet. Locations are only shown when the source supports them.</p>
              )}
            </div>

            {/* Contractor supply */}
            <div className="rounded-2xl border border-cine-line/60 bg-cine-surface/60 p-5">
              <CineSectionLabel>Contractor supply &amp; availability</CineSectionLabel>
              {cov.loaded ? (
                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <CineMetric label="Verified coverage" value={verifiedCities.length} note="Cities with a verified contractor on file" tone="cyan" />
                  <CineMetric label="Matching activity" value={matchingCities.length} note="Cities currently matching open requests" tone="arctic" />
                  <CineMetric label="Recruiting" value={recruitingCities.length} note="Cities welcoming new contractors" tone="violet" />
                </div>
              ) : (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-cine-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading coverage records…</p>
              )}
              <p className="mt-3 font-plex text-[10px] leading-relaxed text-cine-muted">
                From verified partner territory records only. A booking is confirmed per job, after a contractor accepts.
              </p>
            </div>

            <RexIntelligenceStrip
              categoryLabel={filters.category ? LIVE_CATEGORIES[filters.category] : ""}
              city={filters.city}
            />
          </div>
        </div>
      </div>

      {/* Geographic intelligence — coordinates with the radar */}
      <div className="relative mx-auto max-w-6xl px-4 pt-8">
        <CineCard id="live-map" title="Canadian Intelligence Map" note="Province and city lighting reflects real observed records — never fabricated activity.">
          <CinematicCanadaMap
            geography={geo.geography}
            geoError={geo.error}
            cities={gauge?.cities || []}
            coverageCities={cov.verifiedCityNames || []}
            province={filters.province}
            onProvince={focusProvince}
            onCity={focusCity}
          />
        </CineCard>
      </div>

      {/* Category intelligence — plain-language guidance beside the records */}
      <div className="relative mx-auto max-w-6xl px-4 pt-8">
        <InsightPanel data={gauge} selectedRow={selectedRow} cov={cov} />
      </div>

      {/* Consumer-first service search + evidence layer */}
      <div className="relative mx-auto grid max-w-6xl gap-5 px-4 pt-8 lg:grid-cols-2">
        <ServiceSearch
          cov={cov}
          onPickCity={(city) => {
            const code = REGIONS.find((r) => r.name === city.province)?.code || "";
            setRexContext({ page: "live", city: city.name });
            setFilters((f) => ({ ...f, province: code, city: city.name }));
          }}
        />
        <CineCard title="Consumer actions" note="Move from research to service in one step.">
          <ConsumerActions />
        </CineCard>
      </div>

      {/* Community requests */}
      <div className="relative mx-auto max-w-6xl px-4 pt-8">
        <CineCard title="Community Requests" note="Recent public posts from Canadians — moderated, personal details never shown.">
          <LiveCommunityFeed />
        </CineCard>
      </div>

      {/* Pricing, resources, opportunities, participation */}
      <div className="relative mx-auto max-w-6xl px-4 pt-8">
        <div className="grid gap-5 md:grid-cols-2">
          <section id="live-pricing" className="rounded-2xl bg-white p-5">
            <h2 className="flex items-center gap-2 font-bold text-ri-charcoal"><DollarSign className="h-4 w-4 text-ri-emerald-ink" /> Pricing Intelligence</h2>
            <p className="mt-1 text-sm text-ri-slate">Published rates and sourced public prices — advertised starting prices clearly separated from approved final prices.</p>
            <div className="mt-3"><RexPriceCompare /></div>
          </section>

          <section className="rounded-2xl bg-white p-5">
            <h2 className="flex items-center gap-2 font-bold text-ri-charcoal"><Recycle className="h-4 w-4 text-ri-emerald-ink" /> Recycling Resources</h2>
            <p className="mt-1 text-sm text-ri-slate">Where materials really go, with cited sources and location-aware guidance.</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-ri-forest">
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/recycling-centers">Recycling centre directory <ArrowRight className="h-3.5 w-3.5" /></Link></li>
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/recycling-assistant">Disposal advisor <ArrowRight className="h-3.5 w-3.5" /></Link></li>
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/demand">Full market intelligence <ArrowRight className="h-3.5 w-3.5" /></Link></li>
            </ul>
          </section>

          <section className="rounded-2xl bg-white p-5">
            <h2 className="flex items-center gap-2 font-bold text-ri-charcoal"><MapPin className="h-4 w-4 text-ri-emerald-ink" /> Regional Service Opportunities</h2>
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

          <section className="rounded-2xl bg-white p-5">
            <h2 className="flex items-center gap-2 font-bold text-ri-charcoal"><Users className="h-4 w-4 text-ri-emerald-ink" /> Get Involved</h2>
            <p className="mt-1 text-sm text-ri-slate">Use the platform as a customer — every verified interaction improves national service intelligence.</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-ri-forest">
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/community">Community &amp; requests <ArrowRight className="h-3.5 w-3.5" /></Link></li>
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/request-service">Request a pickup <ArrowRight className="h-3.5 w-3.5" /></Link></li>
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/move-assist">Plan a moving cleanout <ArrowRight className="h-3.5 w-3.5" /></Link></li>
            </ul>
          </section>
        </div>

        {/* Conversion — the booking bridge */}
        <Link
          to="/request-service"
          onClick={() =>
            setRexContext({
              page: "live",
              ...(filters.city ? { city: filters.city } : {}),
              ...(filters.category ? { intent: `Exploring ${LIVE_CATEGORIES[filters.category]} on Canada Live` } : {}),
            })
          }
          className="mt-8 block rounded-[24px] border border-cine-line/60 bg-cine-surface/70 px-6 py-10 text-center transition-colors hover:border-cine-cyan/40"
        >
          <div className="text-2xl font-bold text-cine-ink">Ready to clear your space?</div>
          <div className="mt-2 text-sm text-cine-muted">Request a pickup in any Canadian city — the price is approved by you before anything is scheduled.</div>
          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-[#0a1220]">
            Get My Pickup Estimate <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>

      {/* Persistent mobile booking action */}
      <BookNowBar city={filters.city} />
    </div>
  );
}

function LoadingLine() {
  return <p className="mt-1 flex items-center gap-1.5 text-ri-slate"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading coverage records…</p>;
}