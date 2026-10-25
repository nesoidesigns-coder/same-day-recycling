import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Camera } from "lucide-react";
import LiveCityView from "@/components/sdr/LiveCityView";

// Fit the map to the directory results once, on load.
function FitResults({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) map.setView([points[0].lat, points[0].lng], 11);
    else map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])).pad(0.25));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// Live facility map for the recycling directory: one pin per listed facility,
// each opening a full live view (street map, satellite, street-level imagery).
export default function DirectoryMap({ results = [] }) {
  const points = useMemo(
    () => results.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)).map((p) => ({ lat: p.lat, lng: p.lng, name: p.name })),
    [results]
  );
  const [live, setLive] = useState(null);
  if (!points.length) return null;

  return (
    <div className="mb-6">
      <div className="relative z-0 h-72 overflow-hidden rounded-2xl border border-slate-200 shadow-sm sm:h-96">
        <MapContainer center={[58, -97]} zoom={4} minZoom={3} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }} aria-label="Map of listed recycling facilities">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitResults points={points} />
          {points.map((p, i) => (
            <CircleMarker key={`${p.name}-${i}`} center={[p.lat, p.lng]} radius={8}
              pathOptions={{ color: "#102B2A", fillColor: "#187B65", fillOpacity: 1, weight: 2 }}>
              <Popup>
                <div style={{ minWidth: 170 }}>
                  <strong style={{ color: "#102B2A" }}>{p.name}</strong>
                  <button onClick={() => setLive(p)} className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600">
                    <Camera className="h-3.5 w-3.5" /> Open live view
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {points.length} listing{points.length === 1 ? "" : "s"} on the live map. Tap a pin, then “Open live view” for the full interactive map, satellite imagery or street-level photos.
      </p>

      {live && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/70 sm:items-center sm:p-6" onClick={() => setLive(null)}>
          <div className="h-[75vh] w-full max-w-3xl sm:h-[70vh]" onClick={(e) => e.stopPropagation()}>
            <LiveCityView lat={live.lat} lng={live.lng} label={live.name} onClose={() => setLive(null)} className="h-full" />
          </div>
        </div>
      )}
    </div>
  );
}