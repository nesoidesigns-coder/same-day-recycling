// The centre instrument of the dashboard: one thin segmented ring, the verified
// reading at its centre, and the basis directly beneath. Segments are the
// verified category distribution of the selected window — nothing estimated.
const SEG = ["#00A699", "#35C99A", "#2BBFB0", "#0E8C82", "#7CD9C4"];

export default function DemandDonut({ total, rows = [], loading, selected, onSelect, periodLabel, updatedAt }) {
  const items = rows.filter((r) => r.count > 0);
  const sum = items.reduce((s, r) => s + r.count, 0) || 1;
  const R = 152;
  const C = 190;
  let acc = 0;

  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      <svg viewBox="0 0 380 380" className="block w-full" role="img" aria-label={`${total ?? 0} observed demand records`}>
        <circle cx={C} cy={C} r={R} fill="none" stroke="#E3EDEA" strokeWidth="16" />
        {loading
          ? null
          : items.map((r, i) => {
              const frac = r.count / sum;
              const len = frac * 100;
              const offset = -acc * 100;
              acc += frac;
              const dim = selected && selected !== r.key;
              return (
                <circle
                  key={r.key}
                  cx={C}
                  cy={C}
                  r={R}
                  fill="none"
                  stroke={SEG[i % SEG.length]}
                  strokeWidth={selected === r.key ? 20 : 16}
                  strokeLinecap="butt"
                  pathLength="100"
                  strokeDasharray={`${Math.max(0.6, len - 0.8)} 100`}
                  strokeDashoffset={offset}
                  opacity={dim ? 0.25 : 1}
                  transform={`rotate(-90 ${C} ${C})`}
                  style={{ cursor: onSelect ? "pointer" : "default", transition: "opacity 200ms ease" }}
                  onClick={() => onSelect && onSelect(r.key)}
                >
                  <title>{`${r.label || r.key}: ${r.count} observed records`}</title>
                </circle>
              );
            })}
        <circle cx={C} cy={C} r={R - 26} fill="none" stroke="#EEF5F3" strokeWidth="1" />
      </svg>

      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div className="px-12">
          <div className="font-heading text-[56px] font-extrabold leading-none tracking-tight text-lm-ink tabular-nums">
            {loading ? "…" : total ?? 0}
          </div>
          <div className="mt-3 font-plex text-[9.5px] font-bold uppercase tracking-[0.18em] text-lm-muted">Canadian service demand</div>
          <div className="mt-1 font-plex text-[9.5px] font-bold uppercase tracking-[0.18em] text-lm-teal">Observed records</div>
          <div className="mt-2 text-[11px] text-lm-muted">{periodLabel}</div>
          {updatedAt && <div className="mt-1 text-[10px] text-lm-muted/80">Updated {updatedAt}</div>}
        </div>
      </div>
    </div>
  );
}