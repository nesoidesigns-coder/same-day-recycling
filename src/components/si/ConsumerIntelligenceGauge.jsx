import { useId, useState } from "react";
import { timestamp } from "./siShared";

// ConsumerIntelligenceGauge — the signature Recycling OS intelligence visual.
// Multi-layer radial: thin outer measurement ring, segmented middle category
// ring, soft inner accent ring, large centre readout. Segments are real,
// labelled data — never fabricated to fill the ring. Keyboard and screen-reader
// accessible (radio semantics + sr-only data table).

const RAD = Math.PI / 180;
const polar = (cx, cy, r, deg) => {
  const a = (deg - 90) * RAD;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
};
const arcPath = (cx, cy, r, start, end) => {
  const s = polar(cx, cy, r, start);
  const e = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
};

export default function ConsumerIntelligenceGauge({
  label,
  segments = [],
  total = 0,
  centerPrimary,
  centerSub,
  selectedIndex = null,
  onSelect,
  period,
  scope,
  source,
  generatedAt,
  emptyLabel = "No recorded observations yet for this selection.",
  className = "",
}) {
  const gradientId = useId().replace(/[:]/g, "");
  const [hover, setHover] = useState(null);
  const active = hover ?? selectedIndex;
  const dim = active != null && segments.length > 1;
  const interactive = typeof onSelect === "function";
  const cx = 160;
  const cy = 160;
  const GAP = 3;

  const empty = !segments.length || total <= 0;
  const arcs = [];
  if (!empty) {
    let angle = 0;
    const usable = 360 - GAP * segments.length;
    segments.forEach((seg) => {
      const span = Math.max((seg.value / total) * usable, 1.5);
      arcs.push({ ...seg, start: angle, end: angle + span });
      angle += span + GAP;
    });
  }

  return (
    <figure className={`m-0 ${className}`}>
      <svg viewBox="0 0 320 320" className="w-full" role="img" aria-label={label}>
        <defs>
          <linearGradient id={`si-accent-${gradientId}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8DDFCA" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#22CFA7" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Outer thin measurement ring with fine ticks */}
        {Array.from({ length: 60 }, (_, i) => {
          const a = i * 6;
          const p1 = polar(cx, cy, 146, a);
          const p2 = polar(cx, cy, i % 5 === 0 ? 153 : 149.5, a);
          return (
            <line
              key={i}
              x1={p1.x.toFixed(2)}
              y1={p1.y.toFixed(2)}
              x2={p2.x.toFixed(2)}
              y2={p2.y.toFixed(2)}
              stroke="#DCE8E2"
              strokeWidth={i % 5 === 0 ? 1.4 : 0.8}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={142} fill="none" stroke="#DCE8E2" strokeWidth="1" />

        {empty ? (
          <g>
            <circle cx={cx} cy={cy} r={126} fill="none" stroke="#DCE8E2" strokeWidth="20" strokeDasharray="4 10" opacity="0.8" />
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize="38" fontWeight="700" fill="#61756D">—</text>
            <text x={cx} y={cy + 22} textAnchor="middle" fontSize="12" fill="#61756D">{emptyLabel}</text>
          </g>
        ) : (
          <g role={interactive ? "radiogroup" : undefined} aria-label={label}>
            {/* Segmented middle category ring */}
            {arcs.map((arc, i) => {
              const selected = active === i;
              return (
                <path
                  key={arc.key}
                  d={arcPath(cx, cy, 126, arc.start, arc.end)}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={selected ? 25 : 20}
                  strokeLinecap="butt"
                  opacity={dim && !selected ? 0.25 : 1}
                  className="transition-all duration-300 outline-none"
                  style={{ cursor: interactive ? "pointer" : "default" }}
                  tabIndex={interactive ? 0 : undefined}
                  role={interactive ? "radio" : undefined}
                  aria-checked={interactive ? selectedIndex === i : undefined}
                  aria-label={`${arc.label}: ${arc.value}`}
                  onClick={() => interactive && onSelect(selectedIndex === i ? null : i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(selectedIndex === i ? null : i);
                    }
                  }}
                  onMouseEnter={() => interactive && setHover(i)}
                  onMouseLeave={() => interactive && setHover(null)}
                  onFocus={() => interactive && setHover(i)}
                  onBlur={() => interactive && setHover(null)}
                />
              );
            })}
            {/* Soft inner accent ring */}
            <circle cx={cx} cy={cy} r={98} fill="none" stroke={`url(#si-accent-${gradientId})`} strokeWidth="5" opacity="0.55" className="transition-opacity duration-300" />
          </g>
        )}

        {/* Centre readout */}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="40" fontWeight="700" fill="#172B26">
          {centerPrimary}
        </text>
        {centerSub && (
          <text x={cx} y={cy + 22} textAnchor="middle" fontSize="12" fill="#61756D">
            {centerSub}
          </text>
        )}
      </svg>

      {/* Source, scope, period and freshness — always visible */}
      <figcaption className="mt-1">
        <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-0.5 font-plex text-xs text-si-muted">
          {period && <span>{period}</span>}
          {scope && <span>· {scope}</span>}
          {source && <span>· Source: {source}</span>}
          {generatedAt && <span>· Updated {timestamp(generatedAt)}</span>}
        </div>
      </figcaption>

      {/* Accessible data-table alternative */}
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {segments.map((s) => (
            <tr key={s.key}>
              <th scope="row">{s.label}</th>
              <td>{s.value}</td>
            </tr>
          ))}
          <tr>
            <th scope="row">Total</th>
            <td>{total}</td>
          </tr>
        </tbody>
      </table>
    </figure>
  );
}