import { CANADA_OUTLINES, MAP_BOUNDS, pt } from "@/lib/canadaOutline";
import { CITIES } from "@/lib/cities";

// Compact national map for the dashboard: real Natural Earth geometry, city
// clusters sized and coloured by verified record volume. Selecting a dot
// focuses the whole dashboard on that city.
const PAD = 8;

const level = (n) => (n >= 3 ? "high" : n === 2 ? "moderate" : "low");
const LEVEL = {
  high: { color: "#FFAB00", label: "High activity" },
  moderate: { color: "#35C99A", label: "Moderate" },
  low: { color: "#00A699", label: "Low" },
};

export default function DemandMapCard({ cities = [], selected, onSelect }) {
  const { minX, maxX, minY, maxY } = MAP_BOUNDS;
  const vb = `${minX - PAD} ${minY - PAD} ${maxX - minX + PAD * 2} ${maxY - minY + PAD * 2}`;
  const byName = new Map(CITIES.map((c) => [c.name.toLowerCase(), c]));

  const dots = cities
    .map((c) => {
      const meta = byName.get(String(c.city).toLowerCase());
      if (!meta || meta.lat == null) return null;
      const p = pt(meta.lat, meta.lng);
      return { ...c, x: p.x, y: p.y, meta };
    })
    .filter(Boolean);

  return (
    <div>
      <svg viewBox={vb} className="w-full" role="img" aria-label="Cities with observed demand">
        {CANADA_OUTLINES.map((poly, i) => (
          <polygon
            key={i}
            points={poly.map(([lat, lng]) => { const p = pt(lat, lng); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ")}
            fill="#EDF4F1"
            stroke="#DCE9E4"
            strokeWidth="0.7"
          />
        ))}
        {dots.map((d) => {
          const meta = LEVEL[level(d.count)];
          const isSel = selected && String(selected).toLowerCase() === String(d.city).toLowerCase();
          const r = Math.min(5.5, 2 + d.count * 0.7);
          return (
            <g key={d.city} onClick={() => onSelect && onSelect(d.city)} style={{ cursor: "pointer" }} role="button" aria-label={`${d.city}: ${d.count} records`}>
              <title>{`${d.city}: ${d.count} observed record${d.count === 1 ? "" : "s"}`}</title>
              {isSel && <circle cx={d.x} cy={d.y} r={r + 3} fill="none" stroke={meta.color} strokeWidth="1.4" opacity="0.7" />}
              <circle cx={d.x} cy={d.y} r={r} fill={meta.color} stroke="#FFFFFF" strokeWidth="1.1" />
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
        {Object.entries(LEVEL).map(([k, m]) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-[10px] text-lm-muted">
            <span className="inline-block size-2 rounded-full" style={{ background: m.color }} />
            {m.label}
          </span>
        ))}
      </div>
      {!dots.length && <p className="mt-1 text-[10.5px] text-lm-muted">City-level records appear here as they are observed.</p>}
    </div>
  );
}