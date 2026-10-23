import { Suspense, lazy, useEffect, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Circle, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Network, Loader2, ShieldCheck, Rocket, Radio, Boxes } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { base44 } from "@/api/base44Client";
import { REGIONS } from "@/lib/regions";
import { CITIES } from "@/lib/cities";

const HUB = { lat: 49.2827, lng: -123.1207, label: "Network HQ — Canada" };

const norm = (s) => String(s || "").trim().replace(/\s+/g, " ").toLowerCase();
const CITY_BY_NAME = new Map(CITIES.map((c) => [norm(c.name), c]));

const REFRESH_MS = 60_000;

// The 3D board is a heavy renderer — loaded only when the visitor opens it.
const NetworkMap3D = lazy(() => import("./NetworkMap3D"));

export default function CanadaNetworkMap() {
  const [providers, setProviders] = useState(null);
  const [counts, setCounts] = useState({});
  const [coverage, setCoverage] = useState(null);
  const [traffic, setTraffic] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [view3d, setView3d] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const next = {};
      try {
        const res = await base44.entities.Provider.filter({ verification: "verified" }, { limit: 500 });
        next.providers = res.items || res;
      } catch { next.providers = []; }
      try {
        const agg = await base44.entities.Provider.aggregate({ query: { verification: "verified" }, groupBy: "province" });
        next.counts = Object.fromEntries((agg.rows || []).map((r) => [r.province, r.count]));
      } catch { next.counts = {}; }
      try {
        const snap = await base44.functions.invoke("coverageStatus", {});
        next.coverage = {
          verified: snap?.verified_cities || [],
          matching: (snap?.matching_cities || []).filter((n) => !(snap?.verified_cities || []).includes(n)),
        };
      } catch { next.coverage = { verified: [], matching: [] }; }
      try {
        const res = await base44.functions.invoke("activeBookingsMap", {});
        const now = Date.now();
        const byCity = {};
        let active24h = 0;
        for (const b of res?.bookings || []) {
          if (b.status === "completed") continue;
          if (now - new Date(b.created_date).getTime() < 24 * 3600 * 1000) active24h += 1;
          byCity[b.city] = (byCity[b.city] || 0) + 1;
        }
        next.traffic = { byCity, active: Object.values(byCity).reduce((a, b) => a + b, 0), active24h };
      } catch { next.traffic = { byCity: {}, active: 0, active24h: 0 }; }
      if (!active) return;
      setProviders(next.providers);
      setCounts(next.counts);
      setCoverage(next.coverage);
      setTraffic(next.traffic);
      setLastUpdated(new Date());
    };
    load();
    const interval = setInterval(load, REFRESH_MS);
    const ticker = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => { active = false; clearInterval(interval); clearInterval(ticker); };
  }, []);

  if (providers === null || coverage === null || traffic === null) {
    return (
      <section className="bg-[#f4f7f5] py-16 md:py-20">
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading the national network…
        </div>
      </section>
    );
  }

  const openRegions = REGIONS.filter((r) => !(counts[r.code] > 0));
  const coverageCities = [
    ...coverage.verified.map((name) => ({ name, city: CITY_BY_NAME.get(norm(name)), state: "same_day" })),
    ...coverage.matching.map((name) => ({ name, city: CITY_BY_NAME.get(norm(name)), state: "matching" })),
  ].filter((c) => c.city);

  return (
    <section className="bg-[#f4f7f5] py-16 md:py-20">
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
            We accept service requests from every Canadian city — same-day pickup is confirmed wherever a verified contractor is available, and we source one where we're still expanding.
            Shaded areas are live coverage zones from verified-partner status; every green point is an independent recycling facility verified for our public directory — not a Same Day Recycling pickup partner.
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
            />
          </Suspense>
        ) : (
        <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-sm h-[400px] md:h-[520px] relative z-0">
          <MapContainer center={[58, -97]} zoom={4} minZoom={3} scrollWheelZoom={false} className="w-full h-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* live coverage zones from verified-partner status */}
            {coverageCities.map(({ name, city, state }) => (
              <Circle
                key={`cov-${name}`}
                center={[city.lat, city.lng]}
                radius={35000}
                pathOptions={{
                  color: state === "same_day" ? "#187B65" : "#c9971f",
                  fillColor: state === "same_day" ? "#187B65" : "#c9971f",
                  fillOpacity: 0.12,
                  weight: 1,
                  dashArray: state === "matching" ? "4 6" : undefined,
                }}
              />
            ))}
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
                      Verified provider — {[p.city, p.province].filter(Boolean).join(", ")}
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
                        {n} active job{n === 1 ? "" : "s"} in progress — live from the dispatch board
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
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
        )}

        {/* live report strip */}
        <div className="mt-5 rounded-2xl border border-slate-100 bg-white px-5 py-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#187B65] inline-block" />
            <ShieldCheck className="w-3.5 h-3.5 text-[#187B65]" /> {providers.length} verified providers
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#187B65]/40 inline-block" /> {coverage.verified.length} same-day cities · {coverage.matching.length} matching
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#54D9AE] inline-block" /> {traffic.active} active job{traffic.active === 1 ? "" : "s"} ({traffic.active24h} in the last 24h)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
            <Rocket className="w-3.5 h-3.5 text-slate-500" /> {openRegions.length} regions with researched listings awaiting confirmation
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#187B65]">
            <Radio className="w-3.5 h-3.5" />
            Live · {lastUpdated ? `updated ${formatDistanceToNow(lastUpdated, { addSuffix: true })}` : "just now"} · refreshes every minute
          </span>
        </div>
      </div>
    </section>
  );
}