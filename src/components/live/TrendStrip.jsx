// Compact monthly trend of verified demand records — the "Demand trends"
// indicator beside the radar. Pure inline SVG bars, synced to the same
// filters as the instrument. Honest empty state when history is thin.
export default function TrendStrip({ data, days = 30 }) {
  const trend = (data?.trend || []).slice(-6);
  const max = Math.max(1, ...trend.map((t) => t.count));
  const generatedAt = data?.generated_at
    ? new Date(data.generated_at).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : null;

  if (!trend.length || trend.every((t) => !t.count)) {
    return (
      <div className="rounded-xl bg-cine-bg/50 border border-cine-line/40 px-4 py-4 text-sm text-cine-muted">
        Trend history developing — monthly bars appear as verified records accumulate.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-2" role="img" aria-label="Verified demand records by month">
        {trend.map((t) => {
          const h = Math.max(3, Math.round((t.count / max) * 100));
          const [y, mo] = t.month.split("-");
          const label = new Date(Number(y), Number(mo) - 1, 1).toLocaleString("en-CA", { month: "short" });
          return (
            <div key={t.month} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <span className="text-xs font-bold tabular-nums text-cine-ink">{t.count}</span>
              <div
                className={`w-full rounded-t-md ${t.count ? "bg-cine-cyan/70" : "bg-cine-line/60"}`}
                style={{ height: `clamp(4px, ${h}%, 96px)` }}
                title={`${t.month}: ${t.count} record${t.count === 1 ? "" : "s"}`}
              />
              <span className="font-plex text-[9px] font-bold uppercase tracking-[0.14em] text-cine-muted">{label}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-cine-muted">
        Verified records per month, all evidence types kept separate{generatedAt ? ` · compiled ${generatedAt}` : ""} · {days}-day view above reflects this window's data.
      </p>
    </div>
  );
}