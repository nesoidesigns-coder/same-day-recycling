import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Network, Loader2, ShieldCheck, Rocket, Radio, Boxes } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { base44 } from "@/api/base44Client";
import { REGIONS } from "@/lib/regions";
import { CITIES } from "@/lib/cities";
import { useTrafficOverlay, TrafficToggle, TrafficLayers } from "@/components/sdr/TrafficOverlay";

const norm = (s) => String(s || "").trim().replace(/\s+/g, " ").toLowerCase();
const CITY_BY_NAME = new Map(CITIES.map((c) => [norm(c.name), c]));

const REFRESH_MS = 60_000;

// The 3D board is a heavy renderer — loaded only when the visitor opens it.
const NetworkMap3D = lazy(() => import("./NetworkMap3D"));

export default function CanadaNetworkMap() {
  const [providers, setProviders] = useState(null);
  const [counts, setCounts] = useState({});
  const network = useCoverageStatus();
  const [sourceErrors, setSourceErrors] = useState({ directory: false, activity: false });
  const coverage = useMemo(() => ({ verified: network.verifiedCityNames, matching: network.matchingCityNames }), [network]);
  const [traffic, setTraffic] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [view3d, setView3d] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const trafficCfg = useTrafficOverlay();
  const [, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [directory, groups, activity] = await Promise.allSettled([
        base44.entities.Provider.filter({ verification: "verified" }, { limit: 500 }),
        base44.entities.Provider.aggregate({ query: { verification: "verified" }, groupBy: "province" }),
        base44.functions.invoke("activeBookingsMap", {}),
      ]);
      const directoryRows = directory.status === "fulfilled" ? directory.value.items || [] : [];
      const directoryCounts = groups.status === "fulfilled" ? Object.fromEntries((groups.value.rows || []).map((r) => [r.province, r.count])) : {};
      const byCity = {};
      let active24h = 0;
      if (activity.status === "fulfilled") {
        for (const booking of activity.value.data?.bookings || []) {
          if (booking.status === "completed") continue;
          if (Date.now() - new Date(booking.created_date).getTime() < 86400000) active24h += 1;
          byCity[booking.city] = (byCity[booking.city] || 0) + 1;
        }
      }
      if (!active) return;
      setProviders(directoryRows);
      setCounts(directoryCounts);
      setTraffic({ byCity, active: Object.values(byCity).reduce((a, b) => a + b, 0), active24h });
      setSourceErrors({ directory: directory.status !== "fulfilled" || groups.status !== "fulfilled", activity: activity.status !== "fulfilled" });
      setLastUpdated(new Date());
    };
    load();
    const interval = setInterval(load, REFRESH_MS);
    const ticker = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => { active = false; clearInterval(interval); clearInterval(ticker); };
  }, []);

  if (providers === null || coverage === null || traffic === null) {
    return (
      <section className="bg-[#f4f7f5] py-10 md:py-20">
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading the national network…
        </div>
      </section>
    );
  }

  const openRegions = sourceErrors.directory ? [] : REGIONS.filter((r) => !(counts[r.code] > 0));
  const coverageCities = [
    ...coverage.verified.map((name) => ({ name, city: CITY_BY_NAME.get(norm(name)), state: "same_day" })),
    ...coverage.matching.map((name) => ({ name, city: CITY_BY_NAME.get(norm(name)), state: "matching" })),
  ].filter((c) => c.city);

  return (
    <section className="bg-[#f4f7f5] py-10 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="max-w-2xl mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#187B65]/10 px-4 py-1.5 text-sm font-semibold text-[#102B2A]">
            <Network className="w-4 h-4 text-[#187B65]" />
            National network
            <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-[#187B65] text-white text-[11px] font-bold px-2 py-0.5">
              <Radio className="w-3 h-3" /> Live
            </span>
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-[#102B2A] tracking-tight">
            One network, built for all of Canada
          </h2>
          <p className="mt-3 text-slate-600 text-lg">
            Requests are accepted across Canada. A pickup is confirmed only after a contractor accepts your specific job, final price and arrival window.
            Municipal markers show recorded contractor territories, not service radii. Directory facilities are independently listed recycling destinations, not pickup partners.
          </p>
        </div>

        {/* 2D / 3D view switch — both views are the same live data */}
        <div className="flex justify-center mb-4">
          <div className="inline-flex rounded-full bg-white border border-slate-100 shadow-sm p-1">
            {[
              { mode: "2d", label: "2D live map", icon: Network },
              { mode: "3d", label: "3D interactive board", icon: Boxes },
            ].map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                onClick={() => setView3d(mode === "3d")}
                className={
                  (view3d ? mode === "3d" : mode === "2d")
                    ? "rounded-full bg-[#102B2A] text-[#187B65] font-bold px-4 py-2 text-xs sm:text-sm inline-flex items-center gap-1.5"
                    : "rounded-full text-slate-600 font-medium px-4 py-2 text-xs sm:text-sm inline-flex items-center gap-1.5 hover:bg-slate-100 transition-colors"
                }
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
            {trafficCfg && (
              <TrafficToggle on={showTraffic} onChange={setShowTraffic} />
            )}
          </div>
        </div>

        {view3d ? (
          <Suspense fallback={
            <div className="rounded-3xl bg-[#051511] h-[400px] md:h-[520px] flex items-center justify-center text-emerald-100/70">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Building the 3D board…
            </div>
          }>
            <NetworkMap3D
              coverageCities={coverageCities}
              providers={providers || []}
              trafficByCity={traffic.byCity}
              openRegions={openRegions}
              territoryLinks={network.territoryLinks}
            />
          </Suspense>
        ) : (
        <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-sm h-[400px] md:h-[520px] relative z-0">
          <MapContainer center={[58, -97]} zoom={4} minZoom={3} scrollWheelZoom={false} className="w-full h-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {showTraffic && <TrafficLayers traffic={trafficCfg} />}
            {/* Municipality points only: never infer a geographic service radius. */}
            {coverageCities.map(({ name, city, state }) => (
              <CircleMarker key={`cov-${name}`} center={[city.lat, city.lng]} radius={6}
                pathOptions={{ color: state === "same_day" ? "#187B65" : "#c9971f", fillOpacity: 1, weight: 2 }}>
                <Popup><strong>{name}</strong><p>{state === "same_day" ? "Verified contractor territory, job acceptance still required." : "Open request, contractor matching in progress."}</p></Popup>
              </CircleMarker>
            ))}
            {network.territoryLinks.map((link, i) => {
              const [a, b] = (link.cities || []).map((name) => CITY_BY_NAME.get(norm(name)));
              return a && b ? <Polyline key={`territory-${i}`} positions={[[a.lat, a.lng], [b.lat, b.lng]]} pathOptions={{ color: "#187B65", opacity: 0.7, weight: 1.5 }}><Popup>Shared explicit contractor territory, not a live route.</Popup></Polyline> : null;
            })}
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
                      Directory listings researched — facility confirmation in progress · service requests open
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
                      Directory facility, not a pickup contractor — {[p.city, p.province].filter(Boolean).join(", ")}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
            {/* live job traffic bubbles */}
            {Object.entries(traffic.byCity).map(([name, n]) => {
              const c = CITY_BY_NAME.get(norm(name));
              if (!c) return null;
              return (
                <CircleMarker
                  key={`traffic-${name}`}
                  center={[c.lat, c.lng]}
                  radius={Math.min(5 + n * 1.5, 14)}
                  pathOptions={{ color: "#102B2A", fillColor: "#54D9AE", fillOpacity: 0.55, weight: 1.5 }}
                >
                  <Popup>
                    <div style={{ minWidth: 150 }}>
                      <strong style={{ color: "#102B2A" }}>{c.name}</strong>
                      <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                        {n} open booking record{n === 1 ? "" : "s"} in the latest 100 records, not proof of work in progress
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
        )}

        {/* live report strip */}
        <div className="mt-5 rounded-2xl border border-slate-100 bg-white px-5 py-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#187B65] inline-block" />
            <ShieldCheck className="w-3.5 h-3.5 text-[#187B65]" /> {sourceErrors.directory ? "—" : Object.values(counts).reduce((a, b) => a + b, 0)} verified directory facilities
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#187B65]/40 inline-block" /> {network.loaded ? coverage.verified.length : "—"} verified territories · {network.loaded ? coverage.matching.length : "—"} matching
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#54D9AE] inline-block" /> {sourceErrors.activity ? "—" : traffic.active} open booking records (latest 100; {sourceErrors.activity ? "—" : traffic.active24h} created in the rolling 24h)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
            <Rocket className="w-3.5 h-3.5 text-slate-500" /> {sourceErrors.directory ? "—" : openRegions.length} regions without verified directory listings
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#187B65]">
            <Radio className="w-3.5 h-3.5" />
            {sourceErrors.directory || sourceErrors.activity || network.error ? "Some sources unavailable" : "Snapshot loaded"} · {lastUpdated ? `retrieved ${formatDistanceToNow(lastUpdated, { addSuffix: true })}` : "loading"} · refreshes every minute
          </span>
        </div>
      </div>
    </section>
  );
}