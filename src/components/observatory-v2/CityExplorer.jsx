import { STATUS } from "@/components/observatory-v2/observatoryData";

const ORDER = ["same_day", "matching", "recruiting", "currently_unavailable"];

// City explorer: every monitored location with its verified status. Selection
// drives the map and the local intelligence panel — cards stay quiet.
export default function CityExplorer({ locations, selected, onCity, counts }) {
  return (
    <div className="obs-panel p-5 md:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold tracking-tight text-obs-ink">Monitored locations</h3>
        <span className="font-plex text-[10px] tracking-wide text-obs-muted">{locations.length} CITIES · STATUS FROM VERIFIED PARTNER RECORDS</span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {ORDER.map((key) => (
          <span key={key} className={`rounded-full border px-3 py-1 text-[11px] font-bold ${key === "same_day" ? "border-obs-mint/40 text-obs-mint" : key === "matching" ? "border-obs-amber/50 text-obs-amber" : "border-obs-line text-obs-muted"}`}>
            {STATUS[key][0]} · {counts[key]}
          </span>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {locations.map((c) => (
          <button key={c.name} onClick={() => onCity(c.name)} aria-pressed={selected === c.name}
            className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${selected === c.name ? "border-obs-mint bg-obs-mint/10" : "border-obs-line/60 bg-obs-surface hover:border-obs-mint/50"}`}>
            <span className="block truncate text-sm font-semibold text-obs-ink">{c.name}</span>
            <span className="mt-0.5 block text-[10px] uppercase tracking-wider text-obs-muted">
              {c.state === "same_day" ? "Verified" : c.state === "matching" ? "Matching" : c.state === "recruiting" ? "Recruiting" : "Open requests"}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs text-obs-muted">Requests remain open in every Canadian city regardless of status — a marker colour never limits where you can ask for service.</p>
    </div>
  );
}