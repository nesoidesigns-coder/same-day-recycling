import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { CITIES } from "@/lib/cities";

const norm = (s) => String(s || "").trim().replace(/\s+/g, " ").toLowerCase();
const CITY_COORD = new Map(CITIES.map((c) => [norm(c.name), c]));

// Interactive Canadian demand map: one marker per city that has verified
// city-level demand observations (volume or index). Cities without city-level
// data get no marker — provincial and national figures are never projected
// down to a city. Clicking a marker selects that city.
export default function DemandMap({ cities, volumes, selected, onSelect }) {
  const markers = (cities || [])
    .map((c) => {
      const meta = CITY_COORD.get(norm(c.key));
      const v = volumes[c.key];
      return {
        key: c.key,
        province_code: c.province_code || (meta && meta.province) || "",
        lat: meta?.lat,
        lng: meta?.lng,
        volume: v?.volume || 0,
        index: v?.index || 0,
      };
    })
    .filter((m) => m.lat && (m.volume > 0 || m.index > 0));

  return (
    <div className="relative z-0 overflow-hidden rounded-3xl border border-[#187B65]/25" style={{ height: 340 }}>
      <MapContainer center={[54.5, -101]} zoom={3.6} minZoom={3} maxZoom={7} scrollWheelZoom={false} style={{ height: "100%", width: "100%", background: "#0a2e24" }} attributionControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {markers.map((m) => {
          const isSelected = selected && selected.toLowerCase() === m.key.toLowerCase();
          const radius = m.volume > 0 ? Math.min(18, 7 + Math.log10(Math.max(10, m.volume)) * 1.6) : 6;
          return (
            <CircleMarker
              key={m.key}
              center={[m.lat, m.lng]}
              radius={radius}
              pathOptions={{
                color: isSelected ? "#ffffff" : m.volume > 0 ? "#54D9AE" : "#A7F3D0",
                weight: isSelected ? 3 : 1.5,
                fillColor: "#187B65",
                fillOpacity: 0.75,
              }}
              eventHandlers={{ click: () => onSelect && onSelect(m.key) }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <div className="sdr-map-tooltip">
                  {m.key}{m.province_code ? `, ${m.province_code}` : ""}:{" "}
                  {m.volume > 0 ? `${Math.round(m.volume).toLocaleString("en-CA")} est. searches/mo` : `interest index ${Math.round(m.index)}`}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}