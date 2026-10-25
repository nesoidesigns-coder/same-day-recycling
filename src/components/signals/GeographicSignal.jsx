// Geographic transition between national, provincial and city-level
// findings. A single animated pill selector keeps the active scope obvious;
// when the active scope changes the location label crossfades once (200ms).
import { useState } from "react";

const SCOPES = [
  { key: "national", label: "National" },
  { key: "province", label: "Province" },
  { key: "city", label: "City" },
];

export default function GeographicSignal({ scope, onScope, provinces = [], province, onProvince, cities = [], city, onCity, summary, className = "" }) {
  const [fadeKey, setFadeKey] = useState(0);
  const change = (s) => {
    if (s === scope) return;
    setFadeKey((k) => k + 1);
    onScope(s);
  };

  return (
    <div className={className}>
      <div className="inline-flex rounded-full bg-ri-ivory border border-si-line p-1" role="tablist" aria-label="Geographic scope">
        {SCOPES.map((s) => {
          const active = scope === s.key;
          const disabled = s.key !== "national" && ((s.key === "province" && !provinces.length) || (s.key === "city" && !cities.length));
          return (
            <button
              key={s.key}
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => change(s.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                active ? "bg-ri-forest text-white shadow-sm" : "text-ri-slate hover:text-ri-charcoal"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {scope === "province" && provinces.length > 0 && (
        <select
          value={province}
          onChange={(e) => { setFadeKey((k) => k + 1); onProvince(e.target.value); }}
          aria-label="Province"
          className="ml-2 rounded-lg border border-si-line bg-white px-2 py-1.5 text-xs font-semibold text-ri-charcoal"
        >
          {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      )}
      {scope === "city" && cities.length > 0 && (
        <select
          value={city}
          onChange={(e) => { setFadeKey((k) => k + 1); onCity(e.target.value); }}
          aria-label="City"
          className="ml-2 rounded-lg border border-si-line bg-white px-2 py-1.5 text-xs font-semibold text-ri-charcoal"
        >
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      )}

      {summary && (
        <p key={fadeKey} className="geo-signal-fade mt-2 font-plex text-xs text-ri-slate">{summary}</p>
      )}
    </div>
  );
}