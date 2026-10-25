import { useId } from "react";
import { money } from "./siShared";

// PriceIntelligenceGauge — a radial price-range scale, not a score. Built only
// from the platform's published tier rates (city rate where one exists, national
// rate otherwise). Markers sit proportionally on the scale; the centre shows
// the verified starting pickup price. Labelled as a preliminary estimate.

const TIER_ORDER = [
  ["minimum_pickup", "Minimum pickup"],
  ["eighth_truck", "1/8 truck"],
  ["quarter_truck", "1/4 truck"],
  ["half_truck", "1/2 truck"],
  ["three_quarter_truck", "3/4 truck"],
  ["full_truck", "Full truck"],
];

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

const START_ANGLE = 140;
const SWEEP = 260;

export default function PriceIntelligenceGauge({ prices, cityLabel, generatedAt, className = "" }) {
  const gradientId = useId().replace(/[:]/g, "");
  const tiers = TIER_ORDER.map(([key, label]) => ({ key, label, price: Number(prices?.[key]) })).filter(
    (t) => Number.isFinite(t.price) && t.price > 0
  );
  // A valid scale needs both ends; otherwise no gauge is drawn at all.
  const available = tiers.length >= 2;
  const min = available ? tiers[0].price : 0;
  const max = available ? tiers[tiers.length - 1].price : 0;
  const angleFor = (price) => START_ANGLE + ((price - min) / Math.max(1, max - min)) * SWEEP;
  const cx = 160;
  const cy = 150;

  return (
    <figure className={`m-0 ${className}`}>
      <svg viewBox="0 0 320 250" className="w-full" role="img" aria-label={`Published price scale${cityLabel ? ` for ${cityLabel}` : ""}`}>
        <defs>
          <linearGradient id={`si-price-${gradientId}`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#8DDFCA" />
            <stop offset="100%" stopColor="#22CFA7" />
          </linearGradient>
        </defs>
        {available ? (
          <g>
            {/* Base track and price band */}
            <path d={arcPath(cx, cy, 104, START_ANGLE, START_ANGLE + SWEEP)} fill="none" stroke="#DCE8E2" strokeWidth="14" strokeLinecap="round" />
            <path
              d={arcPath(cx, cy, 104, angleFor(min), angleFor(max))}
              fill="none"
              stroke={`url(#si-price-${gradientId})`}
              strokeWidth="14"
              strokeLinecap="round"
              opacity="0.85"
            />
            {/* Tier markers */}
            {tiers.map((t, i) => {
              const a = angleFor(t.price);
              const p = polar(cx, cy, 104, a);
              const isStart = i === 0;
              return (
                <g key={t.key}>
                  <circle cx={p.x} cy={p.y} r={isStart ? 8 : 4.5} fill={isStart ? "#22CFA7" : "#123D32"} stroke="#F8FAF9" strokeWidth="2" />
                  <title>{`${t.label} · ${money(t.price)}`}</title>
                  {isStart && <circle cx={p.x} cy={p.y} r="13" fill="none" stroke="#22CFA7" strokeWidth="1.5" opacity="0.5" />}
                </g>
              );
            })}
            {/* Min / max edge labels */}
            {(() => {
              const p1 = polar(cx, cy, 130, angleFor(min));
              const p2 = polar(cx, cy, 130, angleFor(max));
              return (
                <g fontSize="11.5" fill="#61756D" fontWeight="600">
                  <text x={p1.x} y={p1.y + 4} textAnchor="middle">{money(min)}</text>
                  <text x={p2.x} y={p2.y + 4} textAnchor="middle">{money(max)}</text>
                </g>
              );
            })()}
            {/* Centre readout */}
            <text x={cx} y={cy - 2} textAnchor="middle" fontSize="34" fontWeight="700" fill="#172B26">
              From {money(min)}
            </text>
            <text x={cx} y={cy + 20} textAnchor="middle" fontSize="12" fill="#61756D">
              starting pickup price · {cityLabel || "platform rate"}
            </text>
          </g>
        ) : (
          <text x={cx} y={cy} textAnchor="middle" fontSize="12" fill="#61756D">
            Price scale not available yet.
          </text>
        )}
      </svg>

      <figcaption>
        {/* The full published scale, readable without hover */}
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-si-muted sm:grid-cols-3">
          {tiers.map((t) => (
            <div key={t.key} className="flex items-baseline justify-between gap-2 border-b border-si-line pb-1">
              <dt>{t.label}</dt>
              <dd className="m-0 font-semibold text-si-ink">{money(t.price)}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 font-plex text-xs text-si-muted">
          <span>Platform published rates{cityLabel ? ` · ${cityLabel}` : ""}</span>
          {generatedAt && <span>· Updated {new Date(generatedAt).toLocaleDateString("en-CA")}</span>}
        </div>
      </figcaption>

      <table className="sr-only">
        <caption>Published price scale</caption>
        <tbody>
          {tiers.map((t) => (
            <tr key={t.key}>
              <th scope="row">{t.label}</th>
              <td>{money(t.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}