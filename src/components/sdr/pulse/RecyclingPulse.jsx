import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Activity,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
} from "lucide-react";
import PulseRing, { formatCount, prefersReducedMotion, useCountUp } from "./PulseRing";

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
];

const PERIOD_LABEL = { today: "today", "7d": "the last 7 days", "30d": "the last 30 days" };

// Network-wide funnel metrics (period-based activity) and point-in-time
// local service-area capacity are labelled separately on purpose.
const NETWORK_METRICS = [
  { key: "unique_customers", label: "Unique Customers", icon: Users, palette: "emerald" },
  { key: "pickup_requests", label: "Pickup Requests", icon: Truck, palette: "mint" },
  { key: "confirmed_bookings", label: "Confirmed Bookings", icon: CalendarCheck, palette: "emerald" },
  { key: "completed_pickups", label: "Completed Pickups", icon: CheckCircle2, palette: "gold" },
];

const AREA_METRICS = [
  { key: "available_contractors", label: "Available Contractors", icon: Truck, palette: "gold" },
  { key: "verified_service_areas", label: "Verified Service Areas", icon: MapPin, palette: "mint" },
];

// Capacity metrics render as progress-vs-target gauges when the owner has set
// a target; everything else is an activity ring with no invented maximum.
const CAPACITY_KEYS = new Set(["available_contractors", "verified_service_areas"]);

function TrendBadge({ value, prev }) {
  if (prev === null || prev === undefined || value === null) return null;
  if (prev === 0) {
    return value > 0 ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#187B65]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#54D9AE]">
        <TrendingUp className="w-3 h-3" /> New activity
      </span>
    ) : null;
  }
  const pct = Math.round(((value - prev) / prev) * 100);
  const up = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
        up ? "bg-[#187B65]/20 text-[#54D9AE]" : "bg-white/10 text-amber-200"
      }`}
    >
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? "+" : ""}
      {pct}% vs previous period
    </span>
  );
}

function MetricCell({ metric, data }) {
  const Icon = metric.icon;
  const d = data || null;
  const animate = !prefersReducedMotion();
  const display = useCountUp(d?.value ?? 0, { animate });

  if (!d) {
    return (
      <div className="rounded-2xl border border-[#187B65]/20 bg-white/[0.04] px-4 py-5 text-center">
        <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#187B65]/15">
          <Icon className="h-4 w-4 text-[#187B65]" />
        </div>
        <div className="text-xs font-bold uppercase tracking-wider text-white/60">{metric.label}</div>
        <div className="mt-1 text-sm font-semibold text-[#54D9AE]">Awaiting verified data</div>
      </div>
    );
  }

  const hasTarget = CAPACITY_KEYS.has(metric.key) && d.target > 0;

  return (
    <div className="rounded-2xl border border-[#187B65]/20 bg-white/[0.04] px-4 py-5 flex flex-col items-center gap-2">
      <PulseRing
        value={d.value}
        size={112}
        kind={hasTarget ? "target" : "activity"}
        target={d.target}
        palette={metric.palette}
      >
        <span className="text-2xl font-extrabold text-white tabular-nums">{formatCount(display)}</span>
      </PulseRing>
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white/70">
        <Icon className="h-3.5 w-3.5 text-[#187B65]" /> {metric.label}
      </div>
      {hasTarget ? (
        <div className="text-[11px] font-semibold text-white/50">target: {formatCount(d.target)}</div>
      ) : (
        <TrendBadge value={d.value} prev={d.prev} />
      )}
    </div>
  );
}

// Canada's Recycling Pulse — premium live public-intelligence dashboard.
// Aggregated, verified operational metrics only; no personal data.
export default function RecyclingPulse() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState(null);
  const timerRef = useRef(null);

  const load = useCallback(
    async (silent) => {
      if (!silent) setLoading(true);
      try {
        const res = await base44.functions.invoke("publicPulse", { period });
        const d = res.data || {};
        if (d.metrics) {
          setData(d);
          setRefreshedAt(new Date());
        }
      } catch (e) {
        // Keep the last successful snapshot; the stale badge communicates it.
      } finally {
        setLoading(false);
      }
    },
    [period],
  );

  useEffect(() => {
    load();
    timerRef.current = setInterval(() => load(true), 90000); // periodic refresh
    return () => clearInterval(timerRef.current);
  }, [load]);

  const m = data?.metrics || null;
  const hero = m?.service_inquiries;
  const heroAnimate = !prefersReducedMotion();
  const heroDisplay = useCountUp(hero?.value ?? 0, { duration: 1600, animate: heroAnimate });
  const disabled = Object.keys(m || {}).filter((k) => m[k]?.disabled);

  return (
    <section aria-label="Canada's Recycling Pulse live metrics" className="admin-console relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute left-1/2 top-0 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-[#187B65]/25 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="flex flex-col items-center text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#187B65]/40 bg-[#187B65]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-[#54D9AE]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#54D9AE] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#54D9AE]" />
            </span>
            Live from Recycling OS
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Canada's Recycling Pulse
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/70 sm:text-base">
            Real, aggregated demand for Same Day Recycling — counted directly from verified service records.
            Personal details are never shown; test and internal traffic is always excluded.
          </p>

          <div className="mt-5 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1" role="tablist" aria-label="Reporting period">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                role="tab"
                aria-selected={period === p.key}
                onClick={() => setPeriod(p.key)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                  period === p.key ? "bg-[#187B65] text-white shadow" : "text-white/60 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Primary metric — Service Inquiries */}
        <div className="mx-auto mt-8 max-w-2xl rounded-3xl border border-[#187B65]/30 bg-white/[0.05] p-6 text-center shadow-2xl sm:p-8">
          {loading && !data ? (
            <div className="flex flex-col items-center gap-3 py-6" role="status" aria-label="Loading metrics">
              <div className="h-28 w-28 animate-spin rounded-full border-4 border-[#187B65]/20 border-t-[#187B65]" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/50">Reading verified records…</span>
            </div>
          ) : hero?.disabled ? null : hero?.available ? (
            <>
              <div className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#54D9AE]">
                <Activity className="h-4 w-4" /> Service Inquiries
              </div>
              <PulseRing value={hero.value} size={216} thickness={12} kind="activity" palette="emerald">
                <span className="text-6xl font-extrabold text-white tabular-nums sm:text-7xl">{formatCount(heroDisplay)}</span>
                <span className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-white/50">
                  {PERIOD_LABEL[period]}
                </span>
              </PulseRing>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <TrendBadge value={hero.value} prev={hero.prev} />
                <span className="text-[11px] text-white/50">
                  Inquiries are requests for service — distinct from bookings and completed jobs below.
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6">
              <ShieldCheck className="h-8 w-8 text-[#187B65]" />
              <div className="text-lg font-bold text-white">Awaiting verified data</div>
              <p className="max-w-sm text-sm text-white/60">
                No verified service-inquiry records can be confirmed for this period yet. We publish only counts we
                can verify — never estimates.
              </p>
            </div>
          )}
        </div>

        {/* Network-wide activity */}
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
            <span className="h-px flex-1 bg-white/10" /> Network-wide activity — {PERIOD_LABEL[period]}
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {NETWORK_METRICS.map((metric) => (
              <MetricCell key={metric.key} metric={metric} data={m?.[metric.key]} />
            ))}
          </div>
        </div>

        {/* Local service area (point-in-time capacity, not period-based) */}
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
            <span className="h-px flex-1 bg-white/10" /> Local service area — current capacity
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {AREA_METRICS.map((metric) => (
              <MetricCell key={metric.key} metric={metric} data={m?.[metric.key]} />
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[11px] text-white/40">
          <span>Reporting period: {PERIOD_LABEL[period]}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Last refreshed: {refreshedAt ? refreshedAt.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" }) : "—"}
          </span>
          {disabled.length > 0 && <span aria-hidden="true">·</span>}
          {disabled.length > 0 && <span>{disabled.length} metric(s) hidden by the operator</span>}
        </div>

        {/* Conversion CTA — leads into the existing quote + booking flow */}
        <div className="mt-8 text-center">
          <a
            href="#quote"
            className="group inline-flex items-center gap-2 rounded-full bg-[#187B65] px-8 py-4 text-base font-extrabold text-white shadow-lg shadow-[#187B65]/40 transition-all hover:bg-[#125C4E] hover:shadow-xl motion-safe:hover:scale-[1.02]"
          >
            Request Your Pickup
            <ArrowRight className="h-5 w-5 transition-transform motion-safe:group-hover:translate-x-1" />
          </a>
          <p className="mt-2 text-xs text-white/50">Instant quote, then booking — the same flow Rex and our dispatch team use.</p>
        </div>
      </div>
    </section>
  );
}