// Small labeled metric readout used beside and beneath gauges — one
// typography hierarchy for every intelligence number on the platform.
const TONES = {
  cyan: "text-cine-cyan",
  blue: "text-cine-blue",
  violet: "text-cine-violet",
  green: "text-cine-green",
  amber: "text-cine-amber",
  slate: "text-cine-muted",
};

export default function OSGaugeMetricLabel({ label, value, unit, note, tone = "cyan", className = "" }) {
  return (
    <div className={className}>
      <div className="font-plex text-[9px] font-bold uppercase tracking-[0.22em] text-cine-muted">{label}</div>
      <div className={`mt-0.5 text-lg font-bold tabular-nums ${TONES[tone] || TONES.cyan}`}>
        {value ?? "—"}
        {unit && <span className="ml-1 text-xs font-semibold text-cine-muted">{unit}</span>}
      </div>
      {note && <div className="text-[10px] leading-snug text-cine-muted">{note}</div>}
    </div>
  );
}