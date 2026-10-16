import { MapContainer, TileLayer, CircleMarker, Circle, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import { CITIES } from "@/lib/cities";

export default function CityMap({ city }) {
  const covered = CITIES.filter((c) => c.name !== city.name);

  return (
    <section id="service-area" className="bg-white py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="max-w-2xl mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1d9e56]/10 px-4 py-1.5 text-sm font-semibold text-[#0c3b24]">
            <MapPin className="w-4 h-4 text-[#1d9e56]" />
            Service area
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-[#0c3b24] tracking-tight">
            We cover {city.name} — and the whole Lower Mainland
          </h2>
          <p className="mt-3 text-slate-600 text-lg">
            {city.blurb} Our trucks run same-day routes across the region, so a pickup is never far away.
          </p>
        </div>

        <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-sm h-[380px] md:h-[480px] relative z-0">
          <MapContainer
            center={[city.lat, city.lng]}
            zoom={10}
            scrollWheelZoom={false}
            className="w-full h-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* Highlight the current city */}
            <Circle center={[city.lat, city.lng]} radius={city.radius} pathOptions={{ color: "#1d9e56", fillColor: "#1d9e56", fillOpacity: 0.18, weight: 2 }} />
            <CircleMarker center={[city.lat, city.lng]} radius={8} pathOptions={{ color: "#0c3b24", fillColor: "#1d9e56", fillOpacity: 1, weight: 3 }}>
              <Tooltip permanent direction="top" offset={[0, -8]} className="sdr-map-tooltip">
                {city.name}
              </Tooltip>
            </CircleMarker>
            {/* Other covered areas */}
            {covered.map((c) => (
              <CircleMarker key={c.slug} center={[c.lat, c.lng]} radius={7} pathOptions={{ color: "#0c3b24", fillColor: "#0c3b24", fillOpacity: 0.7, weight: 2 }}>
                <Tooltip direction="top" offset={[0, -8]} className="sdr-map-tooltip">
                  {c.name}
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {CITIES.map((c) => (
            <span
              key={c.slug}
              className={
                c.name === city.name
                  ? "rounded-full bg-[#0c3b24] text-[#1d9e56] font-bold px-4 py-2 text-sm"
                  : "rounded-full bg-slate-100 text-slate-700 font-medium px-4 py-2 text-sm"
              }
            >
              {c.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}