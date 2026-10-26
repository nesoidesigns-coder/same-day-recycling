import { useEffect, useId, useRef, useState } from "react";

// Shared reduced-motion preference, resolved once per session.
export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Smooth count-up that animates from the previously displayed value to the
// new one (requestAnimationFrame, eased). With reduced motion the value
// appears immediately.
export function useCountUp(target, { duration = 1400, animate = true } = {}) {
  const [display, setDisplay] = useState(animate ? 0 : target);
  const prevRef = useRef(0);

  useEffect(() => {
    if (!animate) {
      setDisplay(target);
      prevRef.current = target;
      return;
    }
    const from = prevRef.current;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        prevRef.current = target;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, animate]);

  return display;
}

// Master palette mapping: emerald = verified (green), mint = observed activity
// (cyan), gold = pending/caution (amber). No ad-hoc colours.
const PALETTES = {
  emerald: ["#55C7A1", "#32C7D5"],
  mint: ["#7ED4BC", "#32C7D5"],
  gold: ["#E8B66A", "#B48A2F"],
};

const fmt = (n) => Number(n || 0).toLocaleString("en-CA");

/**
 * Animated circular gauge.
 * kind "activity": faint track + slowly rotating arc — used for totals with
 * no invented maximum (inquiries, bookings…).
 * kind "target": progress arc against an operational capacity target.
 */
export default function PulseRing({
  value,
  size = 128,
  thickness = 9,
  kind = "activity",
  target = null,
  palette = "emerald",
  spin = true,
  children,
}) {
  const uid = useId().replace(/[:]/g, "");
  const gradId = `pulse-grad-${uid}`;
  const reduced = prefersReducedMotion();
  const [c, c2] = PALETTES[palette] || PALETTES.emerald;

  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const doSpin = spin && !reduced;

  const fraction =
    kind === "target" && target > 0
      ? Math.max(0.02, Math.min(1, (Number(value) || 0) / target))
      : kind === "activity"
        ? 0.28
        : 0;

  const arcLength = circumference * fraction;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={doSpin && kind === "activity" ? "pulse-arc-spin" : ""}
        style={{ filter: `drop-shadow(0 0 ${Math.round(size / 22)}px rgba(50, 199, 213, 0.45))` }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(50, 199, 213, 0.18)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">{children}</div>
    </div>
  );
}

export { fmt as formatCount };