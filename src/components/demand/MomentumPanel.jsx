import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, CalendarDays, Database, Clock3, AlertTriangle } from "lucide-react";

const periodLabel = (p) => (p ? new Date(`${p}-01T00:00:00Z`).toLocaleDateString("en-CA", { month: "long", year: "numeric", timeZone: "UTC" }) : "—");

// Market Demand Momentum panel — measurement B of three. Changes in relative
// search interest, never a demand total. Rising / falling / stable are shown
// separately; the average MoM index change (e.g. -3.3 pts across the tracked
// queries) is retained as its own labelled directional metric. Zero and
// missing are always distinguished.
export default function MomentumPanel({ data }) {
  const trends = data?.trends || [];
  const national = trends.filter((t) => t.geo_type === "national" || !t.geo_type);
  const withChange = national.filter((t) => Number.isFinite(t.change_points));

  const derived = useMemo(() => {
    if (!withChange.length) return null;
    // Comparison period: the second-latest period across the queries' series,
    // which is exactly what the index change compares.
    const periods = [...new Set(withChange.flatMap((t) => (t.series || []).map((p) => p.period)))].sort();
    const latest = periods.at(-1) || null;
    const comparison = periods.at(-2) || null;
    const comparable = periods.length >= 2;
    const rising = withChange.filter((t) => t.change_points > 0).sort((a, b) => b.change_points - a.change_points);
    const falling = withChange.filter((t) => t.change_points < 0).sort((a, b) => a.change_points - b.change_points);
    const stable = withChange.filter((t) => t.change_points === 0);
    const avg = Math.round((withChange.reduce((n, t) => n + t.change_points, 0) / withChange.length) * 10) / 10;
    const updated = national.map((t) => t.updated).filter(Boolean).sort().at(-1) || null;
    return { comparable, latest, comparison, rising, falling, stable, avg, updated, tracked: national.length };
  }, [data]);

  if (!derived) {
    return (
      <div className="rounded-2xl border border-market-line bg-market-bg px-4 py-5 text-center">
        <p className="flex items-center justify-center gap-2 text-sm font-bold text-market-ink"><AlertTriangle className="h-4 w-4 text-amber-300" /> Insufficient data for a meaningful comparison.</p>
        <p className="mt-2 text-xs text-market-muted">No tracked query currently has two comparable months of source data. Momentum will appear once the next verified export arrives — missing data is never treated as zero.</p>
      </div>
    );
  }

  const fmtPts = (n) => `${n > 0 ? "+" : ""}${n} pts`;

  return (
    <div>
      {/* Retained momentum metric, correctly labelled: a directional signal */}
      <div className="flex items-baseline gap-2">
        <p className={`text-3xl font-extrabold ${derived.avg > 0 ? "text-[#54D9AE]" : derived.avg < 0 ? "text-amber-300" : "text-market-muted"}`}>
          {fmtPts(derived.avg)}
        </p>
        <span className="text-xs text-market-muted">avg MoM index change</span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-market-muted">
        A momentum signal across {derived.tracked} tracked queries — each compared within its own geography, window and normalization group. This is not a national market total and the tracked queries are not all Canadian searches.
      </p>

      <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold">
        <span className="text-[#54D9AE]"><TrendingUp className="mr-1 inline h-3.5 w-3.5" />{derived.rising.length} rising</span>
        <span className="text-amber-300"><TrendingDown className="mr-1 inline h-3.5 w-3.5" />{derived.falling.length} falling</span>
        <span className="text-market-muted"><Minus className="mr-1 inline h-3.5 w-3.5" />{derived.stable.length} stable</span>
      </div>

      {derived.comparable ? (
        <div className="mt-3 space-y-1.5">
          {derived.rising.slice(0, 5).map((t) => (
            <p key={t.keyword} className="flex items-center gap-2 text-xs text-market-ink"><TrendingUp className="h-3.5 w-3.5 shrink-0 text-[#54D9AE]" /><span className="font-bold">{t.keyword}</span><span className="text-[#54D9AE]">{fmtPts(t.change_points)}</span><span className="text-market-muted">· index {t.value}</span></p>
          ))}
          {derived.falling.slice(0, 5).map((t) => (
            <p key={t.keyword} className="flex items-center gap-2 text-xs text-market-ink"><TrendingDown className="h-3.5 w-3.5 shrink-0 text-amber-300" /><span className="font-bold">{t.keyword}</span><span className="text-amber-300">{fmtPts(t.change_points)}</span><span className="text-market-muted">· index {t.value}</span></p>
          ))}
          {derived.stable.length > 0 && (
            <p className="text-[11px] text-market-muted">Stable ({derived.stable.length}): {derived.stable.map((t) => t.keyword).join(", ")}</p>
          )}
        </div>
      ) : null}

      <div className="mt-4 space-y-1 text-[11px]">
        <p className="flex items-baseline gap-2"><CalendarDays className="h-3 w-3 shrink-0 text-market-accent" /><span className="font-bold text-market-muted">Reporting period:</span><span className="text-market-ink">{periodLabel(derived.latest)}</span></p>
        <p className="flex items-baseline gap-2"><CalendarDays className="h-3 w-3 shrink-0 text-market-accent" /><span className="font-bold text-market-muted">Comparison period:</span><span className="text-market-ink">{derived.comparison ? periodLabel(derived.comparison) : "no comparable prior month"}</span></p>
        <p className="flex items-baseline gap-2"><Database className="h-3 w-3 shrink-0 text-market-accent" /><span className="font-bold text-market-muted">Data source:</span><span className="text-market-ink">Verified Google Trends exports (index 0-100, per-query comparison windows)</span></p>
        <p className="flex items-baseline gap-2"><Clock3 className="h-3 w-3 shrink-0 text-market-accent" /><span className="font-bold text-market-muted">Data freshness:</span><span className="text-market-ink">{derived.updated ? new Date(derived.updated).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : "—"}</span></p>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-market-muted">
        A zero or low index reflects the source's sampled, window-normalized interest — never proof of zero searches. Gaps in a query's series are missing data, and missing data is never treated as a measured zero.
      </p>
    </div>
  );
}