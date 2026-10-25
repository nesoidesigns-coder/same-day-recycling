import { useEffect, useRef, useState } from "react";
import DataFreshness from "./DataFreshness";
import SignalPulse from "./SignalPulse";

// The Living Signals circular indicator. Same contract as the legacy
// IntelligenceGauge so existing panels swap onto it directly:
//   { value, max, unit, label, sub, source, updatedAt } or { unavailableReason }.
// Adds: one-shot update pulse, verification status and observed-at freshness.
// The arc animates once on load and once per real value change (500ms).

const R = 54;
const C = 2 * Math.PI * R;

const ticks = Array.from({ length: 48 }, (_, i) => {
  const a = (i / 48) * 2 * Math.PI - Math.PI / 2;
  const inner = i % 4 === 0 ? 42 : 44;
  return {
    x1: 80 + inner * Math.cos(a), y1: 80 + inner * Math.sin(a),
    x2: 80 + 47 * Math.cos(a), y2: 80 + 47 * Math.sin(a),
    major: i % 4 === 0,
  };
});

export default function SignalGauge({
  value, max, unit = "", label, sub, source, updatedAt, observedAt,
  verification = "verified", unavailableReason, pulse = true, size = 220,
}) {
  const usable = !unavailableReason && value != null && Number(max) > 0;
  const frac = usable ? Math.max(0, Math.min(1, Number(value) / Number(max))) : null;

  const [drawn, setDrawn] = useState(0);
  const raf = useRef(null);
  const prevValue = useRef(value);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (frac === null) { setDrawn(0); return; }
    raf.current = requestAnimationFrame(() => setDrawn(frac));
    return () => cancelAnimationFrame(raf.current);
  }, [frac]);

  useEffect(() => {
    // Fire the single pulse only when the value moves to a different number.
    if (prevValue.current !== value) {
      prevValue.current = value;
      setPulseKey((k) => k + 1);
    }
  }, [value]);

  const center = unavailableReason ? "—" : Math.round(Number(value) * 10) / 10;
  const aria = unavailableReason
    ? `${label || "Metric"}: not available — insufficient verified data`
    : `${label}: ${center} of ${max} ${unit}`;

  return (
    <div className="flex flex-col items-center text-center">
      <svg viewBox="0 0 160 160" style={{ maxWidth: size }} className="w-full" role="img" aria-label={aria}>
        <circle cx="80" cy="80" r={R} fill="none" strokeWidth="8" style={{ stroke: "hsl(var(--ri-mint))" }} />
        {usable && (
          <circle
            cx="80" cy="80" r={R} fill="none" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - drawn)}
            transform="rotate(-90 80 80)"
            style={{ stroke: "hsl(var(--ri-forest))", transition: "stroke-dashoffset 500ms cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        )}
        {ticks.map((t, i) => (
          <line
            key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            strokeWidth={t.major ? 1.4 : 0.7} strokeLinecap="round"
            style={{ stroke: t.major ? "hsl(var(--ri-slate) / 0.5)" : "hsl(var(--ri-slate) / 0.28)" }}
          />
        ))}
        <text x="80" y="78" textAnchor="middle" fontSize="30" fontWeight="700" className="font-plex fill-ri-forest">
          {center}
        </text>
        {unit && <text x="80" y="97" textAnchor="middle" fontSize="11.5" fontWeight="600" className="fill-ri-slate">{unit}</text>}
      </svg>
      <div className="mt-2 text-sm font-bold text-ri-forest">{unavailableReason ? "Not available" : label}</div>
      {(unavailableReason || sub) && <div className="mt-1 text-xs text-ri-slate max-w-[280px]">{unavailableReason || sub}</div>}
      {pulse && usable && (
        <div className="mt-1.5 h-4">
          <SignalPulse trigger={pulseKey} />
        </div>
      )}
      <DataFreshness
        className="mt-2"
        source={unavailableReason ? null : source}
        observedAt={observedAt}
        updatedAt={updatedAt}
        verification={verification}
        size={pulse && usable ? "xs" : "sm"}
      />
      {unavailableReason && (
        <div className="mt-1 font-plex text-xs text-ri-slate">Insufficient verified data</div>
      )}
    </div>
  );
}