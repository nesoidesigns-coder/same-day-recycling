import { useRef, useState } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// High-detail local transition at neighborhood level: satellite imagery
// (Esri World Imagery, free public service) and a standard street map with
// street labels (OpenStreetMap). The draggable pin lets the customer place
// the pickup marker at the real loading entrance — geocoded points can sit
// mid-property. This is map imagery, never a live camera feed.
const SATELLITE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const STREET_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const pickupIcon = L.divIcon({
  className: "",
  html: '<div style="width:26px;height:26px;border-radius:9999px;background:radial-gradient(circle at 30% 30%, #ffd27a, #187B65);border:3px solid #fff;box-shadow:0 0 0 6px rgba(255,194,75,0.35),0 2px 8px rgba(0,0,0,0.4);"></div>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

export default function PickupLocationMap({ lat, lng, onMove, lang = "en" }) {
  const fr = lang === "fr";
  const [mode, setMode] = useState("satellite");
  const markerRef = useRef(null);

  return (
    <div>
      <div className="mb-2 flex gap-2" role="group" aria-label={fr ? "Type de carte" : "Map type"}>
        <button type="button" onClick={() => setMode("satellite")} aria-pressed={mode === "satellite"} className={`min-h-10 rounded-full border px-4 text-sm font-bold transition-colors ${mode === "satellite" ? "border-[#187B65] bg-[#187B65]/20 text-market-ink" : "border-white/25 hover:border-[#187B65]"}`}>
          {fr ? "Satellite" : "Satellite"}
        </button>
        <button type="button" onClick={() => setMode("map")} aria-pressed={mode === "map"} className={`min-h-10 rounded-full border px-4 text-sm font-bold transition-colors ${mode === "map" ? "border-[#187B65] bg-[#187B65]/20 text-market-ink" : "border-white/25 hover:border-[#187B65]"}`}>
          {fr ? "Carte" : "Map"}
        </button>
      </div>
      <div className="h-64 overflow-hidden rounded-xl border border-market-line sm:h-72">
        <MapContainer center={[lat, lng]} zoom={16} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }} aria-label={fr ? "Carte locale du lieu de ramassage" : "Local pickup location map"}>
          {mode === "satellite"
            ? <TileLayer key="sat" url={SATELLITE_URL} attribution="Imagery &copy; Esri" maxZoom={19} />
            : <TileLayer key="osm" url={STREET_URL} attribution="&copy; OpenStreetMap contributors" maxZoom={19} />}
          <Marker
            position={[lat, lng]}
            icon={pickupIcon}
            draggable
            ref={markerRef}
            eventHandlers={{
              dragend: () => {
                const p = markerRef.current?.getLatLng?.();
                if (p && Number.isFinite(p.lat) && Number.isFinite(p.lng)) onMove?.(p.lat, p.lng);
              },
            }}
          />
        </MapContainer>
      </div>
      <p className="mt-1.5 text-[11px] text-market-muted">
        {fr
          ? "Faites glisser l'épingle vers l'entrée de chargement réelle si le point géocodé n'est pas au bon endroit."
          : "Drag the pin to the real loading entrance if the geocoded point is not where the truck should load."}
      </p>
    </div>
  );
}