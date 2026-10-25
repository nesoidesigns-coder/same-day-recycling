import { SignalPulse } from "@/components/signals";

// THE CANADA SIGNAL — signature master gauge.
// Layered SVG rings: outer = service-category signals, middle = measurement
// markers, inner = geographic coverage dots, center = the National Signal
// Index (one documented basis, never a blend of unrelated metrics).
// Premium consumer styling: soft emerald illumination, no radar sweeps.

const CX = 170;
const CY = 170;

const polar = (r, deg) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
};

const arcPath = (r, startDeg, endDeg) => {
  const s = polar(r, startDeg);
  const e = polar(r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
};

const MEASURE_TICKS = Array.from({ length: 72 }, (_, i) => {
  const deg = (i / 72) * 360;
  const outer = polar(126, deg);
  const inner = polar(i % 6 === 0 ? 119 : 122, deg);
  return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y, major: i % 6 === 0 };
});

export default function CanadaSignal({
  value,
  period,
  categories = [],
  selected = "",
  onSelect,
  geoLabel = "Canada",
  coverageCount = 0,
  updatedAt,
  isLoading,
}) {
  const hasValue = value != null;
  const display = hasValue ? String(Math.round(value)) : "—";
  const pulseKey = hasValue ? Math.round(value) : 0;

  const segSpan = 360 / Math.max(categories.length, 1);
  const gap = segSpan > 20 ? 7 : 3;

  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <svg viewBox="0 0 340 340" className="w-full" role="img" aria-label={`Canada Signal: National Signal Index ${hasValue ? display : "not available"} of 100, ${period || ""}, ${geoLabel}`}>
        {/* Outer ring — service-category signal segments */}
        {categories.map((c, i) => {
          const start = i * segSpan + gap / 2;
          const end = (i + 1) * segSpan - gap / 2;
          const isSel = selected === c.key;
          const isDim = selected && !isSel;
          const frac = c.available ? Math.max(0.12, Math.min(1, (Number(c.value) || 0) / 100)) : 0.12;
          const stroke = c.available ? "hsl(var(--ri-emerald))" : "hsl(var(--ri-slate) / 0.25)";
          return (
            <path
              key={c.key}
              d={arcPath(146, start, end)}
              fill="none"
              strokeWidth={isSel ? 20 : 15}
              strokeLinecap="round"
              style={{
                stroke,
                opacity: isDim ? 0.22 : c.available ? 0.3 + 0.7 * frac : 0.5,
                cursor: onSelect ? "pointer" : "default",
                transition: "stroke-width 400ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms ease",
              }}
              onClick={() => onSelect?.(isSel ? "" : c.key)}
            >
              <title>{`${c.label}${c.available ? ` — index ${c.value}` : " — no data yet"}`}</title>
            </path>
          );
        })}

        {/* Middle ring — thin radial measurement markers */}
        {MEASURE_TICKS.map((t, i) => (
          <line
            key={i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            strokeWidth={t.major ? 1.3 : 0.6}
            strokeLinecap="round"
            style={{ stroke: `hsl(var(--ri-slate) / ${t.major ? 0.4 : 0.2})` }}
          />
        ))}

        {/* Inner ring — geographic layer: one dot per covered city */}
        <circle cx={CX} cy={CY} r={98} fill="none" strokeWidth="1.5" style={{ stroke: "hsl(var(--ri-steel))" }} />
        {Array.from({ length: Math.min(coverageCount, 12) }, (_, i) => {
          const p = polar(98, (i / 12) * 360);
          return (
            <circle
              key={i}
              cx={p.x} cy={p.y} r={3}
              style={{ fill: "hsl(var(--ri-emerald))", transition: "opacity 400ms ease" }}
              opacity={0.65}
            >
              <title>{`${coverageCount} cities with verified contractor records`}</title>
            </circle>
          );
        })}

        {/* Soft orbital accents */}
        <circle cx={CX} cy={CY} r={112} fill="none" strokeWidth="1" strokeDasharray="2 10" style={{ stroke: "hsl(var(--ri-emerald) / 0.35)" }} />
      </svg>

      {/* Central display */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
        {isLoading && !hasValue ? (
          <span className="text-sm font-semibold text-ri-slate">Reading verified data…</span>
        ) : hasValue ? (
          <>
            <span key={pulseKey} className="signal-pulse-dot inline-block rounded-full font-plex text-[52px] font-bold leading-none text-ri-charcoal">
              {display}
            </span>
            <span className="mt-1 text-[11px] font-bold tracking-wide text-ri-forest">National Signal Index</span>
            <span className="mt-0.5 font-plex text-[10px] text-ri-slate">0–100 · {period || "28-day window"}</span>
          </>
        ) : (
          <>
            <span className="font-plex text-[40px] font-bold leading-none text-ri-slate">—</span>
            <span className="mt-1 text-[11px] font-bold tracking-wide text-ri-forest">National Signal Index</span>
            <span className="mt-1 text-[10px] leading-snug text-ri-slate">Not yet available — insufficient verified search-interest data</span>
          </>
        )}
        <span className="mt-2 rounded-full bg-ri-mint px-2.5 py-0.5 text-[10px] font-bold text-ri-forest">{geoLabel}</span>
        {updatedAt && <span className="mt-1 font-plex text-[9px] text-ri-slate/70">updated {new Date(updatedAt).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>}
      </div>

      {/* Update pulse indicator (fires once per real value change) */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
        <SignalPulse trigger={pulseKey} />
      </div>
    </div>
  );
}