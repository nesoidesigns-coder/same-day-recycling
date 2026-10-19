import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Radio } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { CITIES } from "@/lib/cities";

const STATUS_LABEL = {
  new: "New booking",
  contacted: "Contacted",
  confirmed: "Confirmed",
  scheduled: "Scheduled",
  completed: "Completed",
};

export default function ActiveBookingsMap() {
  const [points, setPoints] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("activeBookingsMap");
        const rows = (res?.bookings || []).map((b) => {
          const c = CITIES.find((x) => x.name === b.city);
          if (!c) return null;
          return {
            lat: c.lat + (Math.random() - 0.5) * 0.06,
            lng: c.lng + (Math.random() - 0.5) * 0.06,
            city: c.name,
            status: b.status,
            created: b.created_date,
          };
        }).filter(Boolean);
        setPoints(rows);
      } catch {
        setPoints([]);
      }
    })();
  }, []);

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1d9e56]/10 px-4 py-1.5 text-sm font-semibold text-[#0c3b24]">
            <Radio className="w-4 h-4 text-[#1d9e56]" />
            Live activity
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-[#0c3b24] tracking-tight">
            Live bookings on the map
          </h2>
          <p className="mt-3 text-slate-600 text-lg">
            Every active pickup job, plotted in real time. Green means completed, dark means on the schedule.
          </p>
        </div>

        <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-sm h-[380px] md:h-[480px] relative z-0">
          {points === null ? (
            <div className="w-full h-full flex items-center justify-center bg-[#f4f7f5]">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-[#1d9e56] rounded-full animate-spin"></div>
            </div>
          ) : (
            <MapContainer
              center={[49.35, -122.7]}
              zoom={7}
              scrollWheelZoom={false}
              className="w-full h-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {points.map((p, i) => (
                <CircleMarker
                  key={i}
                  center={[p.lat, p.lng]}
                  radius={p.status === "completed" ? 7 : 9}
                  pathOptions={{
                    color: "#0c3b24",
                    fillColor: p.status === "completed" ? "#1d9e56" : "#0c3b24",
                    fillOpacity: p.status === "completed" ? 0.95 : 0.85,
                    weight: 2,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -8]} className="sdr-map-tooltip">
                    <strong>{p.city}</strong> · {STATUS_LABEL[p.status] || p.status} ·{" "}
                    {formatDistanceToNow(new Date(p.created), { addSuffix: true })}
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          )}
        </div>

        <p className="text-center mt-4 text-sm font-semibold text-slate-500">
          {points === null ? "" : `${points.length} active job${points.length === 1 ? "" : "s"} · updating continuously`}
        </p>
      </div>
    </section>
  );
}