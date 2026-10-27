import { LIVE_CATEGORY_SHORT } from "@/lib/liveCategories";

const COLORS = ["#00B5AD", "#006F79", "#35C99A", "#FF9800", "#2E9E76", "#59BCA8", "#7ED9C7", "#00A699"];

// Demand by service category: one ring plus its legend. Shares are of the
// verified records in the window, so the total is always the same number.
export default function CategoryDonut({ rows = [], total = 0, loading }) {
  const R = 62;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const segments = rows
    .map((row, i) => ({ ...row, color: COLORS[i % COLORS.length] }))
    .filter((row) => row.count > 0)
    .map((row) => {
      const share = total ? row.count / total : 0;
      const seg = { ...row, share, dash: `${(share * C).toFixed(2)} ${C.toFixed(2)}`, offset: -acc * C };
      acc += share;
      return seg;
    });

  return (
    <div className="rounded-2xl border border-lm-line bg-white p-4">
      <h3 className="font-heading text-[13px] font-bold text-lm-ink">Demand by service category</h3>
      <p className="mt-0.5 text-[10.5px] text-lm-muted">Verified records only.</p>

      <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
        <div className="relative w-[152px] shrink-0">
          <svg viewBox="0 0 160 160" className="w-full" role="img" aria-label="Demand by service category">
            <circle cx="80" cy="80" r={R} fill="none" stroke="hsl(var(--ri-mint))" strokeWidth="15" />
            <g transform="rotate(-90 80 80)">
              {segments.map((s) => (
                <circle
                  key={s.key}
                  cx="80"
                  cy="80"
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="15"
                  strokeDasharray={s.dash}
                  strokeDashoffset={s.offset}
                />
              ))}
            </g>
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="font-heading text-[22px] font-extrabold leading-none text-lm-ink tabular-nums">{loading ? "—" : total}</div>
              <div className="font-plex text-[7.5px] font-bold uppercase tracking-[0.14em] text-lm-muted">Records</div>
            </div>
          </div>
        </div>

        <ul className="grid w-full grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-1">
          {segments.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-sm" style={{ background: s.color }} />
              <span className="min-w-0 flex-1 truncate text-[10.5px] text-lm-muted">{LIVE_CATEGORY_SHORT[s.key] || s.label}</span>
              <span className="font-plex text-[10px] font-bold text-lm-ink tabular-nums">{Math.round(s.share * 100)}%</span>
            </li>
          ))}
          {!segments.length && !loading && (
            <li className="col-span-2 text-[11px] text-lm-muted">No verified records in this window yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}