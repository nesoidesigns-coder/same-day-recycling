import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { CITIES } from "@/lib/cities";

const norm = (s) => String(s || "").trim().replace(/\s+/g, " ").toLowerCase();
const CITY_COORD = new Map(CITIES.map((c) => [norm(c.name), c]));

// Light-themed Canadian activity map for the LIVE Centre. Emerald markers =
// observed demand (sized by real record counts, shown only for cities whose
// coordinates are on file). Amber rings = verified contractor coverage.
// Provincial or national totals are never projected onto cities without data.
export default function LiveActivityMap({ cities = [], coverageCities = [] }) {
  const obsMarkers = cities
    .map((c) => {
      const meta = CITY_COORD.get(norm(c.city));
      return { ...c, lat: meta?.lat, lng: meta?.lng };
    })
    .filter((m) => m.lat && m.count > 0);
  const covMarkers = coverageCities
    .map((name) => {
      const meta = CITY_COORD.get(norm(name));
      return meta ? { name: meta.name, lat: meta.lat, lng: meta.lng } : null;
    })
    .filter(Boolean);
  const maxCount = Math.max(1, ...obsMarkers.map((m) => m.count));

  return (
    <div>
      <div className="relative z-0 overflow-hidden rounded-2xl border border-slate-200" style={{ height: 340 }}>
        <MapContainer center={[54.5, -101]} zoom={3.6} minZoom={3} maxZoom={7} scrollWheelZoom={false} style={{ height: "100%", width: "100%", background: "#f4f7f5" }} attributionControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {covMarkers.map((m) => (
            <CircleMarker key={"cov-" + m.name} center={[m.lat, m.lng]} radius={9} pathOptions={{ color: "#B45309", weight: 2, fillColor: "#FCD34D", fillOpacity: 0.55 }}>
              <Tooltip direction="top" offset={[0, -6]}>
                <div className="sdr-map-tooltip">{m.name}: verified contractor coverage</div>
              </Tooltip>
            </CircleMarker>
          ))}
          {obsMarkers.map((m) => {
            const radius = 7 + (m.count / maxCount) * 11;
            return (
              <CircleMarker key={"obs-" + m.city} center={[m.lat, m.lng]} radius={radius} pathOptions={{ color: "#0F5C4B", weight: 2, fillColor: "#187B65", fillOpacity: 0.75 }}>
                <Tooltip direction="top" offset={[0, -6]}>
                  <div className="sdr-map-tooltip">{m.city}{m.province_code ? `, ${m.province_code}` : ""}: {m.count} observation{m.count === 1 ? "" : "s"}</div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#187B65]" /> Observed demand (record count)</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border-2 border-[#B45309] bg-[#FCD34D]" /> Verified contractor coverage</span>
        {cities.length > obsMarkers.length && <span>Some observed cities aren't pinned because their coordinates aren't on file.</span>}
      </div>
    </div>
  );
}