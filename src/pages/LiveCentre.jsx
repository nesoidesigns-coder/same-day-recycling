import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, DollarSign, Loader2, MapPin, Recycle, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useSEO } from "@/lib/seo";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import useLiveGauge from "@/hooks/useLiveGauge";
import { REGIONS } from "@/lib/regions";
import { CITIES } from "@/lib/cities";
import { LIVE_CATEGORIES, DEMAND_TYPE_LABELS } from "@/lib/liveCategories";
import { setRexContext } from "@/lib/rexSession";
import { useIntelligence } from "@/lib/intelligenceContext";
import IntelHeader from "@/components/intel/IntelHeader";
import IntelCard from "@/components/intel/IntelCard";
import DemandDonut from "@/components/intel/DemandDonut";
import StatRail from "@/components/intel/StatRail";
import MetricTiles from "@/components/intel/MetricTiles";
import DemandMapCard from "@/components/intel/DemandMapCard";
import CategoryTiles from "@/components/intel/CategoryTiles";
import ActivityList from "@/components/intel/ActivityList";
import TopCities from "@/components/intel/TopCities";
import RexInsight from "@/components/intel/RexInsight";
import LiveCommunityFeed from "@/components/live/LiveCommunityFeed";
import RexPriceCompare from "@/components/home/RexPriceCompare";
import HowItWorks from "@/components/live/HowItWorks";
import { BookNowBar } from "@/components/cinematic/ConsumerActions";

const DAY_OPTIONS = [
  { value: 7, label: "7D" },
  { value: 30, label: "30D" },
  { value: 90, label: "90D" },
];

const periodLabel = (days) => ({ 7: "7-day window", 30: "30-day window", 90: "90-day window" }[days] || `${days}-day window`);

// Live Intelligence — the Canadian Service Radar dashboard. One shared filter
// state drives every reading on the page; every figure is a verified record and
// missing data is shown as such.
export default function LiveCentre() {
  useSEO({
    title: "Same Day Recycling LIVE | Canadian Service Intelligence Observatory",
    description: "Explore Canadian service demand — observed requests, verified contractor coverage, pricing intelligence and community research. Free to explore, no account needed.",
    path: "/live",
  });
  const cov = useCoverageStatus();
  const intel = useIntelligence();
  const [filters, setFilters] = useState(() => {
    const city = intel.selection.city || "";
    const match = city ? CITIES.find((c) => c.name.toLowerCase() === city.toLowerCase()) : null;
    const code = match ? REGIONS.find((r) => r.name === match.province)?.code || "" : "";
    return { province: code, city, category: "", days: 30 };
  });

  const { data: gauge, loading, error } = useLiveGauge(filters);

  const rows = useMemo(
    () =>
      Object.keys(LIVE_CATEGORIES).map((key) => ({
        key,
        label: LIVE_CATEGORIES[key],
        count: gauge?.rows?.find((r) => r.key === key)?.count || 0,
        types: gauge?.rows?.find((r) => r.key === key)?.demand_types || {},
      })),
    [gauge]
  );

  const total = gauge?.total || 0;
  const topRow = [...rows].sort((a, b) => b.count - a.count)[0];
  const selectedRow = filters.category ? rows.find((r) => r.key === filters.category) || null : null;
  const topCity = gauge?.cities?.[0] || null;
  const regionalName = filters.city || topCity?.city || "";
  const regionalCount = filters.city
    ? gauge?.cities?.find((c) => String(c.city).toLowerCase() === filters.city.toLowerCase())?.count || null
    : topCity?.count || null;

  const topType = useMemo(() => {
    const entries = Object.entries(gauge?.by_type || {}).sort((a, b) => b[1] - a[1]);
    return entries.length ? { label: DEMAND_TYPE_LABELS[entries[0][0]] || entries[0][0], count: entries[0][1] } : null;
  }, [gauge]);

  const change = useMemo(() => {
    const nowMonth = new Date().toISOString().slice(0, 7);
    const complete = (gauge?.trend || []).filter((t) => t.month < nowMonth);
    const prev = complete[complete.length - 2];
    const last = complete[complete.length - 1];
    return prev && last ? { prev: prev.month, last: last.month, delta: last.count - prev.count } : null;
  }, [gauge]);

  const monitored = (cov.verifiedCityNames?.length || 0) + (cov.matchingCityNames?.length || 0) + (cov.recruitingCityNames?.length || 0);
  const updatedAt = gauge?.generated_at
    ? new Date(gauge.generated_at).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : null;

  const pickCategory = (key) => {
    if (key) base44.analytics.track({ eventName: "live_category_explore", properties: { category: key } });
    setFilters((f) => ({ ...f, category: f.category === key ? "" : key }));
  };

  const focusCity = (name) => {
    const city = CITIES.find((c) => c.name.toLowerCase() === String(name).toLowerCase());
    const code = city ? REGIONS.find((r) => r.name === city.province)?.code || "" : filters.province;
    setRexContext({ page: "live", city: name });
    intel.setSelection({ city: name });
    setFilters((f) => ({ ...f, province: code, city: name }));
  };

  const goRequest = () =>
    setRexContext({
      page: "live",
      ...(filters.city ? { city: filters.city } : {}),
      ...(filters.category ? { intent: `Exploring ${LIVE_CATEGORIES[filters.category]} on Live Intelligence` } : {}),
    });

  return (
    <div className="min-h-screen bg-lm-bg pb-24 text-lm-ink lg:pb-10">
      <IntelHeader />

      <div className="mx-auto max-w-[1360px] px-4 py-4">
        <main className="min-w-0 space-y-3">
          {/* Title row: what this is, how fresh, the window, the way to book */}
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate font-heading text-[22px] font-extrabold leading-tight tracking-tight text-lm-ink">
                Canadian Service Radar <span className="font-semibold text-lm-muted">• Same Day Recycling</span>
              </h1>
              <p className="mt-0.5 text-[11.5px] text-lm-muted">
                {error ? "Signal unavailable — the feed reconnects on refresh." : updatedAt ? `Last updated ${updatedAt}` : "Connecting to verified records…"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-0.5 rounded-full border border-lm-line bg-lm-surface p-0.5" role="group" aria-label="Reporting window">
                {DAY_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setFilters((f) => ({ ...f, days: o.value }))}
                    aria-pressed={filters.days === o.value}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
                      filters.days === o.value ? "bg-lm-teal text-white" : "text-lm-muted hover:text-lm-ink"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <select
                value={filters.province}
                onChange={(e) => {
                  const code = e.target.value;
                  setFilters((f) => ({ ...f, province: code, city: "" }));
                }}
                aria-label="Province"
                className="rounded-full border border-lm-line bg-lm-surface px-3 py-2 text-[11.5px] font-semibold text-lm-ink focus:outline-none focus:ring-2 focus:ring-lm-teal"
              >
                <option value="">All Canada</option>
                {REGIONS.map((r) => (
                  <option key={r.code} value={r.code}>{r.name}</option>
                ))}
              </select>
              <Link
                to="/request-service"
                onClick={goRequest}
                className="inline-flex items-center gap-1.5 rounded-full bg-lm-amber px-4 py-2 text-[12px] font-bold text-[#241800] shadow-sm transition hover:brightness-95"
              >
                Get pickup estimate <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Instrument row: verified rail · the ring · readings and the map */}
          <div className="grid gap-3 lg:grid-cols-12">
            <div className="lg:col-span-3 xl:col-span-2">
              <StatRail
                cov={cov}
                monitored={monitored}
                regionalName={regionalName}
                regionalCount={regionalCount}
                loading={!cov.loaded}
              />
            </div>

            <div className="rounded-2xl border border-lm-line bg-lm-surface p-4 shadow-[0_1px_2px_rgba(18,61,55,0.04)] lg:col-span-5 xl:col-span-5">
              <DemandDonut
                total={total}
                rows={rows}
                loading={loading}
                selected={filters.category}
                onSelect={pickCategory}
                periodLabel={periodLabel(filters.days)}
                updatedAt={updatedAt}
              />
            </div>

            <div className="space-y-3 lg:col-span-4 xl:col-span-5">
              <MetricTiles
                total={total}
                periodLabel={periodLabel(filters.days)}
                topType={topType}
                change={change}
                trend={gauge?.trend || []}
                focusLabel={selectedRow ? LIVE_CATEGORIES[selectedRow.key] : ""}
                focusCount={selectedRow ? selectedRow.count : null}
              />
              <IntelCard
                title="Cities with observed demand"
                note="Verified records only — clusters grow as real requests arrive."
                bodyClass="p-3"
                action={
                  <button onClick={() => focusCity("")} className="shrink-0 text-[10.5px] font-bold text-lm-teal hover:underline">
                    Reset
                  </button>
                }
              >
                <DemandMapCard cities={gauge?.cities || []} selected={regionalName} onSelect={focusCity} />
              </IntelCard>
            </div>
          </div>

          {/* Service strip */}
          <div className="rounded-2xl border border-lm-line bg-lm-surface p-2 shadow-[0_1px_2px_rgba(18,61,55,0.04)]">
            <CategoryTiles rows={rows} total={total} selected={filters.category} onSelect={pickCategory} />
          </div>

          {/* Bottom panels */}
          <div className="grid gap-3 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <IntelCard title="Latest service activity" note="Verified platform records and labelled public observations.">
                <ActivityList recent={gauge?.recent || []} loading={loading} />
              </IntelCard>
            </div>
            <div className="lg:col-span-3">
              <IntelCard title="Top cities by observed demand" note={`${periodLabel(filters.days)} window.`}>
                <TopCities cities={gauge?.cities || []} selected={regionalName} onSelect={focusCity} />
              </IntelCard>
            </div>
            <div className="lg:col-span-3">
              <RexInsight
                total={total}
                topRow={topRow}
                selectedRow={selectedRow}
                verifiedCities={cov.verifiedCityNames?.length || 0}
                recruitingCities={cov.recruitingCityNames?.length || 0}
                periodLabel={periodLabel(filters.days)}
              />
            </div>
          </div>

          {/* Continuing intelligence surfaces */}
          <div className="grid gap-3 pt-1 md:grid-cols-2">
            <IntelCard title="Community requests" note="Public posts from Canadians — moderated, personal details never shown.">
              <LiveCommunityFeed />
            </IntelCard>

            <div className="space-y-3">
              <section id="live-pricing" className="rounded-2xl border border-lm-line bg-lm-surface p-4">
                <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-lm-ink">
                  <DollarSign className="h-4 w-4 text-lm-teal" /> Pricing intelligence
                </h2>
                <p className="mt-1 text-[11.5px] text-lm-muted">Published rates and sourced public prices — advertised starting prices clearly separated from approved final prices.</p>
                <div className="mt-2"><RexPriceCompare /></div>
              </section>

              <section className="rounded-2xl border border-lm-line bg-lm-surface p-4">
                <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-lm-ink">
                  <MapPin className="h-4 w-4 text-lm-teal" /> Regional service opportunities
                </h2>
                <p className="mt-1 text-[11.5px] text-lm-muted">Permanent network coverage versus active, job-specific provider sourcing.</p>
                <div className="mt-2 space-y-2 text-[12px]">
                  <div>
                    <div className="font-plex text-[9px] font-bold uppercase tracking-[0.16em] text-lm-muted">Open matching activity</div>
                    {cov.loaded ? (
                      cov.matchingCityNames.length
                        ? <p className="mt-0.5 text-lm-ink">{cov.matchingCityNames.join(", ")}</p>
                        : <p className="mt-0.5 text-lm-muted">No cities currently awaiting contractor matches.</p>
                    ) : <LoadingLine />}
                  </div>
                  <div>
                    <div className="font-plex text-[9px] font-bold uppercase tracking-[0.16em] text-lm-muted">Providers being sourced</div>
                    {cov.loaded ? (
                      cov.recruitingCityNames.length
                        ? <p className="mt-0.5 text-lm-ink">{cov.recruitingCityNames.join(", ")}</p>
                        : <p className="mt-0.5 text-lm-muted">Every city with demand already has verified coverage or active matching.</p>
                    ) : <LoadingLine />}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-lm-line bg-lm-surface p-4">
                <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-lm-ink">
                  <Recycle className="h-4 w-4 text-lm-teal" /> Recycling resources
                </h2>
                <ul className="mt-2 space-y-1.5 text-[12px] font-semibold text-lm-teal">
                  <li><Link className="inline-flex items-center gap-1.5 hover:underline" to="/recycling-centers">Recycling centre directory <ArrowRight className="h-3 w-3" /></Link></li>
                  <li><Link className="inline-flex items-center gap-1.5 hover:underline" to="/recycling-assistant">Disposal advisor <ArrowRight className="h-3 w-3" /></Link></li>
                  <li><Link className="inline-flex items-center gap-1.5 hover:underline" to="/demand">Full market intelligence <ArrowRight className="h-3 w-3" /></Link></li>
                </ul>
              </section>

              <section className="rounded-2xl border border-lm-line bg-lm-surface p-4">
                <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-lm-ink">
                  <Users className="h-4 w-4 text-lm-teal" /> Get involved
                </h2>
                <ul className="mt-2 space-y-1.5 text-[12px] font-semibold text-lm-teal">
                  <li><Link className="inline-flex items-center gap-1.5 hover:underline" to="/community">Community &amp; requests <ArrowRight className="h-3 w-3" /></Link></li>
                  <li><Link className="inline-flex items-center gap-1.5 hover:underline" to="/request-service">Request a pickup <ArrowRight className="h-3 w-3" /></Link></li>
                  <li><Link className="inline-flex items-center gap-1.5 hover:underline" to="/move-assist">Plan a moving cleanout <ArrowRight className="h-3 w-3" /></Link></li>
                </ul>
              </section>
            </div>
          </div>

          <div id="live-methods">
            <IntelCard title="Methodology & data layers" note="What each measurement means, where it comes from, and how missing data is handled.">
              <HowItWorks />
            </IntelCard>
          </div>

          <Link
            to="/request-service"
            onClick={goRequest}
            className="block rounded-2xl border border-lm-line bg-lm-surface px-6 py-8 text-center transition-colors hover:border-lm-teal"
          >
            <div className="font-heading text-xl font-extrabold text-lm-ink">Ready to clear your space?</div>
            <div className="mt-1.5 text-[12.5px] text-lm-muted">Request a pickup in any Canadian city — you approve the price before anything is scheduled.</div>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-lm-amber px-5 py-2.5 text-[12.5px] font-bold text-[#241800]">
              Get my pickup estimate <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </main>
      </div>

      <BookNowBar city={filters.city} />
    </div>
  );
}

function LoadingLine() {
  return <p className="mt-0.5 flex items-center gap-1.5 text-lm-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading coverage records…</p>;
}