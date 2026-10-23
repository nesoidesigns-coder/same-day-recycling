import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import { cityMeta } from "@/lib/cities";
import { Map, Loader2, ShieldCheck, UserSearch, Hourglass, MousePointerClick } from "lucide-react";

// Live national coverage map driven by the same verified-partner status feed as
// the rest of the Coverage page. Nothing is derived from the directory research
// database (recycling facilities), and requests remain open nationwide
// regardless of marker colour. Interactive: filter by territory state, click a
// marker or city chip to fly to it, and review honest status details per city.

const STATE_STYLE = {
  same_day: {
    dot: "bg-[#187B65]",
    label: "Provider Available",
    short: "Provider Available",
    hint: "Verified provider serves this city; job acceptance still required",
    chip: "border-[#187B65]/40 bg-[#187B65]/10 text-[#102B2A]",
    fill: "#187B65",
    text: "#187B65",
    radius: 9,
    pulse: true,
  },
  matching: {
    dot: "bg-gold",
    label: "Requests Open — Contractor Matching",
    short: "Contractor Matching",
    hint: "Open request in this city; a local contractor is being matched",
    chip: "border-gold/50 bg-gold/10 text-[#102B2A]",
    fill: "#c9971f",
    text: "#9a7414",
    radius: 8,
    pulse: false,
  },
  recruiting: {
    dot: "bg-slate-300",
    label: "Provider Recruitment",
    short: "Recruiting",
    hint: "Requests accepted — recruiting a local provider",
    chip: "border-slate-200 bg-slate-50 text-slate-600",
    fill: "#94a3b8",
    text: "#64748b",
    radius: 6,
    pulse: false,
  },
};

const STATE_KEYS = ["same_day", "matching", "recruiting"];

// Flies the map to a selected city when the user picks it from the list or legend.
function FlyToCity({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target?.lat != null) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 6), { duration: 0.8 });
  }, [target, map]);
  return null;
}

export default function CoverageMap() {
  const { statusFor, loaded, error, contractorCounts, locations } = useCoverageStatus();
  const [visible, setVisible] = useState(() => new Set(STATE_KEYS));
  const [selected, setSelected] = useState(null);

  const cities = useMemo(() => (
    locations
      .map((city) => {
        const meta = cityMeta(city.name);
        return {
          ...city,
          lat: city.lat ?? meta?.lat,
          lng: city.lng ?? meta?.lng,
          state: statusFor(city.name),
          count: contractorCounts[city.name] || 0,
        };
      })
      .filter((city) => city.state && city.lat != null && city.lng != null)
  ), [locations, statusFor, contractorCounts]);

  const counts = useMemo(() => ({
    same_day: cities.filter((c) => c.state === "same_day").length,
    matching: cities.filter((c) => c.state === "matching").length,
    recruiting: cities.filter((c) => c.state === "recruiting").length,
  }), [cities]);

  const visibleCities = cities.filter((c) => visible.has(c.state));

  const toggleState = (key) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        // Never allow hiding every state at once — keep at least one visible.
        if (next.size === 1) return next;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 text-[#102B2A]">
        <Map className="w-5 h-5 text-[#187B65]" />
        <h2 className="text-2xl md:text-3xl font-bold">Live contractor availability across Canada</h2>
      </div>
      <p className="text-slate-600 max-w-2xl mb-6">
        Every plotted city accepts service requests. Green cities have an active, verified provider — not a confirmed same-day
        appointment. Gold cities have an open request being matched. Grey cities accept requests while a local provider is
        recruited. Filter by territory state or tap any marker for details.
      </p>

      {/* Interactive state filters — doubles as the legend */}
      <div className="flex flex-wrap items-center gap-2 mb-4" role="group" aria-label="Filter territories by status">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 mr-1">Filter</span>
        {STATE_KEYS.map((key) => {
          const s = STATE_STYLE[key];
          const on = visible.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleState(key)}
              aria-pressed={on}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold transition-all ${
                on ? s.chip : "border-slate-100 bg-white text-slate-300 line-through decoration-slate-300"
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${s.dot} ${key === "same_day" && on ? "animate-pulse" : ""} inline-block`} />
              {s.short} <span className="text-slate-400">({loaded ? counts[key] : "—"})</span>
            </button>
          );
        })}
      </div>

      {error ? (
        <p role="status" className="rounded-3xl border border-border bg-background p-6 text-muted-foreground">Live map status is unavailable. Submit a request or call to check coverage; availability is not assumed.</p>
      ) : !loaded ? (
        <div className="flex items-center justify-center rounded-3xl border border-slate-100 bg-white shadow-sm h-[320px] md:h-[480px] text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading live network status…
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_290px] gap-4">
          <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-sm h-[360px] md:h-[480px] relative z-0">
            <MapContainer center={[56, -98]} zoom={4} minZoom={3} scrollWheelZoom={false} className="w-full h-full">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FlyToCity target={selected} />
              {visibleCities.map((c) => {
                const s = STATE_STYLE[c.state];
                const isSelected = selected?.name === c.name;
                return (
                  <CircleMarker
                    key={`${c.name}-${c.state}`}
                    center={[c.lat, c.lng]}
                    radius={c.state === "same_day" ? s.radius + Math.min(c.count - 1, 3) : s.radius}
                    pathOptions={{
                      color: isSelected ? "#0a3020" : "#102B2A",
                      weight: isSelected ? 3.5 : 2,
                      fillColor: s.fill,
                      fillOpacity: 0.95,
                    }}
                    eventHandlers={{ click: () => setSelected(c) }}
                  >
                    <Popup>
                      <div style={{ minWidth: 190 }}>
                        <strong style={{ color: "#102B2A" }}>{c.name}{c.province ? `, ${c.province}` : ""}</strong>
                        <div style={{ fontSize: 12, fontWeight: 700, color: s.text, marginTop: 4 }}>{s.label}</div>
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

          {/* Selected-city detail panel, synced with the map */}
          <div className="rounded-3xl border border-slate-100 bg-white shadow-sm p-5 flex flex-col">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 mb-3">
              <MousePointerClick className="w-3.5 h-3.5 text-[#187B65]" /> Territory details
            </div>
            {selected ? (
              (() => {
                const s = STATE_STYLE[selected.state];
                return (
                  <div className="flex-1 flex flex-col">
                    <div className="text-xl font-bold text-[#102B2A] leading-tight">
                      {selected.name}{selected.province ? `, ${selected.province}` : ""}
                    </div>
                    <div className={`mt-3 inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-xs font-bold ${s.chip}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} /> {s.label}
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{s.hint}</p>
                    {selected.state === "same_day" && (
                      <p className="mt-2 text-xs font-semibold text-slate-500">{selected.count} verified contractor{selected.count === 1 ? "" : "s"} listed</p>
                    )}
                    <p className="mt-2 text-xs text-slate-500">Requests remain open in every Canadian city regardless of status.</p>
                    <a
                      href={`/request-service?city=${encodeURIComponent(selected.name)}`}
                      className="mt-4 rounded-full bg-[#187B65] text-white text-center text-sm font-bold px-4 py-2.5 hover:bg-[#125C4E] transition-colors"
                    >
                      Request service in {selected.name}
                    </a>
                  </div>
                );
              })()
            ) : (
              <div className="flex-1 flex flex-col">
                <p className="text-sm text-slate-500">
                  Tap a marker on the map — or a city below — to see its live territory status, provider count and request options.
                </p>
              </div>
            )}

            {/* Filtered city list, synced with the active filters */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 mb-2">
                {visibleCities.length} territor{visibleCities.length === 1 ? "y" : "ies"} shown
              </div>
              <div className="max-h-44 overflow-y-auto flex flex-wrap gap-1.5 pr-1">
                {visibleCities.map((c) => {
                  const s = STATE_STYLE[c.state];
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelected(c)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors hover:border-[#187B65] ${s.chip}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${s.dot}`} /> {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Static legend for the full data set (independent of filters) */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
        {STATE_KEYS.map((key) => {
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