import { useMemo, useState } from "react";
import { MapContainer, CircleMarker, Circle, TileLayer, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { CITIES } from "@/lib/cities";

const norm = (s) => String(s || "").trim().toLowerCase();
const CITY_BY_NAME = new Map(CITIES.map((c) => [norm(c.name), c]));
const PROVINCE_COORDS = {
  BC: [54.5, -125], AB: [53.5, -113.5], SK: [52.7, -106], MB: [50.2, -97], ON: [50, -85], QC: [52, -72],
  NB: [46.5, -66.5], NS: [44.8, -63.5], PE: [46.4, -63.2], NL: [49.5, -56], NT: [64, -116], YT: [62, -136], NU: [68, -100],
};

const TYPE_LABEL = {
  observed_public_request: "Public request", search_interest: "Search interest", platform_inquiry: "Platform inquiry",
  qualified_opportunity: "Qualified opportunity", confirmed_booking: "Confirmed booking", market_indicator: "Market indicator",
};

// Six intelligence layers over the live demand map. Each layer has a distinct
// accessible colour and states its measurement basis — nothing is fabricated.
const LAYERS = [
  { key: "A", name: "Search Demand", color: "#f59e0b", basis: "Relative/aggregate search interest — indices, not absolute counts", pick: (s) => s.demand_type === "search_interest" },
  { key: "B", name: "Public Requests", color: "#0ea5e9", basis: "Source-backed public posts, shown at municipality level only", pick: (s) => s.demand_type === "observed_public_request" },
  { key: "C", name: "Service Categories", color: "#a78bfa", basis: "Signals grouped by market category (select below)", pick: null },
  { key: "D", name: "Contractor Coverage", color: "#10b981", basis: "Verified contractor territories from Partner records", pick: null },
  { key: "E", name: "Commercial Opportunities", color: "#f43f5e", basis: "Scored, review-eligible requests awaiting owner decision", pick: (s) => ["observed_public_request", "platform_inquiry"].includes(s.demand_type) && s.review_status !== "dismissed" },
  { key: "F", name: "Network Performance", color: "#f97316", basis: "Confirmed bookings and completed jobs recorded on-platform", pick: (s) => s.demand_type === "confirmed_booking" },
];

export default function SignalMapTab({ feed }) {
  const [layerKey, setLayerKey] = useState("B");
  const [market, setMarket] = useState("furniture_appliance_removal");
  const [selected, setSelected] = useState(null);
  const layer = LAYERS.find((l) => l.key === layerKey) || LAYERS[1];
  const signals = feed.signals || [];

  const cityPoints = useMemo(() => {
    const filtered = layer.key === "C" ? signals.filter((s) => (s.market_categories || []).includes(market)) : signals.filter((s) => layer.pick && layer.pick(s));
    const map = new Map();
    for (const s of filtered) {
      if (!s.city) continue;
      const key = norm(s.city);
      const row = map.get(key) || { city: s.city, province: s.province_code || "", count: 0, score: 0, signals: [] };
      row.count++; row.score = Math.max(row.score, s.confidence_score || 0); row.signals.push(s);
      map.set(key, row);
    }
    return [...map.values()];
  }, [signals, layer, market]);

  const selectedSignals = selected
    ? signals.filter((s) => norm(s.city) === norm(selected.city)).slice(0, 8)
    : [];

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Intelligence layer">
        {LAYERS.map((l) => (
          <button key={l.key} onClick={() => setLayerKey(l.key)} aria-pressed={layerKey === l.key}
            className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs font-bold transition-colors ${layerKey === l.key ? "border-transparent text-white" : "border-slate-200 text-slate-600 hover:border-[#187B65]"}`}
            style={layerKey === l.key ? { background: l.color } : {}}>
            <span className={`h-2 w-2 rounded-full ${layerKey === l.key ? "bg-white/80" : ""}`} style={layerKey === l.key ? {} : { background: l.color }} />
            {l.key} · {l.name}
          </button>
        ))}
      </div>
      {layer.key === "C" && (
        <select value={market} onChange={(e) => setMarket(e.target.value)} className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm md:w-72">
          {Object.entries(feed.counts.by_market).length === 0
            ? <option value={market}>No categorized signals yet</option>
            : [...Object.keys(feed.counts.by_market), ...(Object.keys(feed.counts.by_market).includes(market) ? [] : [market])].map((m) => (
                <option key={m} value={m}>{m.replace(/_/g, " ")} · {feed.counts.by_market[m] || 0}</option>
              ))}
        </select>
      )}
      <p className="mb-3 rounded-xl bg-[#f6f9f8] border border-slate-100 p-3 text-xs text-slate-600"><strong className="text-[#102B2A]">Measurement basis:</strong> {layer.basis}.</p>

      <div className="h-80 overflow-hidden rounded-2xl border border-slate-100 md:h-96">
        <MapContainer center={[52, -100]} zoom={3} minZoom={3} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' />
          {layer.key === "D"
            ? (feed.coverage_cities || []).map((c) => {
                const loc = CITY_BY_NAME.get(norm(c));
                return loc ? <Circle key={c} center={[loc.lat, loc.lng]} radius={60000} pathOptions={{ color: layer.color, fillColor: layer.color, fillOpacity: 0.18, weight: 1 }}><Popup><strong>{c}</strong><br />Verified contractor territory (from Partner records).</Popup></Circle> : null;
              })
            : cityPoints.map((r) => {
                const cityLoc = CITY_BY_NAME.get(norm(r.city));
                const center = cityLoc ? [cityLoc.lat, cityLoc.lng] : PROVINCE_COORDS[r.province];
                if (!center) return null;
                return (
                  <CircleMarker key={`${r.city}${r.province}`} center={center} radius={Math.min(6 + r.count * 1.5, 22)}
                    pathOptions={{ color: layer.color, fillColor: layer.color, fillOpacity: 0.55, weight: 1 }}
                    eventHandlers={{ click: () => setSelected(r) }}>
                    <Popup><strong>{r.city}{r.province ? `, ${r.province}` : ""}</strong><br />{r.count} {layer.name.toLowerCase()} signal(s) · max score {r.score}</Popup>
                  </CircleMarker>
                );
              })}
        </MapContainer>
      </div>

      {selected && (
        <div className="mt-4 rounded-2xl border border-slate-100 bg-[#f6f9f8] p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#102B2A]">{selected.city}{selected.province ? `, ${selected.province}` : ""} — {layer.name}</h3>
            <button onClick={() => setSelected(null)} className="text-xs font-bold text-slate-500 underline">Close</button>
          </div>
          <div className="mt-2 space-y-2">
            {selectedSignals.map((s) => (
              <div key={s.id} className="rounded-xl bg-white p-3 text-sm">
                <p className="font-bold text-[#102B2A]">{s.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">{TYPE_LABEL[s.demand_type]} · {TYPE_LABEL_U(s)} · score {s.confidence_score} · {s.city ? "" : "location unresolved"}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">published {fmtD(s.source_published_at)} · collected {fmtD(s.collected_at)} · via {s.source_platform}{s.source_url && <> · <a href={s.source_url} target="_blank" rel="noreferrer" className="text-[#187B65] underline">source</a></>}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {!selected && <p className="mt-3 text-xs text-slate-400">Tap a marker to see the underlying signals, their sources and timestamps. Public posters' exact locations are never shown.</p>}
    </div>
  );
}

const TYPE_LABEL_U = (s) => `${s.urgency === "immediate" ? "urgent" : s.urgency === "soon" ? "soon" : "flexible"} timing`;
const fmtD = (v) => (v && new Date(v).getTime() ? new Date(v).toLocaleDateString("en-CA", { month: "short", day: "numeric" }) : "unavailable");