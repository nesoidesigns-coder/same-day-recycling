import { useEffect, useMemo, useState } from "react";
import { polar, ringSector, arcPath, GAUGE_SIZES, MOTION } from "./gaugeCore";

// NationalDemandGauge — the signature intelligence instrument of Recycling OS
// ("Canada in Motion"). One master component for every national-level gauge:
//
//   Outer ring  — demand activity (share of the stated comparison window)
//   Middle ring — service-category distribution (verified records)
//   Inner ring  — demand momentum (last 30 days vs the prior period)
//   Center      — the primary reading, its basis and the last update time
//
// Data integrity: every arc is drawn ONLY from caller-supplied verified data,
// each arc carries a <title> stating exactly what it shows. The component
// never estimates, never continuously spins and never animates without new
// data. When data is missing it shows "Awaiting data" / "Insufficient data".
//
// Entrance choreography (~1200ms, one-shot): arcs draw into position, the
// center number counts to its actual value, secondary elements fade in, then
// everything settles. Reduced-motion preference renders the final state
// instantly with no animation.

const ARC_START = 60;   // degrees — all rings share one start angle
const ARC_SWEEP = 340;  // degrees of usable arc (the gap reads as calm)

// Category tints of the national palette — teal family first, adjacent
// sectors stay distinguishable. Never repurposed for statuses.
const CAT_COLORS = ["#19B8AD", "#176B91", "#63DCE5", "#42C99A", "#67A9BC", "#7ED4BC"];

const PALETTE = {
  dark: {
    track: "rgba(99, 220, 229, 0.10)",
    arc: "#19B8AD",
    hairline: "rgba(99, 220, 229, 0.14)",
    title: "#63DCE5",
    ink: "#F8FAFC",
    muted: "#9FB3C2",
    green: "#42C99A",
    amber: "#E9B76D",
  },
  light: {
    track: "rgba(23, 107, 145, 0.10)",
    arc: "#176B91",
    hairline: "rgba(23, 107, 145, 0.13)",
    title: "#176B91",
    ink: "#081827",
    muted: "#526779",
    green: "#1E9E77",
    amber: "#B47A2E",
  },
};

const CENTER_SCALE = {
  hero: { title: "text-xs", value: "text-5xl md:text-6xl", status: "text-xs", note: "text-xs" },
  feature: { title: "text-xs", value: "text-4xl", status: "text-xs", note: "text-xs" },
  standard: { title: "text-xs", value: "text-2xl", status: "hidden", note: "hidden" },
};

// Center number counts to its actual value once — never fluctuates.
function useCountUp(target, { active, duration }) {
  const [display, setDisplay] = useState(active ? 0 : target);
  useEffect(() => {
    if (target == null || !active) {
      setDisplay(target);
      return undefined;
    }
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      setDisplay(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);
  return display;
}

export default function NationalDemandGauge({
  size = "feature",
  appearance = "dark",
  loading = false,
  value = null,          // primary reading (raw verified count)
  valueLabel = "",       // what the reading counts, e.g. "OBSERVED RECORDS · 30 DAYS"
  arcShare = null,       // outer ring fraction 0..1 — caller-computed, arcTitle states the basis
  arcTitle = "",
  categories = [],       // [{ key, label, value }] verified distribution
  momentum = null,       // { pct, label } | null — inner ring, caller-computed
  updatedAt = null,      // formatted "last updated" string, as reported by the source
  onSelectCategory,
  ariaLabel = "Canadian service demand gauge",
  className = "",
}) {
  const spec = GAUGE_SIZES[size] || GAUGE_SIZES.feature;
  const c = PALETTE[appearance] || PALETTE.dark;
  const scale = CENTER_SCALE[size] || CENTER_SCALE.feature;
  const R = spec.R;
  const cx = 260;
  const cy = 260;

  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);

  const shown = useCountUp(value, { active: !reduced && !loading, duration: MOTION.gauge });

  const hasValue = value != null;
  const ready = !loading && hasValue;
  const share = Math.max(0, Math.min(1, arcShare ?? 0));
  const anim = (delay) =>
    reduced
      ? {}
      : { animationDelay: `${delay}ms` };

  // Middle ring sectors: proportional shares of the verified category data.
  const catRows = useMemo(() => {
    const list = (categories || []).filter((x) => Number(x.value) > 0).slice(0, 6);
    const sum = list.reduce((s, x) => s + Number(x.value), 0);
    if (!sum) return [];
    let a = ARC_START + 2;
    return list.map((x, i) => {
      const span = Math.max(2, (ARC_SWEEP - 4) * (Number(x.value) / sum) - 1.5);
      const seg = { ...x, a0: a, a1: a + span, color: CAT_COLORS[i % CAT_COLORS.length] };
      a += span + 1.5;
      return seg;
    });
  }, [categories]);

  const momentumSpan = momentum ? Math.min(120, Math.max(6, Math.abs(momentum.pct))) : 0;
  const momentumColor = (momentum?.pct ?? 0) >= 0 ? c.green : c.amber;
  const gradId = `na-bloom-${size}-${appearance}`;

  return (
    <div className={`relative mx-auto w-full ${className}`} style={{ maxWidth: spec.max }}>
      <svg viewBox="0 0 520 520" className="block w-full" role="img" aria-label={ariaLabel}>
        <defs>
          <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#19B8AD" stopOpacity={appearance === "dark" ? 0.14 : 0.08} />
            <stop offset="55%" stopColor="#176B91" stopOpacity={appearance === "dark" ? 0.05 : 0.03} />
            <stop offset="100%" stopColor="#19B8AD" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ambient bloom — one soft halo, never neon */}
        <circle cx={cx} cy={cy} r={R} fill={`url(#${gradId})`} />

        {/* OUTER RING — demand activity: faint track, then the proportional arc */}
        <circle
          cx={cx} cy={cy}
          r={R * 0.85}
          fill="none"
          stroke={c.track}
          strokeWidth={R * 0.125}
          strokeLinecap="round"
          strokeDasharray={`${ARC_SWEEP} 360`}
          transform={`rotate(${ARC_START} ${cx} ${cy})`}
        />
        {ready && share > 0 && (
          <path
            d={arcPath(R * 0.85, ARC_START, ARC_START + share * ARC_SWEEP, cx, cy)}
            fill="none"
            stroke={c.arc}
            strokeWidth={R * 0.125}
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray={`${(share * ARC_SWEEP).toFixed(2)} 100`}
            strokeDashoffset={reduced ? 0 : (share * ARC_SWEEP).toFixed(2)}
            className={reduced ? "" : "na-draw"}
          >
            <title>{arcTitle}</title>
          </path>
        )}

        {/* MIDDLE RING — verified service-category distribution */}
        <circle cx={cx} cy={cy} r={R * 0.72} fill="none" stroke={c.hairline} strokeWidth="0.75" strokeDasharray="1 5" opacity="0.5" />
        {ready && catRows.map((s, i) => (
          <path
            key={s.key}
            d={ringSector(R * 0.56, R * 0.66, s.a0, s.a1)}
            fill={s.color}
            opacity="0.92"
            className={reduced ? "" : "na-fade"}
            onClick={onSelectCategory ? () => onSelectCategory(s.key) : undefined}
            style={{ ...(onSelectCategory ? { cursor: "pointer" } : {}), ...anim(200 + i * 110) }}
          >
            <title>{`${s.label || s.key}: ${s.value} verified records`}</title>
          </path>
        ))}

        {/* INNER RING — demand momentum vs the prior period */}
        <circle
          cx={cx} cy={cy}
          r={R * 0.44}
          fill="none"
          stroke={c.track}
          strokeWidth={R * 0.055}
          strokeLinecap="round"
          strokeDasharray={`${ARC_SWEEP} 360`}
          transform={`rotate(${ARC_START} ${cx} ${cy})`}
        />
        {ready && momentumSpan > 0 && (
          <path
            d={arcPath(R * 0.44, ARC_START, ARC_START + momentumSpan, cx, cy)}
            fill="none"
            stroke={momentumColor}
            strokeWidth={R * 0.055}
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray={`${momentumSpan.toFixed(2)} 100`}
            strokeDashoffset={reduced ? 0 : momentumSpan.toFixed(2)}
            className={reduced ? "" : "na-draw"}
            style={anim(350)}
          >
            <title>{momentum?.label || "Demand momentum"}</title>
          </path>
        )}

        {/* fine reference hairlines */}
        <circle cx={cx} cy={cy} r={R * 0.955} fill="none" stroke={c.hairline} strokeWidth="0.75" opacity="0.5" />
        <circle cx={polar(R * 0.85, ARC_START)[0]} cy={polar(R * 0.85, ARC_START)[1]} r="2.5" fill={c.arc} opacity="0.9" />
      </svg>

      {/* Center — primary reading */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="px-10 text-center">
          <div className={`font-plex font-bold uppercase tracking-[0.18em] ${scale.title}`} style={{ color: c.title }}>
            Canadian service demand
          </div>
          <div className={`metric mt-1.5 ${scale.value}`} style={{ color: c.ink }}>
            {loading ? "…" : ready ? shown : "Awaiting data"}
          </div>
          <div className={`mt-1 font-plex uppercase tracking-[0.08em] ${scale.status}`} style={{ color: c.muted }}>
            {ready ? valueLabel : "Insufficient data"}
          </div>
          {updatedAt && (
            <div className={scale.note} style={{ color: c.muted }}>
              Updated {updatedAt}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}