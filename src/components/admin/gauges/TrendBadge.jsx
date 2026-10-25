export default function TrendBadge({ delta, positiveIsGood = true, label = "vs previous" }) {
  if (delta === null || delta === undefined) {
    return <span className="font-plex text-[11px] text-li-slate font-medium">{label}: no comparison data</span>;
  }
  const good = positiveIsGood ? delta >= 0 : delta <= 0;
  const cls = good ? "bg-li-mint/15 text-li-forest border-li-mint/50" : "bg-li-red/10 text-li-red border-li-red/40";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${cls}`}>
      <svg viewBox="0 0 12 12" className={`w-3 h-3 ${delta < 0 ? "rotate-180" : ""}`} aria-hidden="true">
        <path d="M6 2 L10 8 L2 8 Z" fill="currentColor" />
      </svg>
      {Math.abs(delta)}% {label}
    </span>
  );
}