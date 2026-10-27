// Right reading column: the four headline readings for the window, each with
// its basis and a micro history drawn from real monthly counts.
function Tile({ title, value, suffix, note, bars, tone }) {
  return (
    <div className="console-panel p-3">
      <div className="console-label">{title}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className="font-heading text-[19px] font-extrabold leading-none tabular-nums"
          style={{ color: tone || "hsl(var(--cn-ink))" }}
        >
          {value ?? "—"}
        </span>
        {suffix && <span className="text-[10.5px] font-semibold text-cn-muted">{suffix}</span>}
      </div>
      <div className="mt-2 flex h-5 items-end gap-[3px]">
        {bars?.map((b, i) => (
          <span
            key={i}
            className="flex-1 rounded-sm"
            style={{ height: `${Math.max(10, b)}%`, background: tone ? `${tone}` : "hsl(var(--cn-teal) / 0.7)" }}
          />
        ))}
      </div>
      <div className="mt-1.5 text-[10.5px] leading-snug text-cn-muted">{note}</div>
    </div>
  );
}

export default function InsightColumn({ total, topType, change, trend = [], selectedRow, periodLabel }) {
  const counts = trend.map((t) => t.count);
  const max = Math.max(1, ...counts);
  const bars = counts.length ? counts.map((c) => (c / max) * 100) : [];
  const delta = change ? change.delta : null;
  const focusLabel = selectedRow?.label;
  const focusBars = selectedRow ? bars : [];

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Tile
        title="Demand observations"
        value={total}
        note={periodLabel}
        bars={bars}
      />
      <Tile
        title="Search interest"
        value={topType?.count}
        suffix={topType ? "largest type" : ""}
        note={topType ? topType.label : "No typed records yet"}
        bars={bars}
      />
      <Tile
        title="Demand change"
        value={delta == null ? "—" : `${delta > 0 ? "+" : ""}${delta}`}
        suffix={delta == null ? "" : "MoM"}
        note={delta == null ? "Trend history developing" : `${change.prev} → ${change.last}`}
        bars={bars}
        tone={delta == null ? null : delta >= 0 ? "hsl(var(--cn-cyan))" : "hsl(var(--cn-orange))"}
      />
      <Tile
        title="Category focus"
        value={focusLabel ? selectedRow.count : "—"}
        suffix={focusLabel ? "records" : ""}
        note={focusLabel || "All eight service categories"}
        bars={focusBars}
      />
    </div>
  );
}