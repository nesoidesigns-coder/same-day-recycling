import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Recycle, Loader2, RefreshCw, ExternalLink, Phone, Navigation } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { CITIES } from "@/lib/cities";

// Live road radar exits for self-haulers: deep links open the driver's own
// navigation app, where live traffic and route choice are real — no invented
// congestion data is drawn on the map itself.
const directionsLinks = (c) => (
  <div style={{ fontSize: 12, marginTop: 6, display: "flex", gap: 8 }}>
    <a
      href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}&travelmode=driving`}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "#187B65", fontWeight: 700, textDecoration: "underline" }}
    >
      Directions · live traffic
    </a>
    <a
      href={`https://waze.com/ul?ll=${c.lat},${c.lng}&navigate=yes`}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "#102B2A", fontWeight: 700, textDecoration: "underline" }}
    >
      Waze radar
    </a>
  </div>
);

export default function RecyclingCentersMap({ city = null, showSelector = false }) {
  const [centers, setCenters] = useState(null);
  const [activeCity, setActiveCity] = useState(city);
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    base44.functions
      .invoke("recyclingCenters", {})
      .then((res) => {
        if (active) setCenters(res.data?.centers || []);
      })
      .catch(() => {
        if (active) setCenters([]);
      });
    base44.auth
      .me()
      .then((me) => {
        if (active) setIsAdmin(me?.role === "admin");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await base44.functions.invoke("recyclingCenters", { action: "refresh" });
      const res = await base44.functions.invoke("recyclingCenters", {});
      setCenters(res.data?.centers || []);
    } catch {}
    setRefreshing(false);
  };

  const shown = (centers || []).filter((c) => !activeCity || c.city === activeCity);
  const cityInfo = CITIES.find((c) => c.name === activeCity);
  const mapCenter = cityInfo ? [cityInfo.lat, cityInfo.lng] : [58, -97];
  const lastResearched = shown.length
    ? shown.map((c) => c.researched_date).filter(Boolean).sort().pop()
    : null;

  return (
    <section id="recycling-centers" className="bg-white py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="max-w-2xl mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#187B65]/10 px-4 py-1.5 text-sm font-semibold text-[#102B2A]">
            <Recycle className="w-4 h-4 text-[#187B65]" />
            Live recycling map
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-[#102B2A] tracking-tight">
            {activeCity ? `Recycling centres in ${activeCity}` : "Recycling centres across Canada"}
          </h2>
          <p className="mt-3 text-slate-600 text-lg">
            Real drop-off depots, transfer stations and recycling facilities across Canada — researched and kept up to date for you.
            Self-hauling? Open directions from any centre and your navigation app shows live road conditions for the trip.
          </p>
          {lastResearched && (
            <p className="mt-1 text-xs text-slate-400">Last updated:{" "}{lastResearched}</p>
          )}
        </div>

        {showSelector && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveCity(null)}
              className={
                !activeCity
                  ? "rounded-full bg-[#102B2A] text-[#187B65] font-bold px-4 py-2 text-sm"
                  : "rounded-full bg-slate-100 text-slate-700 font-medium px-4 py-2 text-sm hover:bg-slate-200 transition-colors"
              }
            >
              All cities
            </button>
            {CITIES.map((c) => (
              <button
                key={c.slug}
                onClick={() => setActiveCity(c.name)}
                className={
                  activeCity === c.name
                    ? "rounded-full bg-[#102B2A] text-[#187B65] font-bold px-4 py-2 text-sm"
                    : "rounded-full bg-slate-100 text-slate-700 font-medium px-4 py-2 text-sm hover:bg-slate-200 transition-colors"
                }
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {centers === null ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading recycling centres…
          </div>
        ) : (
          <>
            <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-sm h-[380px] md:h-[480px] relative z-0">
              <MapContainer center={mapCenter} zoom={activeCity ? 10 : 4} scrollWheelZoom={false} className="w-full h-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {shown.map((c) => (
                  <CircleMarker
                    key={c.id}
                    center={[c.lat, c.lng]}
                    radius={8}
                    pathOptions={{ color: "#102B2A", fillColor: "#187B65", fillOpacity: 1, weight: 2 }}
                  >
                    <Popup>
                      <div style={{ minWidth: 180 }}>
                        <strong style={{ color: "#102B2A" }}>{c.name}</strong>
                        <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{c.address}</div>
                        {c.accepts && (
                          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                            <strong>Accepts:</strong> {c.accepts}
                          </div>
                        )}
                        {c.note && <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{c.note}</div>}
                        {c.phone && (
                          <div style={{ fontSize: 12, marginTop: 4 }}>
                            <a href={`tel:${c.phone}`}>{c.phone}</a>
                          </div>
                        )}
                        {c.website && (
                          <div style={{ fontSize: 12, marginTop: 4 }}>
                            <a href={c.website} target="_blank" rel="noopener noreferrer">
                              Website
                            </a>
                          </div>
                        )}
                        {directionsLinks(c)}

                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shown.slice(0, 12).map((c) => (
                <div key={c.id} className="rounded-2xl border border-slate-100 bg-[#f4f7f5] p-4">
                  <p className="font-bold text-[#102B2A] text-sm">{c.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{c.address}</p>
                  {c.accepts && <p className="text-xs text-slate-600 mt-2">Accepts: {c.accepts}</p>}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 text-[#187B65] font-semibold">
                        <Phone className="w-3 h-3" /> Call
                      </a>
                    )}
                    {c.website && (
                      <a href={c.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#187B65] font-semibold">
                        <ExternalLink className="w-3 h-3" /> Website
                      </a>
                    )}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}&travelmode=driving`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#187B65] font-semibold"
                    >
                      <Navigation className="w-3 h-3" /> Directions · live traffic
                    </a>
                  </div>
                </div>
              ))}
            </div>
            {shown.length === 0 && (
              <p className="text-center text-sm text-slate-500 mt-4">
                No facilities listed for this city yet — listings are added as they're researched and confirmed.
              </p>
            )}
          </>
        )}

        {isAdmin && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-full bg-[#102B2A] text-white font-bold px-6 py-3 text-sm hover:bg-[#0a3020] transition-colors disabled:opacity-60"
            >
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {refreshing ? "Checking for updates…" : "Update map"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}