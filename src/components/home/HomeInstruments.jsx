import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import useLiveGauge from "@/hooks/useLiveGauge";
import { LIVE_CATEGORIES, DEMAND_TYPE_LABELS } from "@/lib/liveCategories";
import StatRail from "@/components/intel/StatRail";
import DemandDonut from "@/components/intel/DemandDonut";
import MetricTiles from "@/components/intel/MetricTiles";
import DemandMapCard from "@/components/intel/DemandMapCard";
import CategoryTiles from "@/components/intel/CategoryTiles";
import IntelCard from "@/components/intel/IntelCard";

const PERIOD = "90-day window";

// The homepage opens exactly like the reference dashboard: the title row, then
// the verified rail beside the demand ring, with the readings and the national
// map, and the service strip underneath. Every figure is a real record.
export default function HomeInstruments() {
  const navigate = useNavigate();
  const cov = useCoverageStatus();
  const { data: gauge, loading } = useLiveGauge({ province: "", city: "", category: "", days: 90 });

  const rows = useMemo(
    () =>
      Object.keys(LIVE_CATEGORIES).map((key) => ({
        key,
        label: LIVE_CATEGORIES[key],
        count: gauge?.rows?.find((r) => r.key === key)?.count || 0,
      })),
    [gauge]
  );

  const total = gauge?.total || 0;
  const topRow = [...rows].sort((a, b) => b.count - a.count)[0] || null;
  const topCity = gauge?.cities?.[0] || null;
  const monitored =
    (cov.verifiedCityNames?.length || 0) + (cov.matchingCityNames?.length || 0) + (cov.recruitingCityNames?.length || 0);

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

  const updatedAt = gauge?.generated_at
    ? new Date(gauge.generated_at).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div className="space-y-3">
      {/* Title row — what this is, how fresh, and the way to book */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-[22px] font-extrabold leading-tight tracking-tight text-lm-ink">
            Same-Day Junk Removal Across Canada <span className="font-semibold text-lm-muted">• Same Day Recycling</span>
          </h1>
          <p className="mt-0.5 text-[11.5px] text-lm-muted">
            {updatedAt ? `Live service intelligence · last updated ${updatedAt}` : "Connecting to verified records…"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-full border border-lm-line bg-lm-surface p-0.5">
            {["7D", "30D", "90D"].map((label) => (
              <Link
                key={label}
                to="/live"
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors ${
                  label === "90D" ? "bg-lm-teal text-white" : "text-lm-muted hover:text-lm-ink"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          <Link
            to="/request-service"
            className="inline-flex items-center gap-1.5 rounded-full bg-lm-amber px-4 py-2 text-[12px] font-bold text-[#241800] shadow-sm transition hover:brightness-95"
          >
            Get pickup estimate <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Instrument row */}
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="lg:col-span-3 xl:col-span-2">
          <StatRail
            cov={cov}
            monitored={monitored}
            regionalName={topCity?.city || ""}
            regionalCount={topCity?.count || null}
            loading={!cov.loaded}
          />
        </div>

        <div className="rounded-2xl border border-lm-line bg-lm-surface p-4 shadow-[0_1px_2px_rgba(18,61,55,0.04)] lg:col-span-5">
          <DemandDonut
            total={total}
            rows={rows}
            loading={loading}
            selected=""
            onSelect={() => navigate("/services")}
            periodLabel={PERIOD}
            updatedAt={updatedAt}
          />
        </div>

        <div className="space-y-3 lg:col-span-4 xl:col-span-5">
          <MetricTiles
            total={total}
            periodLabel={PERIOD}
            topType={topType}
            change={change}
            trend={gauge?.trend || []}
            focusLabel=""
            focusCount={null}
          />
          <IntelCard
            title="Cities with observed demand"
            note="Verified records only — clusters grow as real requests arrive."
            bodyClass="p-3"
            action={
              <Link to="/coverage" className="shrink-0 text-[10.5px] font-bold text-lm-teal hover:underline">
                All cities
              </Link>
            }
          >
            <DemandMapCard cities={gauge?.cities || []} selected="" onSelect={() => navigate("/coverage")} />
          </IntelCard>
        </div>
      </div>

      {/* Service strip */}
      <div className="rounded-2xl border border-lm-line bg-lm-surface p-2 shadow-[0_1px_2px_rgba(18,61,55,0.04)]">
        <CategoryTiles rows={rows} total={total} selected="" onSelect={() => navigate("/services")} />
      </div>

      {topRow && topRow.count > 0 && (
        <p className="px-1 text-[11px] text-lm-muted">
          Busiest service right now: <span className="font-bold text-lm-ink">{topRow.label}</span> with {topRow.count} verified records in the {PERIOD}.
        </p>
      )}
    </div>
  );
}