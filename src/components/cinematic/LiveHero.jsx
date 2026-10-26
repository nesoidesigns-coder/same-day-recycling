import { Link } from "react-router-dom";
import { ArrowRight, Recycle } from "lucide-react";
import { LIVE_CATEGORIES, DEMAND_TYPE_LABELS } from "@/lib/liveCategories";
import { setRexContext } from "@/lib/rexSession";
import RadarInstrument, { deriveModel, periodLabel } from "@/components/cinematic/RadarInstrument";
import { REGIONS } from "@/lib/regions";
import { CITIES } from "@/lib/cities";

const DAY_OPTIONS = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: 365, label: "12 months" },
];

const chipClass = (active) =>
  `shrink-0 snap-start rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
    active ? "bg-cine-cyan text-[#0a1220]" : "border border-cine-line/70 text-cine-ink hover:border-cine-cyan/50"
  }`;

// Floating indicator: elegant typography with a hairline connector reaching
// toward the instrument. On mobile the connector disappears and the
// indicators reflow beneath the instrument in a compact grid.
function Indicator({ label, value, note, side = "right", pending = false }) {
  return (
    <div className={`flex items-center gap-3 ${side === "left" ? "lg:flex-row-reverse lg:text-right" : ""}`}>
      <div className="hidden w-12 shrink-0 lg:block" aria-hidden="true">
        <span className={`block h-px w-full bg-gradient-to-r ${side === "left" ? "from-cine-cyan/60 to-cine-cyan/0" : "from-cine-cyan/0 to-cine-cyan/60"}`} />
      </div>
      <div className="min-w-0">
        <div className="font-plex text-[9px] font-bold uppercase tracking-[0.22em] text-cine-muted">{label}</div>
        <div className={`mt-0.5 truncate text-lg font-bold tabular-nums ${pending || value == null ? "text-cine-muted" : "text-cine-ink"}`}>
          {value ?? "—"}
        </div>
        <div className="text-[10px] leading-snug text-cine-muted">{note}</div>
      </div>
    </div>
  );
}

// The immersive first viewport: compact branding and title on top, the large
// Canadian Service Radar at centre with floating indicators on both flanks,
// and category navigation plus the pricing/booking pathway at the bottom.
// Advanced filters and methodology live in discreet expandables.
export default function LiveHero({ data, loading, error, filters, onFilter, pickCategory, focusCity, cov, pulseKey }) {
  const m = deriveModel(data);
  const monitored = (cov.verifiedCityNames?.length || 0) + (cov.matchingCityNames?.length || 0) + (cov.recruitingCityNames?.length || 0);
  const refreshedAt = data?.generated_at
    ? new Date(data.generated_at).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : null;
  const topType = Object.entries(m.typeAgg).sort((a, b) => b[1] - a[1])[0];
  const topCity = m.cityList[0];

  const cityOptions = CITIES.filter((c) => !filters.province || String(c.province || "") === (REGIONS.find((r) => r.code === filters.province)?.name || ""));

  const goRequest = () =>
    setRexContext({
      page: "live",
      ...(filters.city ? { city: filters.city } : {}),
      ...(filters.category ? { intent: `Exploring ${LIVE_CATEGORIES[filters.category]} on Live Intelligence` } : {}),
    });

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden bg-cine-bg">
      {/* ambient atmosphere */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-48 left-1/2 h-[560px] w-[900px] max-w-none -translate-x-1/2 rounded-full cine-glow" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 50% 42%, transparent 42%, rgba(16, 43, 42, 0.06) 100%)" }}
      />

      {/* top — compact branding, title, data freshness, service action */}
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 pt-4">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cine-cyan/40 bg-cine-cyan/10">
            <Recycle className="h-4 w-4 text-cine-cyan" />
          </span>
          <div className="min-w-0">
            <h1 className="text-sm font-bold tracking-tight text-cine-ink sm:text-base">Live Intelligence</h1>
            <p className="truncate font-plex text-[9px] uppercase tracking-[0.28em] text-cine-muted">Canadian Service Radar · Same Day Recycling</p>
          </div>
        </Link>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-1.5 font-plex text-[10px] text-cine-muted md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {refreshedAt ? `Updated ${refreshedAt}` : "Connecting…"}
          </span>
          <Link
            to="/request-service"
            onClick={goRequest}
            className="btn-float inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2.5 text-xs font-bold text-[#0a1220] transition hover:brightness-95 sm:px-5"
          >
            Get Pickup Estimate <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* centre — the instrument, flanked by floating intelligence indicators */}
      <div className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.1fr)_minmax(0,1fr)] lg:gap-4">
        <div className="order-2 grid grid-cols-2 gap-x-4 gap-y-5 lg:order-1 lg:flex lg:flex-col lg:gap-8">
          <Indicator side="left" label="Verified coverage" value={cov.loaded ? `${cov.verifiedCityNames.length}/${monitored}` : null} note="cities with a verified contractor" pending={!cov.loaded} />
          <Indicator
            side="left"
            label="Regional focus"
            value={filters.city || topCity?.city || null}
            note={filters.city ? "observing this city" : topCity ? `${topCity.count} records · largest observed` : "Regional data pending"}
          />
          <Indicator side="left" label="Matching activity" value={cov.loaded ? cov.matchingCityNames.length || null : null} note="cities matching open requests" pending={!cov.loaded} />
          <Indicator side="left" label="Recruiting" value={cov.loaded ? cov.recruitingCityNames.length || null : null} note="cities welcoming contractors" pending={!cov.loaded} />
        </div>

        <div className="order-1 lg:order-2">
          <RadarInstrument
            data={data}
            loading={loading}
            error={error}
            selected={filters.category}
            onSelect={pickCategory}
            days={filters.days}
            coverage={cov.loaded ? { verified: cov.verifiedCityNames.length, monitored } : null}
            onCityClick={focusCity}
            pulseKey={pulseKey}
          />
        </div>

        <div className="order-3 grid grid-cols-2 gap-x-4 gap-y-5 lg:flex lg:flex-col lg:gap-8">
          <Indicator side="right" label="Demand observations" value={m.total || null} note={m.total ? `verified records · ${periodLabel(filters.days)}` : "Collecting observations"} />
          <Indicator
            side="right"
            label="Evidence mix"
            value={topType ? DEMAND_TYPE_LABELS[topType[0]] || topType[0] : null}
            note={topType ? `${topType[1]} records · largest type` : "No verified signals in this period"}
          />
          <Indicator
            side="right"
            label="Demand change"
            value={m.change ? `${m.change.delta >= 0 ? "+" : "−"}${Math.abs(m.change.delta)}` : null}
            note={m.change ? `${m.change.prev} → ${m.change.last} complete months` : "Trend history developing"}
          />
          <Indicator
            side="right"
            label="Category focus"
            value={filters.category ? m.rows.find((r) => r.key === filters.category)?.count ?? 0 : null}
            note={filters.category ? LIVE_CATEGORIES[filters.category] : "All eight service categories"}
          />
        </div>
      </div>

      {/* bottom — category navigation + the pathway to pricing and booking */}
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-5">
        <div className="flex flex-col gap-3 border-t border-cine-line/50 pt-3">
          <div className="flex snap-x gap-2 overflow-x-auto pb-1">
            <button onClick={() => pickCategory("")} className={chipClass(!filters.category)}>
              All categories
            </button>
            {m.rows.map((r) => (
              <button key={r.key} onClick={() => pickCategory(r.key)} className={chipClass(filters.category === r.key)}>
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: r.count ? r.fill : "#3A4A63" }} />
                {r.label} <span className="tabular-nums opacity-70">{r.count}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <details className="min-w-0">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 font-plex text-[10px] font-bold uppercase tracking-[0.2em] text-cine-muted transition-colors hover:text-cine-cyan">
                Refine · region &amp; period
              </summary>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <select value={filters.province} onChange={(e) => onFilter("province", e.target.value)} className="cine-input w-auto min-w-[150px]" aria-label="Province">
                  <option value="">All Canada</option>
                  {REGIONS.map((r) => (
                    <option key={r.code} value={r.code}>{r.name}</option>
                  ))}
                </select>
                <select value={filters.city} onChange={(e) => onFilter("city", e.target.value)} className="cine-input w-auto min-w-[150px]" aria-label="City" disabled={!filters.province}>
                  <option value="">All cities</option>
                  {cityOptions.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <div className="flex gap-1.5" role="group" aria-label="Reporting period">
                  {DAY_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => onFilter("days", o.value)}
                      className={`rounded-full px-3 py-1.5 font-plex text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        filters.days === o.value ? "bg-cine-cyan/15 text-cine-cyan ring-1 ring-cine-cyan/50" : "border border-cine-line/60 text-cine-muted hover:text-cine-ink"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </details>
            <div className="flex flex-wrap items-center gap-4">
              <a href="#live-pricing" className="font-plex text-[10px] font-bold uppercase tracking-[0.2em] text-cine-muted transition-colors hover:text-cine-cyan">
                Pricing intelligence
              </a>
              <a href="#live-methods" className="hidden font-plex text-[10px] font-bold uppercase tracking-[0.2em] text-cine-muted transition-colors hover:text-cine-cyan sm:inline">
                Methodology
              </a>
              <Link
                to="/request-service"
                onClick={goRequest}
                className="inline-flex items-center gap-1.5 rounded-full border border-cine-cyan/50 px-4 py-2 text-xs font-bold text-cine-cyan transition hover:bg-cine-cyan/10"
              >
                Book a pickup <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}