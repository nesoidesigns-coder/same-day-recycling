import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowRight,
  BarChart3,
  Globe2,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import CategoryDetail from "./CategoryDetail";
import CaptureGauges from "./CaptureGauges";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CATEGORY_LABELS } from "@/lib/demandShared";
import PulseRing, { formatCount, prefersReducedMotion, useCountUp } from "./PulseRing";

// Canadian Market Search Intelligence — the homepage interactive dashboard.
// Industry-wide estimated search demand for every tracked service category,
// from source-labeled DemandObservation records (Keyword Planner API /
// licensed datasets / Google Trends indices). Same Day Recycling's own
// operational counters are never shown here — they stay in the Recycling OS
// admin dashboards. Layers: demand estimates, relative-interest indices, and
// the site's own Search Console performance (tracked separately, on /demand).

const DemandMap = lazy(() => import("./DemandMap"));

const BASIS_LABEL = {
  keyword_planner: "Keyword Planner estimates",
  published_estimate: "Published industry estimates",
  admin_import: "Admin-imported estimates",
};

function TrendBadge({ pct, direction }) {
  if (pct === null || pct === undefined) {
    if (direction && direction !== "unknown") {
      const up = direction === "rising";
      const Icon = up ? TrendingUp : TrendingDown;
      return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${up ? "bg-[#187B65]/20 text-[#54D9AE]" : "bg-white/10 text-amber-200"}`}>
          <Icon className="h-3 w-3" /> {direction}
        </span>
      );
    }
    return null;
  }
  const up = pct >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${up ? "bg-[#187B65]/20 text-[#54D9AE]" : "bg-white/10 text-amber-200"}`}>
      <Icon className="h-3 w-3" /> {up ? "+" : ""}{pct}% vs prior period
    </span>
  );
}

function GaugeCell({ cat, selected, onSelect }) {
  const animate = !prefersReducedMotion();
  const display = useCountUp(cat.available ? cat.value : 0, { animate });
  const isIndex = cat.unit === "index";

  if (!cat.available) {
    return (
      <button
        onClick={onSelect}
        aria-pressed={selected}
        className={`rounded-2xl border px-4 py-5 text-center transition-colors ${selected ? "border-[#54D9AE]/60 bg-[#187B65]/15" : "border-[#187B65]/20 bg-white/[0.04] hover:border-[#187B65]/40"}`}
      >
        <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#187B65]/15">
          <Search className="h-4 w-4 text-[#187B65]" />
        </div>
        <div className="text-sm font-bold uppercase tracking-wider text-white/80">{cat.label}</div>
        <div className="mt-1 text-sm font-semibold text-[#54D9AE]">Data pending</div>
        <div className="mt-1 text-[10px] text-white/40">Awaiting a verified source estimate</div>
      </button>
    );
  }

  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex flex-col items-center gap-2 rounded-2xl border px-4 py-5 text-center transition-colors ${selected ? "border-[#54D9AE]/60 bg-[#187B65]/15" : "border-[#187B65]/20 bg-white/[0.04] hover:border-[#187B65]/40"}`}
    >
      <PulseRing value={cat.value} size={104} kind="activity" palette={isIndex ? "mint" : "emerald"}>
        <span className="text-lg font-extrabold text-white tabular-nums">
          {isIndex ? display : formatCount(display)}
        </span>
        <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-white/50">
          {isIndex ? "interest index" : "searches/mo"}
        </span>
      </PulseRing>
      <div className="text-sm font-bold text-white/90">{cat.label}</div>
      <TrendBadge pct={cat.trend_pct} direction={cat.trend_direction} />
      <div className="text-[10px] text-white/40 leading-tight">
        {cat.last_updated ? `Updated ${cat.last_updated}` : "Update date on file soon"}
        {cat.volume_basis?.length > 0 && (
          <span className="block">{BASIS_LABEL[cat.volume_basis[0]] || "Verified source data"}</span>
        )}
      </div>
    </button>
  );
}

// Interactive comparison bar chart across services for the current scope and
// period. Volume-based categories only — relative-interest indices are never
// charted on the same axis as search counts.
function ComparisonChart({ categories, period }) {
  const rows = (categories || []).filter((c) => c.available && c.unit === "searches");
  if (rows.length === 0) return null;
  const data = rows.map((c) => ({ name: c.label, volume: c.value })).sort((a, b) => b.volume - a.volume);
  const height = 56 + data.length * 30;

  return (
    <div className="mt-8 rounded-3xl border border-[#187B65]/25 bg-white/[0.04] p-5 sm:p-6">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
        <BarChart3 className="h-3.5 w-3.5 text-[#54D9AE]" /> Demand comparison across services — {period}
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }}>
            <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => formatCount(v)} />
            <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: "#e2e8f0" }} />
            <Tooltip
              formatter={(v) => [formatCount(v), "Est. searches/mo"]}
              contentStyle={{ background: "#0a2e24", border: "1px solid rgba(84,217,174,0.3)", borderRadius: 12, color: "#fff" }}
              labelStyle={{ color: "#54D9AE", fontWeight: 700 }}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <Bar dataKey="volume" fill="#54D9AE" radius={[0, 8, 8, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[10px] text-white/40">
        Click any service card above for its trend, year-over-year change, seasonal pattern and provincial/city
        breakdown. Index-only categories are excluded from this chart — indices are never charted as search counts.
      </p>
    </div>
  );
}

export default function RecyclingPulse() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState(null);
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [selectedCat, setSelectedCat] = useState("");
  const timerRef = useRef(null);

  const load = useCallback(async (silent) => {
    if (!silent) setLoading(true);
    try {
      const res = await base44.functions.invoke("demandReport", {});
      if (res.data?.market) {
        setData(res.data);
        setRefreshedAt(new Date());
      }
    } catch {
      // Keep the last successful snapshot; the stale badge communicates it.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    timerRef.current = setInterval(() => load(true), 900000); // periodic refresh
    return () => clearInterval(timerRef.current);
  }, [load]);

  const market = data?.market;
  const series = data?.series || [];
  const provinceList = market?.geo?.provinces || [];
  const cityList = (market?.geo?.cities || []).filter((c) => !province || c.province_code === province);

  // Reset the city filter whenever it no longer belongs to the chosen province.
  useEffect(() => {
    if (city && province && !cityList.some((c) => c.key === city)) setCity("");
  }, [province]); // eslint-disable-line react-hooks/exhaustive-deps

  const scopeKey = city || (province ? province : "CA");
  const scope = market?.scopes?.[scopeKey] || market?.scopes?.[scopeKey.toLowerCase()] || null;

  // City-level demand volumes for the map (deduplicated series rows, latest period).
  const cityVolumes = (() => {
    const map = {};
    for (const r of series) {
      if (r.geo_type !== "city" || !r.city) continue;
      const e = map[r.city] || (map[r.city] = { volume: 0, index: 0, updated: "" });
      e.volume += Number(r.est_monthly_volume) || 0;
      e.index = Math.max(e.index, Number(r.trend_index) || 0);
      e.updated = String(r.last_updated || "") > e.updated ? String(r.last_updated || "") : e.updated;
    }
    return map;
  })();

  const heroAnimate = !prefersReducedMotion();
  const heroDisplay = useCountUp(scope?.total?.available ? scope.total.value : 0, { duration: 1600, animate: heroAnimate });
  const periodLabel = scope?.latest_period
    ? `Reporting period ${scope.latest_period}`
    : market?.latest_period
      ? `Reporting period ${market.latest_period}`
      : "Reporting period —";

  const selected = selectedCat ? (scope?.categories || []).find((c) => c.category === selectedCat) : null;

  return (
    <section aria-label="Canadian Market Search Intelligence" className="admin-console relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-[#187B65]/25 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="flex flex-col items-center text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#187B65]/40 bg-[#187B65]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#54D9AE]">
            <Globe2 className="h-3.5 w-3.5" /> Canadian Market Search Intelligence
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            What Canada Is Searching For
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/70 sm:text-base">
            Industry-wide estimated search demand for recycling and removal services — across every company in the
            market, not just ours. Our own operating numbers stay private in Recycling OS administration.
          </p>
        </div>

        {/* Geographic filters */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <select
            aria-label="Province or territory filter"
            value={province}
            onChange={(e) => { setProvince(e.target.value); setCity(""); }}
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white focus:border-[#187B65] focus:outline-none [&>option]:text-[#102B2A]"
          >
            <option value="">All Canada</option>
            {provinceList.map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
          {cityList.length > 0 && (
            <select
              aria-label="City filter"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white focus:border-[#187B65] focus:outline-none [&>option]:text-[#102B2A]"
            >
              <option value="">All cities</option>
              {cityList.map((c) => (
                <option key={c.key} value={c.key}>{c.key}</option>
              ))}
            </select>
          )}
          {(province || city) && (
            <button
              onClick={() => { setProvince(""); setCity(""); }}
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/70 hover:text-white"
            >
              Reset to Canada
            </button>
          )}
        </div>

        {loading && !data ? (
          <div className="flex flex-col items-center gap-3 py-14" role="status" aria-label="Loading market data">
            <Loader2 className="h-8 w-8 animate-spin text-[#187B65]" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/50">Reading market data…</span>
          </div>
        ) : !market?.available ? (
          <div className="mx-auto mt-8 flex max-w-2xl flex-col items-center gap-3 rounded-3xl border border-[#187B65]/25 bg-white/[0.04] px-6 py-4 text-center sm:flex-row sm:rounded-full">
            <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
              <span className="mascot-ring absolute inline-flex h-full w-full rounded-full bg-[#54D9AE]" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#54D9AE]" />
            </span>
            <span className="text-sm font-semibold text-white/80">
              Market intelligence connecting — Canadian search-demand estimates appear here once the verified source goes live.
            </span>
            <Link to="/demand" className="shrink-0 text-xs font-bold text-[#54D9AE] hover:underline sm:ml-auto">
              How this works
            </Link>
          </div>
        ) : (
          <>
            {/* Prominent national (or scoped) estimated search-demand total */}
            <div className="mx-auto mt-8 max-w-2xl rounded-3xl border border-[#187B65]/30 bg-white/[0.05] p-6 text-center shadow-2xl sm:p-8">
              {scope?.total?.available ? (
                <>
                  <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#54D9AE]">
                    <Search className="h-4 w-4" /> Estimated Monthly Searches
                  </div>
                  <PulseRing value={scope.total.value} size={216} thickness={12} kind="activity" palette="emerald">
                    <span className="text-5xl font-extrabold text-white tabular-nums sm:text-6xl">{formatCount(heroDisplay)}</span>
                    <span className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-white/50">
                      {city || province || "Canada"} · {scope.latest_period}
                    </span>
                  </PulseRing>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <TrendBadge pct={scope.total.prev_value ? Math.round(((scope.total.value - scope.total.prev_value) / scope.total.prev_value) * 1000) / 10 : null} direction={null} />
                    <span className="text-[11px] text-white/50">
                      {scope.total.keywords} deduplicated keyword{scope.total.keywords === 1 ? "" : "s"}
                      {city ? ` in ${city}` : province ? ` in ${province}` : " across Canada"}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-white/40">{scope.level_note} · last update {scope.last_updated || "—"}</p>
                </>
              ) : (
                <>
                  <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#54D9AE]">
                    <Search className="h-4 w-4" /> Estimated Monthly Searches
                  </div>
                  <div className="py-6">
                    <Search className="mx-auto mb-2 h-8 w-8 text-[#187B65]" />
                    <div className="text-lg font-bold text-white">Data pending</div>
                    <p className="mx-auto mt-2 max-w-md text-sm text-white/60">{scope?.total?.note || scope?.note || "No defensible volume-based estimate on file for this geography yet."}</p>
                  </div>
                </>
              )}
            </div>

            {/* Service demand cards — click any card for its full demand detail */}
            <div className="mt-8">
              <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
                <span className="h-px flex-1 bg-white/10" /> Search demand by service category — {scope?.latest_period || market.latest_period}
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {(scope?.categories || []).map((cat) => (
                  <GaugeCell
                    key={cat.category}
                    cat={cat}
                    selected={selectedCat === cat.category}
                    onSelect={() => setSelectedCat(selectedCat === cat.category ? "" : cat.category)}
                  />
                ))}
              </div>
            </div>

            {/* Interactive comparison chart */}
            <ComparisonChart categories={scope?.categories} period={scope?.latest_period || market.latest_period} />

            {/* Our own verified capture — gold gauges, never mixed with market estimates */}
            <CaptureGauges capture={data?.capture} />

            {/* Selected category detail: trend, YoY, seasonality, geo breakdown */}
            {selected && (
              <CategoryDetail
                series={series}
                province={province}
                city={city}
                cat={selected}
                onClose={() => setSelectedCat("")}
              />
            )}

            {/* Interactive Canadian demand map */}
            {(market?.geo?.cities || []).length > 0 && (
              <div className="mt-8">
                <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
                  <MapPin className="h-3.5 w-3.5 text-[#54D9AE]" /> Select a city on the map
                  <span className="h-px flex-1 bg-white/10" />
                </div>
                <Suspense fallback={<div className="h-[340px] animate-pulse rounded-3xl border border-[#187B65]/25 bg-white/[0.03]" />}>
                  <DemandMap
                    cities={market.geo.cities}
                    volumes={cityVolumes}
                    selected={city}
                    onSelect={(key) => { setCity(key); setProvince(""); }}
                  />
                </Suspense>
                <p className="mt-2 text-[10px] text-white/40">
                  Markers appear only where verified city-level estimates are on file. Provincial and national figures
                  are never projected down to a city.
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[11px] text-white/40">
              <span>{periodLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                Last refreshed: {refreshedAt ? refreshedAt.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" }) : "—"}
              </span>
            </div>

            <p className="mx-auto mt-4 max-w-3xl text-center text-[11px] leading-relaxed text-white/40">
              Estimates, not exact counts, and never a measure of every individual Google search. Figures aggregate
              deduplicated, source-labeled keyword observations for the selected geography. Year-over-year changes
              appear only when the same month from the prior year is on file. Google Search Console visibility for
              Same Day Recycling is tracked separately on our demand page and is never used as market demand.
              {(scope?.sources || []).length > 0 && (
                <span className="block mt-1">Sources: {scope.sources.join(" · ")}</span>
              )}
            </p>
          </>
        )}

        {/* Conversion CTA — leads into the existing quote + booking flow */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#quote"
            className="group inline-flex items-center gap-2 rounded-full bg-[#187B65] px-8 py-4 text-base font-extrabold text-white shadow-lg shadow-[#187B65]/40 transition-all hover:bg-[#125C4E] hover:shadow-xl motion-safe:hover:scale-[1.02]"
          >
            Request Your Pickup
            <ArrowRight className="h-5 w-5 transition-transform motion-safe:group-hover:translate-x-1" />
          </a>
          <Link
            to="/demand"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-4 text-sm font-bold text-white/80 transition-colors hover:text-white"
          >
            <MapPin className="h-4 w-4" /> Explore demand by province &amp; city
          </Link>
        </div>
      </div>
    </section>
  );
}