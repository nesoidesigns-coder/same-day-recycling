export default function StatusGauge({ max, segments, unit = "" }) {
  const safeMax = max > 0 ? max : 1;
  const totalUsed = (segments || []).reduce((s, x) => s + (Number(x.value) || 0), 0);

  return (
    <div>
      <div className="flex h-2 rounded-full overflow-hidden bg-li-steel/40 border border-li-steel" role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(", ")}>
        {segments.map((s) => (
          <div
            key={s.label}
            style={{ width: `${Math.min(100, ((Number(s.value) || 0) / safeMax) * 100)}%` }}
            className={s.color}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-[9px] font-semibold text-li-slate">
        <span>0{unit}</span>
        <span>{safeMax}{unit}</span>
      </div>
      <ul className="mt-3 space-y-1.5">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-li-slate">
              <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
              {s.label}
            </span>
            <span className="font-bold text-li-carbon tabular-nums">{s.value}{unit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}