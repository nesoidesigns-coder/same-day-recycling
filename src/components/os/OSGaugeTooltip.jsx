// Gauge tooltip / metric-definition panel: precise definition, value, source
// and basis for any gauge layer — one hover or tap away, never buried.
export default function OSGaugeTooltip({ detail }) {
  if (!detail) return null;
  const { label, value, definition, source } = detail;
  return (
    <div className="rounded-2xl border border-cine-line/60 bg-cine-surface/60 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-sm font-bold text-cine-ink">{label}</div>
        {source && <div className="font-plex text-[10px] text-cine-muted">{source}</div>}
      </div>
      {value != null && value !== "" && <div className="mt-1 text-xl font-extrabold tabular-nums text-cine-cyan">{value}</div>}
      {definition && <p className="mt-1.5 text-xs leading-relaxed text-cine-muted">{definition}</p>}
    </div>
  );
}