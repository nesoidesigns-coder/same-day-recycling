import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { DollarSign, MapPin, Recycle, Users, ArrowRight, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useSEO } from "@/lib/seo";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import { REGIONS } from "@/lib/regions";
import { CITIES } from "@/lib/cities";
import { LIVE_CATEGORIES } from "@/lib/liveCategories";
import { setRexContext } from "@/lib/rexSession";
import LiveHero from "@/components/cinematic/LiveHero";
import CinematicCanadaMap from "@/components/cinematic/CinematicCanadaMap";
import useCanadaGeography from "@/components/cinematic/useCanadaGeography";
import RexIntelligenceStrip from "@/components/cinematic/RexIntelligenceStrip";
import ConsumerActions, { BookNowBar } from "@/components/cinematic/ConsumerActions";
import { CineCard } from "@/components/cinematic/CinePrimitives";
import LiveCommunityFeed from "@/components/live/LiveCommunityFeed";
import RexPriceCompare from "@/components/home/RexPriceCompare";
import ServiceSearch from "@/components/live/ServiceSearch";
import InsightPanel from "@/components/live/InsightPanel";
import HowItWorks from "@/components/live/HowItWorks";

// Same Day Recycling LIVE — the Canadian Service Radar. The first viewport is
// one unified immersive instrument (LiveHero); below it, the working
// intelligence surfaces continue on the same midnight-navy environment.
// One shared filter state drives the instrument, the map and every panel.
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
  const [pulseKey, setPulseKey] = useState(0);
  const lastGenerated = useRef(null);

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

  // One brief pulse when the feed genuinely refreshed — never fabricated.
  useEffect(() => {
    if (gauge?.generated_at && gauge.generated_at !== lastGenerated.current) {
      lastGenerated.current = gauge.generated_at;
      setPulseKey((k) => k + 1);
    }
  }, [gauge]);

  const provinceCityOptions = useMemo(() => {
    const target = REGIONS.find((r) => r.code === filters.province)?.name || "";
    return CITIES.filter((c) => !filters.province || String(c.province || "") === target);
  }, [filters.province]);

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

  const applyFilter = (key, value) => {
    if (key === "province") setFilters((f) => ({ ...f, province: value, city: "" }));
    else if (key === "city") setFilters((f) => ({ ...f, city: value }));
    else if (key === "days") setFilters((f) => ({ ...f, days: Number(value) }));
  };

  const matchingCities = cov.matchingCityNames || [];
  const recruitingCities = cov.recruitingCityNames || [];
  const verifiedCities = cov.verifiedCityNames || [];
  const selectedRow = gauge?.rows?.find((r) => r.key === filters.category) || null;

  const goRequest = () =>
    setRexContext({
      page: "live",
      ...(filters.city ? { city: filters.city } : {}),
      ...(filters.category ? { intent: `Exploring ${LIVE_CATEGORIES[filters.category]} on Live Intelligence` } : {}),
    });

  return (
    <div className="relative min-h-screen overflow-x-clip bg-cine-bg pb-28 text-cine-ink lg:pb-16">
      {/* The immersive first viewport — the instrument */}
      <LiveHero
        data={gauge}
        loading={loading}
        error={error}
        filters={filters}
        onFilter={applyFilter}
        pickCategory={pickCategory}
        focusCity={focusCity}
        cov={cov}
        pulseKey={pulseKey}
      />

      {/* Rex as invisible intelligence — a quiet contextual strip */}
      <div className="relative mx-auto max-w-6xl px-4 pt-8">
        <RexIntelligenceStrip categoryLabel={filters.category ? LIVE_CATEGORIES[filters.category] : ""} city={filters.city} />
      </div>

      {/* Geographic intelligence — coordinates with the instrument */}
      <div className="relative mx-auto max-w-6xl px-4 pt-8">
        <CineCard id="live-map" title="Canadian Intelligence Map" note="Province and city lighting reflects real observed records — never fabricated activity.">
          <CinematicCanadaMap
            geography={geo.geography}
            geoError={geo.error}
            cities={gauge?.cities || []}
            coverageCities={verifiedCities}
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

      {/* Consumer-first service search + actions */}
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
          <section id="live-pricing" className="cine-glass rounded-[24px] p-5">
            <h2 className="flex items-center gap-2 font-bold text-cine-ink"><DollarSign className="h-4 w-4 text-cine-cyan" /> Pricing Intelligence</h2>
            <p className="mt-1 text-sm text-cine-muted">Published rates and sourced public prices — advertised starting prices clearly separated from approved final prices.</p>
            <div className="mt-3"><RexPriceCompare /></div>
          </section>

          <section className="cine-glass rounded-[24px] p-5">
            <h2 className="flex items-center gap-2 font-bold text-cine-ink"><Recycle className="h-4 w-4 text-cine-cyan" /> Recycling Resources</h2>
            <p className="mt-1 text-sm text-cine-muted">Where materials really go, with cited sources and location-aware guidance.</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-cine-cyan">
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/recycling-centers">Recycling centre directory <ArrowRight className="h-3.5 w-3.5" /></Link></li>
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/recycling-assistant">Disposal advisor <ArrowRight className="h-3.5 w-3.5" /></Link></li>
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/demand">Full market intelligence <ArrowRight className="h-3.5 w-3.5" /></Link></li>
            </ul>
          </section>

          <section className="cine-glass rounded-[24px] p-5">
            <h2 className="flex items-center gap-2 font-bold text-cine-ink"><MapPin className="h-4 w-4 text-cine-cyan" /> Regional Service Opportunities</h2>
            <p className="mt-1 text-sm text-cine-muted">Cities actively matching requests or welcoming new contractors — from verified coverage records.</p>
            <div className="mt-3 space-y-3 text-sm">
              <div>
                <div className="font-plex text-[10px] font-bold uppercase tracking-[0.18em] text-cine-muted">Open matching activity</div>
                {cov.loaded ? (
                  matchingCities.length ? <p className="mt-1 text-cine-ink">{matchingCities.join(", ")}</p> : <p className="mt-1 text-cine-muted">No cities currently awaiting contractor matches.</p>
                ) : <LoadingLine />}
              </div>
              <div>
                <div className="font-plex text-[10px] font-bold uppercase tracking-[0.18em] text-cine-muted">Recruiting new contractors</div>
                {cov.loaded ? (
                  recruitingCities.length ? <p className="mt-1 text-cine-ink">{recruitingCities.join(", ")}</p> : <p className="mt-1 text-cine-muted">Every active registry city already has verified coverage.</p>
                ) : <LoadingLine />}
              </div>
            </div>
          </section>

          <section className="cine-glass rounded-[24px] p-5">
            <h2 className="flex items-center gap-2 font-bold text-cine-ink"><Users className="h-4 w-4 text-cine-cyan" /> Get Involved</h2>
            <p className="mt-1 text-sm text-cine-muted">Use the platform as a customer — every verified interaction improves national service intelligence.</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-cine-cyan">
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/community">Community &amp; requests <ArrowRight className="h-3.5 w-3.5" /></Link></li>
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/request-service">Request a pickup <ArrowRight className="h-3.5 w-3.5" /></Link></li>
              <li><Link className="hover:underline inline-flex items-center gap-1.5" to="/move-assist">Plan a moving cleanout <ArrowRight className="h-3.5 w-3.5" /></Link></li>
            </ul>
          </section>
        </div>

        {/* Methodology — the full evidence panel, kept off the main visual */}
        <div id="live-methods" className="pt-8">
          <CineCard title="Methodology & Data Layers" note="What each measurement means, where it comes from, and how missing data is handled.">
            <HowItWorks />
          </CineCard>
        </div>

        {/* Conversion — the booking bridge */}
        <Link
          to="/request-service"
          onClick={goRequest}
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
  return <p className="mt-1 flex items-center gap-1.5 text-cine-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading coverage records…</p>;
}