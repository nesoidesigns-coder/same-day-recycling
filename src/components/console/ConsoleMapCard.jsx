import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import { CANADA_OUTLINES, MAP_BOUNDS, pt } from "@/lib/canadaOutline";
import { CITIES } from "@/lib/cities";

const PAD = 8;
const LEVEL = {
  high: { color: "#FF9800", label: "High" },
  moderate: { color: "#00BFA5", label: "Moderate" },
  low: { color: "#2E9E76", label: "Low" },
};
const level = (n) => (n >= 3 ? "high" : n === 2 ? "moderate" : "low");

// Canada read at a glance: verified city records as heat points over real
// geography. Selecting a dot focuses the whole dashboard on that city.
export default function ConsoleMapCard({ cities = [], selected, onSelect }) {
  const { minX, maxX, minY, maxY } = MAP_BOUNDS;
  const vb = `${minX - PAD} ${minY - PAD} ${maxX - minX + PAD * 2} ${maxY - minY + PAD * 2}`;
  const byName = new Map(CITIES.map((c) => [c.name.toLowerCase(), c]));

  const dots = cities
    .map((c) => {
      const meta = byName.get(String(c.city).toLowerCase());
      if (!meta || meta.lat == null) return null;
      const p = pt(meta.lat, meta.lng);
      return { ...c, x: p.x, y: p.y, meta, lvl: level(c.count) };
    })
    .filter(Boolean);

  return (
    <section className="console-panel flex h-full flex-col p-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="console-label">Live search activity</div>
        <span className="flex items-center gap-1 rounded-md border border-cn-line px-1.5 py-0.5 text-[10px] font-semibold text-cn-muted">
          Canada Wide <ChevronDown className="h-2.5 w-2.5" />
        </span>
      </div>

      <svg viewBox={vb} className="mt-2 w-full" role="img" aria-label="Observed demand across Canada">
        {CANADA_OUTLINES.map((poly, i) => (
          <polygon
            key={i}
            points={poly.map(([lat, lng]) => { const p = pt(lat, lng); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ")}
            fill="#123B39"
            stroke="#1F5450"
            strokeWidth="0.7"
          />
        ))}
        {dots.map((d) => (
          <g key={d.city} className="cursor-pointer" onClick={() => onSelect?.(d.city)}>
            <circle cx={d.x} cy={d.y} r={Math.min(16, 5 + d.count * 2.2)} fill={LEVEL[d.lvl].color} opacity="0.16" />
            <circle
              cx={d.x}
              cy={d.y}
              r={selected === d.city ? 4.6 : 3.2}
              fill={LEVEL[d.lvl].color}
              stroke={selected === d.city ? "#FFFFFF" : "none"}
              strokeWidth="0.9"
            />
          </g>
        ))}
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        {Object.entries(LEVEL).map(([key, v]) => (
          <span key={key} className="flex items-center gap-1 text-[10px] text-cn-muted">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: v.color }} /> {v.label}
          </span>
        ))}
      </div>

      {selected && (
        <div className="mt-2 rounded-lg border border-cn-line bg-[hsl(var(--cn-surface-2)/0.6)] px-2.5 py-2">
          <div className="text-[11.5px] font-bold text-cn-ink">{selected}</div>
          <div className="text-[10px] text-cn-muted">Highest activity this week</div>
        </div>
      )}

      <Link to="/coverage" className="mt-auto pt-2 inline-flex items-center gap-1 text-[11px] font-bold text-cn-teal hover:underline">
        View by city <ArrowRight className="h-3 w-3" />
      </Link>
    </section>
  );
}