import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { useSEO } from "@/lib/seo";
import useLiveGauge from "@/hooks/useLiveGauge";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import { CITIES } from "@/lib/cities";
import { LIVE_CATEGORIES, LIVE_CATEGORY_SHORT, DEMAND_TYPE_LABELS } from "@/lib/liveCategories";
import { setRexContext } from "@/lib/rexSession";
import ConsoleShell from "@/components/console/ConsoleShell";
import MetricColumn from "@/components/console/MetricColumn";
import DemandRadar from "@/components/console/DemandRadar";
import InsightColumn from "@/components/console/InsightColumn";
import ConsoleMapCard from "@/components/console/ConsoleMapCard";
import CategoryStrip from "@/components/console/CategoryStrip";
import ActivityTable from "@/components/console/ActivityTable";
import CityRanking from "@/components/console/CityRanking";
import RexPanel from "@/components/console/RexPanel";

const WINDOWS = [
  { value: 7, label: "7D" },
  { value: 30, label: "30D" },
  { value: 90, label: "90D" },
];

const periodLabel = (days) => ({ 7: "7-day window", 30: "30-day window", 90: "90-day window" }[days] || `${days}-day window`);

// The national console: verified Canadian service demand, read four ways at
// once. Every figure is a real record in the selected window and missing data
// reads as a dash.
export default function ServiceIntelligencePrototype() {
  useSEO({
    title: "Live Canadian Service Intelligence | Same Day Recycling",
    description:
      "See what Canadians are searching for, get an instant estimate, and book a verified local provider — all in one place. Live demand, verified coverage and transparent pricing across Canada.",
    path: "/",
    robots: "index, follow",
  });

  const cov = useCoverageStatus();
  const [days, setDays] = useState(30);
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");

  const { data: gauge, loading, error } = useLiveGauge({ days, province: "", city: "", category: "" });

  const rows = useMemo(
    () =>
      Object.keys(LIVE_CATEGORIES).map((key) => ({
        key,
        label: LIVE_CATEGORIES[key],
        short: LIVE_CATEGORY_SHORT[key],
        count: gauge?.rows?.find((r) => r.key === key)?.count || 0,
      })),
    [gauge]
  );

  const total = gauge?.total || 0;
  const topRow = useMemo(() => [...rows].sort((a, b) => b.count - a.count)[0], [rows]);
  const selectedRow = rows.find((r) => r.key === category) || null;
  const topCity = gauge?.cities?.[0]?.city || "";
  const focusCity = city || topCity;
  const focusCount = focusCity
    ? gauge?.cities?.find((c) => c.city.toLowerCase() === focusCity.toLowerCase())?.count ?? null
    : null;

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

  const microBars = useMemo(() => {
    const counts = (gauge?.cities || []).slice(0, 8).map((c) => c.count);
    const max = Math.max(1, ...counts);
    return counts.length ? counts.map((c) => (c / max) * 100) : null;
  }, [gauge]);

  const monitored = (cov.verifiedCityNames?.length || 0) + (cov.matchingCityNames?.length || 0) + (cov.recruitingCityNames?.length || 0);
  const updatedAt = gauge?.generated_at
    ? new Date(gauge.generated_at).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : null;

  const toggleCategory = (key) => setCategory((current) => (current === key ? "" : key));
  const focusOnCity = (name) => setCity((current) => (current === name ? "" : name));

  return (
    <ConsoleShell>
      <div className="space-y-3">
        {/* Page header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-[26px] font-extrabold leading-tight tracking-tight text-cn-ink">Live Intelligence</h1>
            <p className="console-label mt-1">Canadian service radar · Same Day Recycling</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] text-cn-muted">
              {error ? "Signal unavailable — retrying on refresh" : updatedAt ? <>Last updated {updatedAt}</> : <><Loader2 className="h-3 w-3 animate-spin" /> Connecting</>}
            </span>
            <div className="flex items-center gap-0.5 rounded-lg border border-cn-line p-0.5" role="group" aria-label="Reporting window">
              {WINDOWS.map((w) => (
                <button
                  key={w.value}
                  onClick={() => setDays(w.value)}
                  aria-pressed={days === w.value}
                  className={`rounded-md px-2.5 py-1.5 font-plex text-[10.5px] font-bold transition-colors ${
                    days === w.value ? "bg-[hsl(var(--cn-teal)/0.18)] text-cn-teal" : "text-cn-muted hover:text-cn-ink"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
            <Link
              to="/request-service"
              onClick={() => setRexContext({ page: "home", city: focusCity, intent: "Viewing national demand" })}
              className="rounded-lg bg-cn-orange px-3.5 py-2 text-[12px] font-bold text-white transition-opacity hover:opacity-90"
            >
              Get Pickup Estimate
            </Link>
          </div>
        </div>

        {/* Radar hub */}
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-3"><MetricColumn
            cov={cov}
            monitored={monitored}
            regionalName={focusCity}
            regionalCount={focusCount}
            microBars={microBars}
            loading={loading}
          /></div>
          <div className="lg:col-span-3"><DemandRadar
            rows={rows}
            total={total}
            loading={loading}
            selected={category}
            onSelect={toggleCategory}
            periodLabel={periodLabel(days)}
            updatedAt={updatedAt}
          /></div>
          <div className="lg:col-span-3"><InsightColumn
            total={total}
            topType={topType}
            change={change}
            trend={gauge?.trend || []}
            selectedRow={selectedRow}
            periodLabel={periodLabel(days)}
          /></div>
          <div className="lg:col-span-3"><ConsoleMapCard cities={gauge?.cities || []} selected={focusCity} onSelect={focusOnCity} /></div>
        </div>

        {/* Markets */}
        <CategoryStrip rows={rows} total={total} selected={category} onSelect={toggleCategory} />

        {/* Activity, cities, Rex */}
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-6"><ActivityTable recent={gauge?.recent || []} loading={loading} /></div>
          <div className="lg:col-span-3"><CityRanking cities={gauge?.cities || []} selected={focusCity} onSelect={focusOnCity} /></div>
          <div className="lg:col-span-3"><RexPanel
            total={total}
            topRow={selectedRow || topRow}
            verifiedCities={cov.verifiedCityNames?.length || 0}
            recruitingCities={cov.recruitingCityNames?.length || 0}
            periodLabel={periodLabel(days)}
          /></div>
        </div>

        {/* Closing action */}
        <div className="console-panel flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div className="min-w-0">
            <div className="font-heading text-[14px] font-bold text-cn-ink">Ready to clear your space?</div>
            <p className="text-[11px] text-cn-muted">
              Enter your postal code and see your price — you approve it before anything is scheduled.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/coverage" className="rounded-lg border border-cn-line px-3 py-2 text-[11.5px] font-bold text-cn-ink hover:border-cn-teal hover:text-cn-teal">
              Check coverage
            </Link>
            <Link
              to="/request-service"
              className="inline-flex items-center gap-1.5 rounded-lg bg-cn-orange px-4 py-2 text-[12px] font-bold text-white hover:opacity-90"
            >
              Get my estimate <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1 text-[10.5px] text-cn-muted">
          <span>© {new Date().getFullYear()} Same Day Recycling · Verified Canadian service data</span>
          <div className="flex items-center gap-3">
            <span>{CITIES.length} cities in the registry</span>
            <a href="tel:+16048491745" className="font-semibold text-cn-ink hover:text-cn-teal">(604) 849-1745</a>
          </div>
        </footer>
      </div>
    </ConsoleShell>
  );
}