import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function RouteMap({ stops }) {
  if (!stops || stops.length === 0) return null;
  const lats = stops.map((s) => s.lat);
  const lngs = stops.map((s) => s.lng);
  const center = [
    (Math.min(...lats) + Math.max(...lats)) / 2,
    (Math.min(...lngs) + Math.max(...lngs)) / 2,
  ];
  const span = Math.max(Math.max(...lats) - Math.min(...lats), (Math.max(...lngs) - Math.min(...lngs)) * 0.6);
  const zoom = span > 1.5 ? 9 : span > 0.5 ? 11 : 13;

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 h-[360px] relative z-0">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline
          positions={stops.map((s) => [s.lat, s.lng])}
          pathOptions={{ color: "#187B65", weight: 3, opacity: 0.8 }}
        />
        {stops.map((s) => (
          <CircleMarker
            key={s.booking_id}
            center={[s.lat, s.lng]}
            radius={9}
            pathOptions={{ color: "#102B2A", fillColor: "#187B65", fillOpacity: 1, weight: 2 }}
          >
            <Popup>
              <div style={{ minWidth: 170 }}>
                <div style={{ fontWeight: 700, color: "#102B2A" }}>
                  Stop {s.stop_number}: {s.name}
                </div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{s.address}</div>
                {s.leg_km > 0 && (
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                    {s.leg_km} km from previous stop
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}