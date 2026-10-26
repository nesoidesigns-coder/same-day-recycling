import { CineSectionLabel } from "./CinePrimitives";
import { CITIES } from "@/lib/cities";

// Lightweight 2D Canadian geographic intelligence. Province shapes from the
// platform's own boundary file; city markers only where real observed records
// resolved to a city, coverage rings only from verified partner records.
// When the boundary file can't load, a city list keeps the interaction honest.
const norm = (s) => String(s || "").trim().replace(/\s+/g, " ").toLowerCase();
const CITY_COORD = new Map(CITIES.map((c) => [norm(c.name), c]));

export default function CinematicCanadaMap({
  geography,
  geoError,
  cities = [],
  coverageCities = [],
  province,
  onProvince,
  onCity,
}) {
  const pins = cities
    .map((c) => {
      const meta = CITY_COORD.get(norm(c.city));
      return meta ? { ...c, ...meta } : null;
    })
    .filter(Boolean)
    .filter((m) => m.count > 0);
  const covRings = coverageCities
    .map((name) => {
      const meta = CITY_COORD.get(norm(name));
      return meta ? { name: meta.name, ...meta } : null;
    })
    .filter(Boolean);
  const maxCount = Math.max(1, ...pins.map((m) => m.count));

  if (geoError || !geography) {
    return (
      <div>
        <CineSectionLabel>Select a city</CineSectionLabel>
        <div className="mt-3 flex flex-wrap gap-2">
          {(pins.length ? pins : coverageCities.map((n) => ({ city: n, count: 0 }))).map((m) => (
            <button
              key={m.city}
              onClick={() => onCity?.(m.city)}
              className="rounded-full border border-cine-line/70 bg-cine-surface/60 px-3.5 py-2 text-xs font-semibold text-cine-ink transition-colors hover:border-cine-cyan/60"
            >
              {m.city}{m.count ? ` · ${m.count}` : ""}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-cine-muted">
          {geoError
            ? "The detailed map layer is unavailable right now — city selection still works from this list."
            : "Loading the Canadian map layer…"}
        </p>
      </div>
    );
  }

  return (
    <div>
      <svg viewBox="0 0 1020 600" className="block w-full" role="group" aria-label="Canadian service intelligence map">
        {geography.provinces.map((p) => (
          <path
            key={p.code}
            d={p.paths.join("")}
            fillRule="evenodd"
            vectorEffect="non-scaling-stroke"
            className={province === p.code ? "cine-province cine-province-selected" : "cine-province"}
            onClick={() => onProvince?.(p.code)}
          >
            <title>{p.name} · select to explore</title>
          </path>
        ))}
        {covRings.map((m) => {
          const p = projectPoint(m.lng, m.lat);
          return (
            <circle key={"cov-" + m.name} cx={p.x} cy={p.y} r="9" fill="none" stroke="#F6A000" strokeWidth="1.6" strokeOpacity="0.85" pointerEvents="none" />
          );
        })}
        {pins.map((m) => {
          const p = projectPoint(m.lng, m.lat);
          const r = 4 + (m.count / maxCount) * 7;
          return (
            <g key={"obs-" + m.city} className="cursor-pointer" onClick={() => onCity?.(m.city)}>
              <circle cx={p.x} cy={p.y} r={r} fill="#22D3EE" fillOpacity="0.2" />
              <circle cx={p.x} cy={p.y} r={Math.max(3, r / 2.4)} fill="#22D3EE" fillOpacity="0.95">
                <title>{`${m.city}${m.province_code ? `, ${m.province_code}` : ""}: ${m.count} observed record${m.count === 1 ? "" : "s"}`}</title>
              </circle>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-cine-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#22D3EE]" /> Observed demand (record count)</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border-2 border-[#F6A000]" /> Verified contractor coverage</span>
        <span>Select a province or a lit city to focus the instrument and panels.</span>
      </div>
    </div>
  );
}

// Same projection the observatory uses, kept local so the map component
// stays self-contained.
function projectPoint(lng, lat) {
  const r = Math.PI / 180, n = Math.sin(55 * r);
  const f = Math.cos(55 * r) * Math.pow(Math.tan(Math.PI / 4 + 55 * r / 2), n) / n;
  const rho = f / Math.pow(Math.tan(Math.PI / 4 + lat * r / 2), n);
  const origin = f / Math.pow(Math.tan(Math.PI / 4 + 60 * r / 2), n), theta = n * (lng + 96) * r;
  return { x: 510 + rho * Math.sin(theta) * 650, y: 300 + (rho * Math.cos(theta) - origin) * 650 };
}