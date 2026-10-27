import { LIVE_CATEGORY_SHORT } from "@/lib/liveCategories";

const COLORS = ["#00BFA5", "#00D4D4", "#35C99A", "#FF9800", "#2E9E76", "#59BCA8", "#7ED9C7", "#00A699"];

// The hub: one ring of verified observations by service market, with the
// window's total at its centre. Sizes are shares of real records only.
export default function DemandRadar({ rows = [], total = 0, loading, selected, onSelect, periodLabel, updatedAt }) {
  const live = rows.filter((r) => r.count > 0);
  const R = 74;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const segments = live.map((row, i) => {
    const share = total ? row.count / total : 0;
    const seg = {
      key: row.key,
      color: COLORS[rows.findIndex((r) => r.key === row.key) % COLORS.length],
      dash: `${(share * C).toFixed(2)} ${C.toFixed(2)}`,
      offset: -acc * C,
      share,
      label: LIVE_CATEGORY_SHORT[row.key] || row.key,
      count: row.count,
      dim: selected ? row.key !== selected : false,
    };
    acc += share;
    return seg;
  });

  return (
    <section className="console-panel flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="console-label">Canadian service demand</div>
          <div className="mt-1 text-[11px] text-cn-muted">Updated {updatedAt || "—"}</div>
        </div>
        <span className="rounded-full border border-cn-teal/40 bg-[hsl(var(--cn-teal)/0.12)] px-2 py-0.5 font-plex text-[9px] font-bold uppercase tracking-wider text-cn-teal">
          Live
        </span>
      </div>

      <div className="relative mx-auto mt-3 w-full max-w-[248px]">
        <svg viewBox="0 0 200 200" className="w-full" role="img" aria-label="Observed demand by service category">
          <circle cx="100" cy="100" r={R} fill="none" stroke="hsl(var(--cn-line) / 0.6)" strokeWidth="16" />
          <g transform="rotate(-90 100 100)">
            {segments.map((s) => (
              <circle
                key={s.key}
                cx="100"
                cy="100"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={selected === s.key ? 20 : 16}
                strokeDasharray={s.dash}
                strokeDashoffset={s.offset}
                strokeLinecap="butt"
                opacity={s.dim ? 0.28 : 1}
                className="cursor-pointer transition-opacity"
                onMouseEnter={() => onSelect?.(s.key)}
                onClick={() => onSelect?.(s.key)}
              />
            ))}
          </g>
          {loading && (
            <circle cx="100" cy="100" r="58" fill="none" stroke="hsl(var(--cn-teal) / .5)" strokeWidth="2" strokeDasharray="10 14">
              <animateTransform attributeName="transform" type="rotate" from="0 100 100" to="360 100 100" dur="2.4s" repeatCount="indefinite" />
            </circle>
          )}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="font-heading text-[40px] font-extrabold leading-none text-cn-ink tabular-nums">
              {loading ? "—" : total}
            </div>
            <div className="console-label mt-1">Observed records</div>
            <div className="mt-1 text-[10px] text-cn-muted">{periodLabel}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {segments.map((s) => (
          <button
            key={s.key}
            onClick={() => onSelect?.(s.key)}
            className={`flex items-center gap-1.5 rounded px-1 py-0.5 text-left transition-colors ${
              selected === s.key ? "bg-white/5" : "hover:bg-white/5"
            }`}
          >
            <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="min-w-0 flex-1 truncate text-[11px] text-cn-muted">{s.label}</span>
            <span className="font-plex text-[10.5px] font-bold text-cn-ink tabular-nums">{s.count}</span>
          </button>
        ))}
        {!segments.length && !loading && (
          <p className="col-span-2 py-2 text-center text-[11px] text-cn-muted">No observed records in this window yet.</p>
        )}
      </div>
    </section>
  );
}