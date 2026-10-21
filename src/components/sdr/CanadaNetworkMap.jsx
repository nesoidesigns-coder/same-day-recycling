import { useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Network, Loader2, ShieldCheck, Rocket } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { REGIONS } from "@/lib/regions";

const HUB = { lat: 49.2827, lng: -123.1207, label: "Network HQ — Canada" };

export default function CanadaNetworkMap() {
  const [providers, setProviders] = useState(null);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    let active = true;
    base44.entities.Provider
      .filter({ verification: "verified" }, { limit: 500 })
      .then((res) => active && setProviders(res.items || res))
      .catch(() => active && setProviders([]));
    base44.entities.Provider
      .aggregate({ query: { verification: "verified" }, groupBy: "province" })
      .then((res) => {
        if (!active) return;
        const map = {};
        for (const row of res.rows || []) map[row.province] = row.count;
        setCounts(map);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const openRegions = REGIONS.filter((r) => !(counts[r.code] > 0));

  return (
    <section className="bg-[#f4f7f5] py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="max-w-2xl mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#187B65]/10 px-4 py-1.5 text-sm font-semibold text-[#102B2A]">
            <Network className="w-4 h-4 text-[#187B65]" />
            National network
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-[#102B2A] tracking-tight">
            One network, built for all of Canada
          </h2>
          <p className="mt-3 text-slate-600 text-lg">
            Same-day pickup is live today across BC's Lower Mainland, with partner territories onboarding nationwide.
            Every green point is a verified recycling provider in our network.
          </p>
        </div>

        {providers === null ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading the national network…
          </div>
        ) : (
          <>
            <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-sm h-[400px] md:h-[520px] relative z-0">
              <MapContainer center={[58, -97]} zoom={4} minZoom={3} scrollWheelZoom={false} className="w-full h-full">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {/* network connections: verified providers to HQ */}
                {(providers || []).map((p) => (
                  <Polyline
                    key={`line-${p.id}`}
                    positions={[[p.lat, p.lng], [HUB.lat, HUB.lng]]}
                    pathOptions={{ color: "#187B65", opacity: 0.18, weight: 1.2 }}
                  />
                ))}
                {/* expansion connections: open regions to HQ */}
                {openRegions.map((r) => (
                  <Polyline
                    key={`open-${r.code}`}
                    positions={[[r.lat, r.lng], [HUB.lat, HUB.lng]]}
                    pathOptions={{ color: "#102B2A", opacity: 0.1, weight: 1, dashArray: "4 6" }}
                  />
                ))}
                {/* open-region capital nodes */}
                {openRegions.map((r) => (
                  <CircleMarker
                    key={`node-${r.code}`}
                    center={[r.lat, r.lng]}
                    radius={6}
                    pathOptions={{ color: "#64748b", fillColor: "#cbd5e1", fillOpacity: 0.9, weight: 2 }}
                  >
                    <Popup>
                      <div style={{ minWidth: 160 }}>
                        <strong style={{ color: "#102B2A" }}>{r.name}</strong>
                        <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                          Partner onboarding — provider applications open
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
                {/* verified provider markers */}
                {(providers || []).map((p) => (
                  <CircleMarker
                    key={p.id}
                    center={[p.lat, p.lng]}
                    radius={7}
                    pathOptions={{ color: "#102B2A", fillColor: "#187B65", fillOpacity: 1, weight: 2, className: "network-pulse" }}
                  >
                    <Popup>
                      <div style={{ minWidth: 170 }}>
                        <strong style={{ color: "#102B2A" }}>{p.name}</strong>
                        <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                          Verified provider — {[p.city, p.province].filter(Boolean).join(", ")}
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
                {/* HQ node */}
                <CircleMarker
                  center={[HUB.lat, HUB.lng]}
                  radius={9}
                  pathOptions={{ color: "#102B2A", fillColor: "#102B2A", fillOpacity: 1, weight: 3 }}
                >
                  <Popup>
                    <div style={{ fontWeight: 700, color: "#102B2A" }}>{HUB.label}</div>
                  </Popup>
                </CircleMarker>
              </MapContainer>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#187B65] inline-block" />
                <ShieldCheck className="w-3.5 h-3.5 text-[#187B65]" /> {providers.length} verified providers
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
                <Rocket className="w-3.5 h-3.5 text-slate-500" /> {openRegions.length} regions onboarding providers
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#102B2A] inline-block" /> Network HQ — Canada
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}