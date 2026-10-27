import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Clock, MapPin } from "lucide-react";
import HeroDemandGauge from "./HeroDemandGauge";

const LEVELS = [
  { label: "High", className: "bg-cn-orange" },
  { label: "Moderate", className: "bg-[#00B5AD]" },
  { label: "Low", className: "bg-[hsl(var(--ri-emerald))]" },
];

const levelOf = (count) => (count >= 3 ? "High" : count === 2 ? "Moderate" : "Low");
const dotClass = { High: "bg-cn-orange", Moderate: "bg-[#00B5AD]", Low: "bg-[hsl(var(--ri-emerald))]" };

// Above the fold: the promise, the live gauge, and the country's current
// activity read in one glance.
export default function LandingHero({ total, cities = [], periodLabel, loading, updatedAt }) {
  const top = cities.slice(0, 5);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[hsl(var(--ri-mint)/0.55)] to-[hsl(var(--ri-ivory))]">
      <div className="mx-auto max-w-[1280px] px-4 py-7 md:py-10">
        <div className="grid gap-4 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-4">
            <div className="font-plex text-[10px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--ri-emerald-ink))]">
              Canada&apos;s same day junk removal
            </div>
            <h1 className="mt-2 font-heading text-[34px] font-extrabold leading-[1.06] tracking-tight text-lm-ink md:text-[42px]">
              Real Demand. Real People. Cleaner Canada.
            </h1>
            <p className="mt-3 max-w-md text-[14px] leading-relaxed text-lm-muted">
              Live demand from across Canada, verified local contractors, and transparent pricing.
              Enter your postal code, see your estimate, and book the pickup you approve.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Link
                to="/request-service"
                className="inline-flex items-center gap-2 rounded-xl bg-cn-orange px-5 py-3 text-[13.5px] font-bold text-white shadow-sm transition-opacity hover:opacity-90"
              >
                Get my estimate <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/live"
                className="inline-flex items-center gap-2 rounded-xl border border-lm-line bg-white px-4 py-3 text-[13.5px] font-bold text-lm-ink transition-colors hover:border-[hsl(var(--lm-teal))] hover:text-[hsl(var(--lm-teal))]"
              >
                Explore live intelligence
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] font-semibold text-lm-muted">
              <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-[hsl(var(--lm-teal))]" /> Same-day pickup</span>
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-[hsl(var(--lm-teal))]" /> Verified contractors</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[hsl(var(--lm-teal))]" /> Coast to coast</span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <HeroDemandGauge total={total} periodLabel={periodLabel} loading={loading} updatedAt={updatedAt} />
          </div>

          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-lm-line bg-white p-4 shadow-[0_1px_2px_rgba(16,43,42,0.04)]">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-[13px] font-bold text-lm-ink">Live search activity</h2>
                <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--ri-emerald))]" />
              </div>

              <ul className="mt-2.5 space-y-1.5">
                {top.map((c) => (
                  <li key={c.city} className="flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClass[levelOf(c.count)]}`} />
                    <span className="min-w-0 flex-1 truncate text-[11.5px] font-semibold text-lm-ink">{c.city}</span>
                    <span className="font-plex text-[10px] font-bold text-lm-muted tabular-nums">{c.count}</span>
                  </li>
                ))}
                {!top.length && (
                  <li className="py-2 text-[11px] text-lm-muted">
                    {loading ? "Loading verified activity…" : "Awaiting verified activity in this window."}
                  </li>
                )}
              </ul>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-lm-line pt-2.5">
                {LEVELS.map((l) => (
                  <span key={l.label} className="flex items-center gap-1 text-[10px] font-semibold text-lm-muted">
                    <span className={`h-1.5 w-1.5 rounded-full ${l.className}`} /> {l.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}