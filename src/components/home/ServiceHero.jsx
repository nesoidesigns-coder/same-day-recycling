import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, MotionConfig } from "framer-motion";
import { ArrowRight, Clock, MapPin, Phone } from "lucide-react";
import NationalDemandGauge from "@/components/os/NationalDemandGauge";
import { LIVE_CATEGORIES } from "@/lib/liveCategories";
import useLiveGauge from "@/hooks/useLiveGauge";
import { useIntelligence } from "@/lib/intelligenceContext";

// Homepage hero — "Canada in Motion". Booking action first and most prominent;
// the National Demand Gauge sits beside it as a premium intelligence
// instrument (midnight-navy panel), never ahead of the booking action.
// Gauge data: verified platform records only (liveIntelligence gauge feed) —
// outer arc, categories and momentum are each computed and labelled from real
// counts; nothing is estimated or simulated.

const EASE = [0.22, 1, 0.36, 1];
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } };

const fmtTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString("en-CA", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Vancouver",
    });
  } catch {
    return "";
  }
};

export default function ServiceHero() {
  const navigate = useNavigate();
  const { selection, setSelection } = useIntelligence();
  const [place, setPlace] = useState(selection.city || "");

  const { data: g30, loading: l30, error: e30 } = useLiveGauge({ days: 30 });
  const { data: g90 } = useLiveGauge({ days: 90 });

  const total30 = g30?.total ?? null;
  const total90 = g90?.total ?? 0;
  const rows = (g30?.rows || []).slice().sort((a, b) => b.count - a.count);
  const topCity = (g30?.cities || [])[0];
  const topCategory = rows[0];
  const updatedAt = g30?.generated_at ? fmtTime(g30.generated_at) : null;

  // Outer arc: last-30-day activity as a share of the trailing 90-day window.
  const arcShare = total30 != null && total90 > 0 ? total30 / total90 : 0;

  // Momentum: last 30 days vs the average of the prior 30-day periods inside
  // the 90-day window. Only computed from real counts — otherwise withheld.
  const priorAvg = total90 > 0 && total30 != null ? (total90 - total30) / 2 : null;
  const momentum =
    total30 != null && priorAvg != null && priorAvg > 0
      ? { pct: Math.round(((total30 - priorAvg) / priorAvg) * 100), label: `Momentum vs prior 30-day average (${priorAvg.toFixed(1)} avg)` }
      : total30 != null && total30 > 0 && total90 > 0
        ? { pct: 100, label: "Momentum: no prior-period records in the 90-day window yet" }
        : null;

  const regionalReading = topCity ? `${topCity.city} · ${topCity.count}` : "Awaiting data";
  const interestReading = topCategory ? `${LIVE_CATEGORIES[topCategory.key] || topCategory.key} · ${topCategory.count}` : "Awaiting data";

  const startService = () => {
    const q = place.trim() ? `?city=${encodeURIComponent(place.trim())}` : "";
    setSelection(place.trim() ? { city: place.trim() } : {});
    navigate(`/request-service${q}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-ri-ivory via-ri-ivory to-na-cloud">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-24 h-80 w-80 rounded-full"
        style={{ background: "radial-gradient(circle, hsl(var(--na-teal) / 0.10), transparent 70%)" }}
      />
      <MotionConfig reducedMotion="user">
        <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-4 py-8 md:px-8 md:py-20 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* Left — the booking action, always first and most prominent */}
          <motion.div initial="hidden" animate="show" variants={stagger}>
            <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-[0.2em] text-na-ocean">
              Canada-wide removal services
            </motion.p>
            <motion.h1 variants={fadeUp} className="mt-3 text-[34px] font-extrabold leading-[1.06] tracking-tight text-na-navy sm:text-4xl md:text-[48px] lg:text-[56px]">
              Your space back.
              <br />
              <span className="text-na-ocean">Without the wait.</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-3 max-w-xl text-[15px] leading-relaxed text-na-slate md:mt-4 md:text-lg">
              Find local removal services, explore transparent pricing, and request a pickup through one intelligent Canadian platform.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={startService}
                className="btn-float inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-ri-amber px-7 py-3.5 text-sm font-bold text-ri-charcoal transition-all hover:brightness-105"
              >
                Get My Pickup Quote <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                to="/live"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-na-ocean/30 px-6 py-3.5 text-sm font-bold text-na-ocean transition-colors hover:bg-na-cloud"
              >
                Explore Canadian Service Demand
              </Link>
            </motion.div>

            {/* Location entry — the clean path into the booking flow */}
            <motion.div variants={fadeUp} className="mt-6 max-w-xl rounded-[20px] border border-si-line bg-white p-4 shadow-sm">
              <label htmlFor="hero-place" className="text-xs font-bold text-si-muted">
                Where do you need a pickup?
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id="hero-place"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && startService()}
                  placeholder="Address or postal code — e.g. Vancouver"
                  className="input flex-1 !rounded-full py-3 text-sm"
                />
                <button
                  onClick={startService}
                  className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-na-ocean/30 px-5 py-3 text-sm font-bold text-na-ocean transition-colors hover:bg-na-ocean hover:text-white"
                >
                  Start <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1.5 text-xs leading-snug text-si-muted">
                Requests are accepted in every Canadian city — availability is confirmed with you before anything is scheduled or charged.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-si-bg2 px-3 py-1.5 text-xs font-bold text-si-ink">
                <Clock className="h-3.5 w-3.5" /> Book before noon for the best same-day chance
              </span>
              <a href="tel:+16048491745" className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-si-line bg-white px-3 py-1.5 text-xs font-bold text-na-ocean transition-colors hover:border-na-teal">
                <Phone className="h-3.5 w-3.5" /> (604) 849-1745
              </a>
            </motion.div>
          </motion.div>

          {/* Right — the signature instrument, in a lit midnight-navy panel */}
          <motion.aside
            aria-label="Canadian service demand"
            className="na-panel rounded-[24px] p-5 md:p-6"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.7, ease: EASE }}
          >
            <NationalDemandGauge
              size="hero"
              appearance="dark"
              loading={l30 || !g90}
              error={e30}
              value={total30}
              valueLabel="Observed records · last 30 days"
              arcShare={arcShare}
              arcTitle="Last 30 days as a share of the trailing 90-day window"
              categories={rows.slice(0, 5).map((r) => ({ key: r.key, label: LIVE_CATEGORIES[r.key] || r.key, value: r.count }))}
              momentum={momentum}
              updatedAt={updatedAt}
              ariaLabel="Canadian service demand: observed records, category distribution and momentum"
            />
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-na-cyan/15 pt-3 text-center">
              <div>
                <div className="data-label text-na-cyan/80">Regional demand</div>
                <div className="metric mt-0.5 text-xs text-na-warm">{regionalReading}</div>
              </div>
              <div>
                <div className="data-label text-na-cyan/80">Service interest</div>
                <div className="metric mt-0.5 text-xs text-na-warm">{interestReading}</div>
              </div>
              <div>
                <div className="data-label text-na-cyan/80">Data update</div>
                <div className="metric mt-0.5 text-xs text-na-warm">{updatedAt ? `${updatedAt} PT` : "Awaiting"}</div>
              </div>
            </div>
          </motion.aside>
        </div>
      </MotionConfig>
    </section>
  );
}