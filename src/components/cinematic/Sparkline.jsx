import { CineSectionLabel } from "./CinePrimitives";

// Supporting sparkline — observed records per month for the current filters.
// Counts only, honest gap when there is not enough history.
export default function Sparkline({ trend = [], label = "National service demand trend" }) {
  const complete = trend.filter((t) => t.month);
  if (complete.length < 2) {
    return (
      <div className="rounded-2xl border border-cine-line/60 bg-cine-surface/60 p-5">
        <CineSectionLabel>{label}</CineSectionLabel>
        <p className="mt-2 text-sm text-cine-muted">Not enough history to show a trend yet. Observations accumulate over time — nothing here is estimated.</p>
      </div>
    );
  }
  const W = 520, H = 96, PAD = 6;
  const max = Math.max(1, ...complete.map((t) => t.count));
  const step = (W - PAD * 2) / (complete.length - 1);
  const pts = complete.map((t, i) => [PAD + i * step, H - PAD - (t.count / max) * (H - PAD * 2 - 8)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H - PAD} L${pts[0][0].toFixed(1)},${H - PAD} Z`;
  const last = complete[complete.length - 1];
  const prev = complete[complete.length - 2];
  const delta = last.count - prev.count;
  const pct = prev.count ? Math.round((delta / prev.count) * 100) : null;

  return (
    <div className="rounded-2xl border border-cine-line/60 bg-cine-surface/60 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <CineSectionLabel>{label}</CineSectionLabel>
        <span className="font-plex text-[11px] text-cine-muted">
          {prev.month} → {last.month}: {delta >= 0 ? "+" : ""}{delta} record{Math.abs(delta) === 1 ? "" : "s"}
          {pct !== null && ` (${pct >= 0 ? "+" : ""}${pct}%)`}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 block w-full" role="img" aria-label={`Observed records per month, ${complete.length} months`}>
        <defs>
          <linearGradient id="cine-spark" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#cine-spark)" />
        <path d={line} fill="none" stroke="#22D3EE" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill="#22D3EE" />
      </svg>
      <div className="mt-1 flex justify-between font-plex text-[10px] text-cine-muted">
        <span>{complete[0].month}</span>
        <span>{last.month}</span>
      </div>
      <p className="mt-2 font-plex text-[10px] leading-relaxed text-cine-muted">
        Monthly counts of verified demand records matching the current filters. Search interest appears only as its own labelled record type — never as request volume.
      </p>
    </div>
  );
}