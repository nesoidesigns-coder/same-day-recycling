import { SERVICES, SIGNAL_TYPES, periodTrend } from "@/components/observatory-v2/observatoryData";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const labelFor = (key) => SERVICES.find(([k]) => k === key)?.[1] || key;
const typeLabel = (key) => SIGNAL_TYPES.find(([k]) => k === key)?.[1] || key;
const ACTIONABLE = ["observed_public_request", "platform_inquiry", "confirmed_booking"];

// The eight-sector explorer: category rows from the live labelled feed, each
// bar normalised within the current sample. Selection filters the map layer.
export default function SectorPulse({ data, isLoading, error, category, onCategory, onCity }) {
  if (isLoading) return <p className="obs-panel p-8 text-center text-obs-muted" role="status">Loading sector intelligence…</p>;
  if (error || !data?.rows?.length) {
    return (
      <div className="obs-panel p-8 text-center">
        <p className="text-sm text-obs-muted">{data?.empty_note || "Insufficient observations for this selection."}</p>
      </div>
    );
  }
  const max = Math.max(...data.rows.map((r) => r.count));
  const trend = periodTrend(data);
  return (
    <div className="obs-panel p-5 md:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold tracking-tight text-obs-ink">Sector explorer</h3>
        <span className="font-plex text-[10px] tracking-wide text-obs-muted">
          {data.total} RECORDS · {Object.entries(data.filters || {}).filter(([, v]) => v && v !== "all").map(([k, v]) => `${k.replace("_days", "")}: ${v}`).join(" · ") || "ALL CANADA · 30 DAYS"}
        </span>
      </div>
      <div className="mt-4 space-y-2.5">
        {data.rows.map((row) => {
          const active = category === row.key;
          return (
            <button key={row.key} onClick={() => onCategory(active ? "" : row.key)} aria-pressed={active}
              className={`obs-sector-row ${active ? "obs-sector-row-active" : ""}`}>
              <span className="w-44 shrink-0 truncate text-left text-sm font-semibold text-obs-ink">{labelFor(row.key)}</span>
              <span className="min-w-0 flex-1">
                <span className="block h-2.5 rounded-sm bg-obs-mint/80" style={{ width: `${Math.max(6, (row.count / max) * 100)}%` }} />
              </span>
              <span className="w-10 shrink-0 text-right font-plex text-sm tabular-nums text-obs-ink">{row.count}</span>
              <span className="hidden w-64 shrink-0 flex-wrap justify-end gap-1 lg:flex">
                {Object.entries(row.demand_types).sort((a, b) => b[1] - a[1]).map(([type, n]) => (
                  <span key={type} className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${ACTIONABLE.includes(type) ? "border-obs-mint/40 text-obs-mint" : "border-obs-line text-obs-muted"}`}>
                    {typeLabel(type)} {n}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-obs-line/40 pt-4">
        {trend && (
          <span className="flex items-center gap-1.5 text-xs text-obs-muted">
            {trend.last.count > trend.prev.count ? <TrendingUp className="size-4 text-obs-mint" /> : trend.last.count < trend.prev.count ? <TrendingDown className="size-4 text-obs-amber" /> : <Minus className="size-4" />}
            {trend.prev.count} → {trend.last.count} records, {trend.prev.month} to {trend.last.month}
          </span>
        )}
        {data.cities?.length > 0 && (
          <span className="flex flex-wrap items-center gap-1.5 text-xs text-obs-muted">
            Cities with recorded activity:
            {data.cities.slice(0, 6).map((c) => (
              <button key={c.city} onClick={() => onCity?.(c.city)} className="rounded-full border border-obs-line/60 px-2 py-0.5 text-[11px] font-semibold text-obs-ink hover:border-obs-mint">{c.city} · {c.count}</button>
            ))}
          </span>
        )}
      </div>
      <p className="mt-3 font-plex text-[10px] leading-relaxed tracking-wide text-obs-muted/80">{data.basis_note}</p>
    </div>
  );
}