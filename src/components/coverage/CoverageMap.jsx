import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Map, Loader2, ShieldCheck, UserSearch, Hourglass } from "lucide-react";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import { COVERAGE } from "@/lib/coverage";
import { REGIONS } from "@/lib/regions";

// Live national coverage map. Marker state comes from the coverage status
// engine (verified partner capacity / open matching requests), never from
// facility-directory counts. Coordinates come from the coverage registry
// and province fallbacks — nothing is hardcoded as active.
const FALLBACK_COORDS = {
  "North Vancouver": { lat: 49.3113, lng: -123.0696, province: "BC" },
};

const STATE_STYLE = {
  same_day: {
    dot: "bg-[#187B65]",
    label: "Same-Day Availability",
    hint: "Verified contractor active — window confirmed per job",
    icon: <ShieldCheck className="w-3.5 h-3.5 text-[#187B65]" />,
    fill: "#187B65",
    radius: 9,
  },
  matching: {
    dot: "bg-gold",
    label: "Requests open — contractor matching",
    hint: "Open request in this city; a local contractor is being matched",
    icon: <UserSearch className="w-3.5 h-3.5 text-gold-dark" />,
    fill: "#c9971f",
    radius: 8,
  },
  recruiting: {
    dot: "bg-slate-300",
    label: "Provider recruitment",
    hint: "Requests accepted — recruiting a local provider",
    icon: <Hourglass className="w-3.5 h-3.5 text-slate-400" />,
    fill: "#94a3b8",
    radius: 6,
  },
};

export default function CoverageMap() {
  const { statusFor, loaded, contractorCounts, verifiedCityNames, matchingCityNames } = useCoverageStatus();

  // Registry cities plus any verified/matching city outside the registry
  // (e.g. a verified partner in North Vancouver) so real capacity is never hidden.
  const registryNames = new Set(COVERAGE.map((c) => c.name.toLowerCase()));
  const extra = [...verifiedCityNames, ...matchingCityNames]
    .filter((n) => !registryNames.has(String(n).toLowerCase()) && FALLBACK_COORDS[n])
    .map((name) => ({ name, province: FALLBACK_COORDS[name].province }));

  const cities = [...COVERAGE, ...extra].map((c) => {
    const state = statusFor(c.name);
    const region = REGIONS.find((r) => r.code === c.province);
    const fallback = FALLBACK_COORDS[c.name];
    const lat = fallback?.lat ?? region?.lat;
    const lng = fallback?.lng ?? region?.lng;
    return {
      name: c.name,
      province: c.province,
      lat,
      lng,
      state,
      count: contractorCounts[c.name] || (verifiedCityNames.includes(c.name) ? 1 : 0),
    };
  }).filter((c) => c.state && c.lat != null && c.lng != null);

  const counts = {
    same_day: cities.filter((c) => c.state === "same_day").length,
    matching: cities.filter((c) => c.state === "matching").length,
    recruiting: cities.filter((c) => c.state === "recruiting").length,
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 text-[#102B2A]">
        <Map className="w-5 h-5 text-[#187B65]" />
        <h2 className="text-2xl md:text-3xl font-bold">Live contractor availability across Canada</h2>
      </div>
      <p className="text-slate-600 max-w-2xl mb-6">
        Green cities have a verified contractor active today. Gold cities have an open request
        being matched. Grey cities accept requests while a local provider is being recruited.
        Requests are accepted in every Canadian city, town and municipality regardless of marker colour.
      </p>

      {!loaded ? (
        <div className="flex items-center justify-center rounded-3xl border border-slate-100 bg-white shadow-sm h-[360px] md:h-[480px] text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading live network status…
        </div>
      ) : (
        <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-sm h-[360px] md:h-[480px] relative z-0">
          <MapContainer center={[56, -98]} zoom={4} minZoom={3} scrollWheelZoom={false} className="w-full h-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {cities.map((c) => {
              const s = STATE_STYLE[c.state];
              return (
                <CircleMarker
                  key={`${c.name}-${c.state}`}
                  center={[c.lat, c.lng]}
                  radius={c.state === "same_day" ? s.radius + Math.min(c.count - 1, 3) : s.radius}
                  pathOptions={{ color: "#102B2A", fillColor: s.fill, fillOpacity: 0.95, weight: 2 }}
                >
                  <Popup>
                    <div style={{ minWidth: 190 }}>
                      <strong style={{ color: "#102B2A" }}>
                        {c.name}, {c.province}
                      </strong>
                      <div style={{ fontSize: 12, fontWeight: 700, color: s.fill === "#94a3b8" ? "#475569" : s.fill, marginTop: 4 }}>
                        {s.label}
                      </div>
                      <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{s.hint}</div>
                      {c.state === "same_day" && (
                        <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
                          {c.count} verified contractor{c.count === 1 ? "" : "s"}
                        </div>
                      )}
                      <a
                        href={`/request-service?city=${encodeURIComponent(c.name)}`}
                        style={{ display: "inline-block", marginTop: 8, fontSize: 12, fontWeight: 700, color: "#187B65" }}
                      >
                        Request service in {c.name} →
                      </a>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
        {["same_day", "matching", "recruiting"].map((key) => {
          const s = STATE_STYLE[key];
          return (
            <span key={key} className="inline-flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-full ${s.dot} inline-block`} />
              {s.label} ({loaded ? counts[key] : "—"})
            </span>
          );
        })}
      </div>
    </div>
  );
}