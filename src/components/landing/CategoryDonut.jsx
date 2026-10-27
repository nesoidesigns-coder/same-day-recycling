import { useId, useState } from "react";
import { LIVE_CATEGORY_SHORT } from "@/lib/liveCategories";

// Premium demand palette: turquoise → teal → emerald, with one warm amber
// accent for the highest-intent category. Adjacent hues stay distinguishable.
const COLORS = ["#24D3BE", "#078C7D", "#35C99A", "#FF9F1C", "#0B6F8A", "#59BCA8", "#2E9E76", "#E4B65B"];

// Demand by service category: one ring plus its legend. Shares are of the
// verified records in the window, so the total is always the same number.
export default function CategoryDonut({ rows = [], total = 0, loading }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [active, setActive] = useState(null);
  const R = 62;
  const C = 2 * Math.PI * R;
  const gap = segmentsGap(rows) ? 2.6 : 0;
  let acc = 0;
  const segments = rows
    .map((row, i) => ({ ...row, color: COLORS[i % COLORS.length] }))
    .filter((row) => row.count > 0)
    .map((row) => {
      const share = total ? row.count / total : 0;
      const span = share * C;
      const seg = {
        ...row,
        share,
        dash: `${Math.max(0, span - gap).toFixed(2)} ${C.toFixed(2)}`,
        offset: -acc * C,
      };
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
            <defs>
              <radialGradient id={`donut-halo-${uid}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#16C7BA" stopOpacity="0.2" />
                <stop offset="70%" stopColor="#16C7BA" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#16C7BA" stopOpacity="0" />
              </radialGradient>
              {segments.map((s, i) => (
                <linearGradient key={s.key} id={`donut-${uid}-${i}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={s.color} />
                  <stop offset="100%" stopColor={s.color} stopOpacity="0.68" />
                </linearGradient>
              ))}
              <filter id={`donut-glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle cx="80" cy="80" r="76" fill={`url(#donut-halo-${uid})`} className="gauge-halo" />

            <g className="donut-orbit" style={{ transformOrigin: "80px 80px" }}>
              <circle
                cx="80"
                cy="80"
                r={R + 13}
                fill="none"
                stroke="#0FB5A8"
                strokeOpacity="0.26"
                strokeWidth="1"
                strokeDasharray="2 7"
                strokeLinecap="round"
              />
            </g>

            <circle cx="80" cy="80" r={R} fill="none" stroke="hsl(var(--ri-mint))" strokeWidth="15" />
            <g transform="rotate(-90 80 80)">
              {segments.map((s, i) => {
                const dim = active != null && active !== s.key;
                return (
                  <circle
                    key={s.key}
                    cx="80"
                    cy="80"
                    r={R}
                    fill="none"
                    stroke={`url(#donut-${uid}-${i})`}
                    strokeWidth={active === s.key ? 19 : 15}
                    strokeDasharray={s.dash}
                    strokeDashoffset={s.offset}
                    strokeLinecap="butt"
                    opacity={dim ? 0.35 : 1}
                    filter={active === s.key ? `url(#donut-glow-${uid})` : undefined}
                    style={{ transition: "stroke-width 220ms ease, opacity 220ms ease" }}
                    onMouseEnter={() => setActive(s.key)}
                    onMouseLeave={() => setActive(null)}
                  />
                );
              })}
            </g>
          </svg>
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="font-heading text-[22px] font-extrabold leading-none text-lm-ink tabular-nums">{loading ? "—" : total}</div>
              <div className="font-plex text-[7.5px] font-bold uppercase tracking-[0.14em] text-lm-muted">Records</div>
            </div>
          </div>
        </div>

        <ul className="grid w-full grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-1">
          {segments.map((s, i) => {
            const dim = active != null && active !== s.key;
            return (
              <li
                key={s.key}
                className="flex items-center gap-1.5"
                style={{ opacity: dim ? 0.5 : 1, transition: "opacity 220ms ease" }}
                onMouseEnter={() => setActive(s.key)}
                onMouseLeave={() => setActive(null)}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-sm"
                  style={{ background: s.color, boxShadow: active === s.key ? `0 0 6px ${s.color}` : "none" }}
                />
                <span className="min-w-0 flex-1 truncate text-[10.5px] text-lm-muted">{LIVE_CATEGORY_SHORT[s.key] || s.label}</span>
                <span className="font-plex text-[10px] font-bold text-lm-ink tabular-nums">{Math.round(s.share * 100)}%</span>
              </li>
            );
          })}
          {!segments.length && !loading && (
            <li className="col-span-2 text-[11px] text-lm-muted">No verified records in this window yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

// A gap only helps readability when the ring is split across several arcs.
const segmentsGap = (rows = []) => rows.filter((r) => (r.count || 0) > 0).length > 1;