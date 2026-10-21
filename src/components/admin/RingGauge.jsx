export default function RingGauge({ value, max = 100, label, sub, unavailableReason }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const frac = value === null || value === undefined || unavailableReason ? null : Math.max(0, Math.min(1, Number(value) / max));

  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5 flex items-center gap-4">
      <div className="relative w-24 h-24 shrink-0">
        <svg viewBox="0 0 120 120" className="w-24 h-24 -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" stroke="#e6efe9" strokeWidth="10" />
          {frac !== null && (
            <circle
              cx="60" cy="60" r={R} fill="none" stroke="#1d9e56" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={C} strokeDashoffset={C * (1 - frac)}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-[#0c3b24]">
            {unavailableReason ? "—" : (value === null || value === undefined ? "—" : value)}
          </span>
        </div>
      </div>
      <div>
        <div className="text-sm font-bold text-[#0c3b24]">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">
          {unavailableReason ? `Not tracked: ${unavailableReason}` : sub}
        </div>
      </div>
    </div>
  );
}