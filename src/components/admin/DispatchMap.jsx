import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { CITIES } from "@/lib/cities";

const EXTRA_COORDS = {
  brampton: [43.7315, -79.7624],
  vaughan: [43.8563, -79.5085],
  markham: [43.8561, -79.337],
  london: [42.9849, -81.2453],
  kitchener: [43.4516, -80.4925],
  laval: [45.6066, -73.7124],
  saskatoon: [52.1332, -106.67],
  regina: [50.4452, -104.6189],
  moncton: [46.0878, -64.7782],
  "st. john's": [47.5615, -52.7126],
  edmonton: [53.5461, -113.4938],
  calgary: [51.0447, -114.0719],
};

const coordsFor = (city) => {
  const c = (city || "").toLowerCase().trim();
  const inLib = CITIES.find((x) => x.name.toLowerCase() === c);
  if (inLib) return [inLib.lat, inLib.lng];
  return EXTRA_COORDS[c] || null;
};

export default function DispatchMap({ bookings, onSelectCity, height = 320 }) {
  const counts = {};
  for (const b of bookings || []) {
    const city = (b.city || "").trim();
    if (!city) continue;
    counts[city] = (counts[city] || 0) + 1;
  }
  const mapped = Object.entries(counts)
    .map(([city, count]) => ({ city, count, coords: coordsFor(city) }))
    .filter((x) => x.coords);
  const unmapped = Object.entries(counts).filter(([c]) => !coordsFor(c));
  const max = Math.max(1, ...mapped.map((m) => m.count));

  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
        <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-[#0c3b24]">Service-area map</h3>
        {unmapped.length > 0 && (
          <span className="text-[11px] font-semibold text-amber-600">
            No map location for: {unmapped.map(([c]) => c).join(", ")}
          </span>
        )}
      </div>
      <div style={{ height }} className="rounded-xl overflow-hidden border border-slate-100 relative z-0 isolate">
        <MapContainer center={[49.25, -123.0]} zoom={9} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {mapped.map((m) => (
            <CircleMarker
              key={m.city}
              center={m.coords}
              radius={10 + (m.count / max) * 16}
              pathOptions={{ color: "#0c3b24", weight: 2, fillColor: "#1d9e56", fillOpacity: 0.55 }}
              eventHandlers={{ click: () => onSelectCity && onSelectCity(m.city) }}
            >
              <Tooltip direction="top" className="sdr-map-tooltip" permanent={false}>
                {m.city}: {m.count} job{m.count === 1 ? "" : "s"}
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <p className="text-[11px] text-slate-400 mt-2 px-1">Bubble size = active job count per city. Click a city to filter the board.</p>
    </div>
  );
}