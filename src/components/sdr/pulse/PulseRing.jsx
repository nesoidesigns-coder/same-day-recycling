import { useEffect, useRef, useState } from "react";
import MetricGauge from "@/components/os/MetricGauge";
import { OS_COLORS } from "@/components/os/gaugeCore";

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
const PALETTES = { emerald: OS_COLORS.green, mint: OS_COLORS.cyan, gold: OS_COLORS.amber };

const fmt = (n) => Number(n || 0).toLocaleString("en-CA");

/**
 * Animated circular gauge.
 * kind "activity": faint track + slowly rotating arc — used for totals with
 * no invented maximum (inquiries, bookings…).
 * kind "target": progress arc against an operational capacity target.
 */
export default function PulseRing({ value, size = 128, kind = "activity", target = null, palette = "emerald", children }) {
  return <div className="inline-flex w-full items-center justify-center" style={{ maxWidth: size }}>
    <MetricGauge value={value} max={kind === "target" ? target : null} color={PALETTES[palette] || PALETTES.emerald} appearance="dark" size={size} label={kind === "target" ? "Target progress" : "Recorded activity"}>{children}</MetricGauge>
  </div>;
}

export { fmt as formatCount };