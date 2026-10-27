import { CANADA_OUTLINES, MAP_BOUNDS, pt } from "@/lib/canadaOutline";

const PAD = 10;
const R = 92;
const CIRC = 2 * Math.PI * R;

// The hero instrument: live Canadian demand as one arc, with the country
// drawn faintly behind it. The number is the verified record count for the
// selected window — never a projection.
export default function HeroDemandGauge({ total = 0, periodLabel = "30-day window", loading, updatedAt }) {
  const { minX, maxX, minY, maxY } = MAP_BOUNDS;
  const mapBox = `${minX - PAD} ${minY - PAD} ${maxX - minX + PAD * 2} ${maxY - minY + PAD * 2}`;
  const pct = total > 0 ? Math.min(0.94, Math.max(0.12, total / 100)) : 0.04;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-lm-line bg-white px-4 pb-4 pt-5 shadow-[0_1px_2px_rgba(16,43,42,0.04)]">
      <div className="text-center">
        <div className="font-plex text-[9.5px] font-bold uppercase tracking-[0.2em] text-lm-muted">
          Live Canadian demand
        </div>
      </div>

      <div className="relative mx-auto mt-1 w-full max-w-[290px]">
        <svg viewBox={mapBox} className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.35]" aria-hidden="true">
          {CANADA_OUTLINES.map((poly, i) => (
            <polygon
              key={i}
              points={poly.map(([lat, lng]) => { const p = pt(lat, lng); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ")}
              fill="hsl(var(--ri-mint))"
            />
          ))}
        </svg>

        <svg viewBox="0 0 240 240" className="relative w-full" role="img" aria-label={`${total} verified demand observations`}>
          <defs>
            <linearGradient id="hero-gauge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00B5AD" />
              <stop offset="100%" stopColor="#006F79" />
            </linearGradient>
          </defs>
          <circle cx="120" cy="120" r={R} fill="none" stroke="hsl(var(--ri-mint))" strokeWidth="11" />
          <circle
            cx="120"
            cy="120"
            r={R}
            fill="none"
            stroke="url(#hero-gauge)"
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={`${(pct * CIRC).toFixed(1)} ${CIRC.toFixed(1)}`}
            transform="rotate(-90 120 120)"
            style={{ transition: "stroke-dasharray 900ms cubic-bezier(0.22,1,0.36,1)" }}
          />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => {
            const a = (-90 + (i / 10) * 300) * (Math.PI / 180);
            const inner = R - 20;
            const outer = R - 26;
            return (
              <line
                key={i}
                x1={120 + Math.cos(a) * inner}
                y1={120 + Math.sin(a) * inner}
                x2={120 + Math.cos(a) * outer}
                y2={120 + Math.sin(a) * outer}
                stroke="hsl(var(--lm-line))"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}
          <text x="120" y="118" textAnchor="middle" className="font-heading" fontSize="50" fontWeight="800" fill="hsl(var(--lm-ink))">
            {loading ? "—" : total}
          </text>
          <text x="120" y="136" textAnchor="middle" fontSize="7.5" fontWeight="700" letterSpacing="1.6" fill="hsl(var(--lm-muted))">
            OBSERVATIONS
          </text>
          <text x="120" y="152" textAnchor="middle" fontSize="7" fill="hsl(var(--lm-muted))">
            {periodLabel}
          </text>
        </svg>
      </div>

      <p className="mt-1 text-center text-[10.5px] text-lm-muted">
        {updatedAt ? `Updated ${updatedAt}` : "Connecting to verified records…"}
      </p>
    </div>
  );
}