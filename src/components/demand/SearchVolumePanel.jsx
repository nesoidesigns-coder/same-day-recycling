import { CalendarDays, Database, Scale, Globe2 } from "lucide-react";

// Search DEMAND panel — one of the three separated measurements. Shows an
// estimated monthly Canadian search volume ONLY when a credible, comparable
// source provides one. Google Trends index values are never converted into
// search counts. Missing data is displayed honestly as "unavailable".
export default function SearchVolumePanel({ data }) {
  const overview = data?.overview || {};
  const available = Boolean(overview.available && Number.isFinite(overview.value));
  const sources = overview.sources || [];
  const fmt = (n) => Number(n).toLocaleString("en-CA");

  return (
    <div>
      {available ? (
        <>
          <p className="text-4xl font-extrabold text-market-ink">{fmt(overview.value)}</p>
          <p className="mt-1 text-xs text-market-muted">estimated Canadian searches / month</p>
          <div className="mt-4 space-y-1.5 text-[11px]">
            <p className="flex items-baseline gap-2"><Globe2 className="h-3 w-3 shrink-0 text-market-accent" /><span className="font-bold text-market-muted">Geographic scope:</span><span className="text-market-ink">Canada (national aggregate)</span></p>
            <p className="flex items-baseline gap-2"><Database className="h-3 w-3 shrink-0 text-market-accent" /><span className="font-bold text-market-muted">Source:</span><span className="text-market-ink">{sources.join(", ") || "No verified source on file"}</span></p>
            <p className="flex items-baseline gap-2"><CalendarDays className="h-3 w-3 shrink-0 text-market-accent" /><span className="font-bold text-market-muted">Reporting period:</span><span className="text-market-ink">{overview.period || "—"}</span></p>
            <p className="flex items-baseline gap-2"><Scale className="h-3 w-3 shrink-0 text-market-accent" /><span className="font-bold text-market-muted">Coverage &amp; uncertainty:</span><span className="text-market-ink">{data.coverage_note || "Provider estimates cover the tracked keyword set only; deduplicated to one provider per keyword."}</span></p>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-market-line bg-market-bg px-4 py-5 text-center">
          <p className="text-lg font-extrabold text-market-ink">Search volume unavailable.</p>
          <p className="mt-2 text-xs leading-relaxed text-market-muted">
            No credible, comparable Canadian search-volume dataset covers this period yet. The relative-interest signal is shown in the momentum panel — index values are never converted into search counts, and no volume is estimated to fill this gap.
          </p>
          <p className="mt-2 text-xs text-market-muted">Volume appears here automatically once a verified keyword-volume dataset is imported.</p>
        </div>
      )}
    </div>
  );
}