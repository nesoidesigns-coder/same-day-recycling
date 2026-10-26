import { useId } from 'react';

// Large circular intelligence gauge: thick gradient progress arc (emerald ->
// cyan) with a smooth CSS transition on value changes, and a neutral state
// ("Data unavailable") when no verified data exists. No heavy animation.
export default function CircularGauge({
  value, max, size = 232, stroke = 20,
  label, sublabel,
  neutral = false, neutralLabel = 'Data unavailable',
  onClick, ariaLabel,
}) {
  const gid = useId().replace(/[:]/g, 'g');
  const r = (size - stroke) / 2 - 2;
  const C = 2 * Math.PI * r;
  const frac = !neutral && Number.isFinite(value) && max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const offset = C * (1 - frac);

  return (
    <div
      className={`relative mx-auto ${onClick ? 'cursor-pointer' : ''}`}
      style={{ width: size, maxWidth: '100%' }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-expanded={onClick ? undefined : undefined}
    >
      <svg width="100%" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={ariaLabel}>
        <defs>
          <linearGradient id={`gauge-${gid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#32C7D5" />
            <stop offset="100%" stopColor="#55C7A1" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={neutral ? 'transparent' : `url(#gauge-${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)', filter: 'drop-shadow(0 0 6px rgba(50, 199, 213, 0.45))' }}
        />
        <circle cx={size / 2} cy={size / 2} r={r - stroke / 2 - 4} fill="rgba(5, 21, 17, 0.35)" stroke="rgba(24, 123, 101, 0.25)" strokeWidth="1" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        {neutral ? (
          <p className="text-sm font-bold leading-snug text-market-muted">{neutralLabel}</p>
        ) : (
          <>
            <p className="text-4xl font-extrabold leading-none tracking-tight text-market-ink sm:text-5xl">{label}</p>
            {sublabel && <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-market-muted">{sublabel}</p>}
          </>
        )}
      </div>
    </div>
  );
}