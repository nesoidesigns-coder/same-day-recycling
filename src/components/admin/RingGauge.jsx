export default function RingGauge({ value, max = 100, label, sub, unavailableReason }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const frac = value === null || value === undefined || unavailableReason ? null : Math.max(0, Math.min(1, Number(value) / max));

  return (
    <div className="rounded-[14px] bg-white border border-li-steel shadow-sm p-5 flex items-center gap-4">
      <div className="relative w-24 h-24 shrink-0">
        <svg viewBox="0 0 120 120" className="w-24 h-24 -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" strokeWidth="10" style={{ stroke: "hsl(var(--li-steel))" }} />
          {frac !== null && (
            <circle
              cx="60" cy="60" r={R} fill="none" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - frac)}
              style={{ stroke: "hsl(var(--li-btn))" }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-plex text-lg font-semibold text-li-carbon tabular-nums">
            {unavailableReason ? "—" : (value === null || value === undefined ? "—" : value)}
          </span>
        </div>
      </div>
      <div>
        <div className="text-sm font-bold text-li-carbon">{label}</div>
        <div className="text-xs text-li-slate mt-0.5">
          {unavailableReason ? `Not tracked: ${unavailableReason}` : sub}
        </div>
      </div>
    </div>
  );
}