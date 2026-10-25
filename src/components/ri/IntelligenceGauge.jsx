import { useEffect, useRef, useState } from "react";

// The Recycling OS signature intelligence gauge — one reusable circular
// visualization deployed platform-wide with different underlying data.
// Every instance must have a defined metric, unit, scale, source and update
// time, or an explicit unavailable reason. Never decorative.

const fmtTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
};

export default function IntelligenceGauge({ value, max, unit = "", label, sub, source, updatedAt, unavailableReason }) {
  const R = 54;
  const C = 2 * Math.PI * R;
  const usable = !unavailableReason && value != null && max > 0;
  const frac = usable ? Math.max(0, Math.min(1, Number(value) / max)) : null;

  const [drawn, setDrawn] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (frac === null) { setDrawn(0); return; }
    raf.current = requestAnimationFrame(() => setDrawn(frac));
    return () => cancelAnimationFrame(raf.current);
  }, [frac]);

  // Thin scale ticks: 48 minor ticks, every 4th slightly longer.
  const ticks = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * 2 * Math.PI - Math.PI / 2;
    const inner = i % 4 === 0 ? 42 : 44;
    return {
      x1: 80 + inner * Math.cos(a), y1: 80 + inner * Math.sin(a),
      x2: 80 + 47 * Math.cos(a), y2: 80 + 47 * Math.sin(a),
      major: i % 4 === 0,
    };
  });

  const center = unavailableReason ? "—" : Math.round(Number(value) * 10) / 10;

  return (
    <div className="flex flex-col items-center text-center">
      <svg viewBox="0 0 160 160" className="w-full max-w-[220px]" role="img" aria-label={`${unavailableReason ? "Not available" : `${label}: ${center} of ${max} ${unit}`}`}>
        <circle cx="80" cy="80" r={R} fill="none" strokeWidth="8" style={{ stroke: "hsl(var(--ri-mint))" }} />
        {usable && (
          <circle
            cx="80" cy="80" r={R} fill="none" strokeWidth="8" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - drawn)}
            transform="rotate(-90 80 80)"
            style={{ stroke: "hsl(var(--ri-emerald))", transition: "stroke-dashoffset 700ms ease-out" }}
          />
        )}
        {ticks.map((t, i) => (
          <line
            key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            strokeWidth={t.major ? 1.4 : 0.7} strokeLinecap="round"
            style={{ stroke: t.major ? "hsl(var(--ri-slate) / 0.5)" : "hsl(var(--ri-slate) / 0.28)" }}
          />
        ))}
        <text x="80" y="78" textAnchor="middle" fontSize="30" fontWeight="700" className="font-plex fill-ri-charcoal">
          {center}
        </text>
        {unit && (
          <text x="80" y="97" textAnchor="middle" fontSize="10" fontWeight="600" className="fill-ri-slate">
            {unit}
          </text>
        )}
      </svg>
      <div className="mt-2 text-sm font-bold text-ri-charcoal">{unavailableReason ? "Not available" : label}</div>
      {(unavailableReason || sub) && <div className="mt-1 text-xs text-ri-slate max-w-[260px]">{unavailableReason || sub}</div>}
      <div className="mt-2 font-plex text-[10px] text-ri-slate/80">
        {unavailableReason
          ? "Insufficient verified data"
          : <>Source: {source} · Updated {fmtTime(updatedAt) || "recently"}</>}
      </div>
    </div>
  );
}