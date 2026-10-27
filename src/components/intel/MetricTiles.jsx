// The four small readings that sit above the map: what was observed, which
// evidence type dominates, how the window moved, and the current focus.
function Spark({ points = [] }) {
  if (points.length < 2) return null;
  const max = Math.max(...points, 1);
  const step = 100 / (points.length - 1);
  const path = points.map((v, i) => `${(i * step).toFixed(1)},${(30 - (v / max) * 26).toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="mt-1 h-6 w-full" aria-hidden="true">
      <polyline points={path} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Tile({ title, value, note, accent = false, children }) {
  return (
    <div className="rounded-2xl border border-lm-line bg-lm-surface p-3 shadow-[0_1px_2px_rgba(18,61,55,0.04)]">
      <div className="font-plex text-[9px] font-bold uppercase tracking-[0.16em] text-lm-muted">{title}</div>
      <div className={`mt-1 truncate font-heading text-lg font-bold ${accent ? "text-lm-teal" : "text-lm-ink"}`}>{value}</div>
      {note && <div className="truncate text-[10.5px] text-lm-muted">{note}</div>}
      {children}
    </div>
  );
}

export default function MetricTiles({ total, periodLabel, topType, change, trend, focusLabel, focusCount }) {
  const delta = change?.delta;
  return (
    <div className="grid grid-cols-2 gap-3">
      <Tile title="Demand observations" value={total ?? "—"} note={periodLabel} />
      <Tile title="Evidence mix" value={topType?.label || "—"} note={topType ? `${topType.count} records` : "No signals in this window"} accent />
      <Tile title="Demand change" value={delta == null ? "—" : `${delta >= 0 ? "+" : "−"}${Math.abs(delta)}`} note={change ? `${change.prev} → ${change.last}` : "Trend history developing"}>
        <span className={delta != null && delta < 0 ? "text-lm-amber" : "text-lm-teal"}>
          <Spark points={(trend || []).map((t) => t.count)} />
        </span>
      </Tile>
      <Tile title="Category focus" value={focusLabel || "All services"} note={focusCount != null ? `${focusCount} records` : "Eight service categories"} />
    </div>
  );
}