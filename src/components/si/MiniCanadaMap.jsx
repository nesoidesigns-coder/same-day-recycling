import { CANADA_OUTLINES, MAP_BOUNDS, pt, GEOGRAPHY_SOURCE } from "@/lib/canadaOutline";
import { COVERAGE_STATUS, keyOf } from "./siShared";

// Light, compact Canada map for the "Your Area, Explained" preview.
// Same Natural Earth geometry as the production renderers; dots carry the
// verified coverage status of each monitored city. Country outlines never
// imply province-wide coverage.

const PAD = 10;

export default function MiniCanadaMap({ locations, selected, onSelectCity, className = "" }) {
  const { minX, maxX, minY, maxY } = MAP_BOUNDS;
  const vb = `${minX - PAD} ${minY - PAD} ${maxX - minX + PAD * 2} ${maxY - minY + PAD * 2}`;
  const statusOf = (loc) => loc.state || "currently_unavailable";

  return (
    <div className={className}>
      <svg viewBox={vb} className="w-full" role="group" aria-label="Map of monitored Canadian cities">
        {CANADA_OUTLINES.map((poly, i) => (
          <polygon
            key={i}
            points={poly.map(([lat, lng]) => { const p = pt(lat, lng); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ")}
            fill="#EFF5F2"
            stroke="#DCE8E2"
            strokeWidth="0.8"
          />
        ))}
        {locations.map((loc) => {
          const status = statusOf(loc);
          const isSelected = selected && keyOf(selected) === keyOf(loc.name);
          const meta = COVERAGE_STATUS[status] || COVERAGE_STATUS.currently_unavailable;
          return (
            <g
              key={loc.name}
              onClick={() => onSelectCity && onSelectCity(loc.name)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectCity && onSelectCity(loc.name); } }}
              tabIndex={0}
              role="button"
              aria-label={`${loc.name}: ${meta.label}`}
              style={{ cursor: "pointer" }}
            >
              <title>{`${loc.name} · ${meta.label}`}</title>
              {isSelected && <circle cx={pt(loc.lat, loc.lng).x} cy={pt(loc.lat, loc.lng).y} r="9" fill="none" stroke={meta.color} strokeWidth="1.6" opacity="0.7" />}
              <circle
                cx={pt(loc.lat, loc.lng).x}
                cy={pt(loc.lat, loc.lng).y}
                r={isSelected ? 5 : 3.4}
                fill={meta.color}
                stroke="#F8FAF9"
                strokeWidth="1.2"
                className="transition-all duration-200"
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-si-muted">
        {Object.entries(COVERAGE_STATUS).map(([key, meta]) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full" style={{ background: meta.color }} />
            {meta.label}
          </span>
        ))}
      </div>
      <p className="mt-1.5 font-plex text-[10px] text-si-muted/80">Map geometry: {GEOGRAPHY_SOURCE}</p>
    </div>
  );
}