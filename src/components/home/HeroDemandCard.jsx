import { CANADA_OUTLINES, MAP_BOUNDS, pt } from "@/lib/canadaOutline";
import { CITIES } from "@/lib/cities";

// The hero's data card: one ring with the verified observation count, and the
// national map showing where that demand is concentrated. High / Moderate / Low
// are record volumes, never forecasts.
const PAD = 10;

const level = (n) => (n >= 3 ? "high" : n === 2 ? "moderate" : "low");
const LEVEL = {
  high: { color: "#FF9F1C", label: "High" },
  moderate: { color: "#1E8C75", label: "Moderate" },
  low: { color: "#8CCFC1", label: "Low" },
};

export default function HeroDemandCard({ total = 0, cities = [], loading }) {
  const { minX, maxX, minY, maxY } = MAP_BOUNDS;
  const vb = `${minX - PAD} ${minY - PAD} ${maxX - minX + PAD * 2} ${maxY - minY + PAD * 2}`;
  const byName = new Map(CITIES.map((c) => [c.name.toLowerCase(), c]));

  const dots = cities
    .map((c) => {
      const meta = byName.get(String(c.city).toLowerCase());
      if (!meta || meta.lat == null) return null;
      const p = pt(meta.lat, meta.lng);
      return { ...c, x: p.x, y: p.y };
    })
    .filter(Boolean);

  const R = 52;
  const circumference = 2 * Math.PI * R;
  const arc = Math.min(1, Math.max(0.08, total / 120));

  return (
    <div className="rounded-2xl border border-lm-line bg-white p-5 shadow-[0_18px_50px_-30px_rgba(17,24,39,0.4)]">
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <svg viewBox="0 0 130 130" className="h-[118px] w-[118px]" role="img" aria-label={`${total} service observations`}>
            <circle cx="65" cy="65" r={R} fill="none" stroke="#E5E7EB" strokeWidth="10" />
            <circle
              cx="65"
              cy="65"
              r={R}
              fill="none"
              stroke="#007661"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${circumference * arc} ${circumference}`}
              transform="rotate(-90 65 65)"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <span className="font-heading text-[30px] font-extrabold leading-none text-lm-ink tabular-nums">
              {loading ? "…" : total}
            </span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="font-heading text-[15px] font-bold leading-tight text-lm-ink">service observations</p>
          <p className="mt-0.5 text-[12px] text-lm-muted">in the last 30 days</p>
          <p className="mt-2 text-[11.5px] leading-snug text-lm-muted">
            Verified requests, bookings and public demand signals across Canada.
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl bg-[#F3F6F8] p-2">
        <svg viewBox={vb} className="w-full" role="img" aria-label="Canadian demand by city">
          {CANADA_OUTLINES.map((poly, i) => (
            <polygon
              key={i}
              points={poly
                .map(([lat, lng]) => {
                  const p = pt(lat, lng);
                  return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                })
                .join(" ")}
              fill="#E5E9EE"
              stroke="#D5DCE3"
              strokeWidth="0.7"
            />
          ))}
          {dots.map((d) => {
            const l = LEVEL[level(d.count)];
            return (
              <g key={d.city}>
                <circle cx={d.x} cy={d.y} r={7} fill={l.color} opacity="0.2" />
                <circle cx={d.x} cy={d.y} r={3.4} fill={l.color} stroke="#fff" strokeWidth="1" />
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex items-center gap-4">
        {Object.entries(LEVEL).map(([key, l]) => (
          <span key={key} className="flex items-center gap-1.5 text-[11px] font-semibold text-lm-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: l.color }} /> {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}