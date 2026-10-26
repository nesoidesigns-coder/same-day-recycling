import { timestamp } from "@/components/si/siShared";
import CompositionGauge from "@/components/os/CompositionGauge";

export default function ConsumerIntelligenceGauge({ label, segments = [], total = 0, centerPrimary, centerSub, selectedIndex = null, onSelect, period, scope, source, generatedAt, emptyLabel = "No recorded observations yet for this selection.", className = "" }) {
  return <figure className={`m-0 ${className}`}>
    <CompositionGauge label={label} segments={segments} total={total} selectedKey={selectedIndex == null ? null : segments[selectedIndex]?.key} onSelect={onSelect ? (key) => { const index = segments.findIndex((segment) => segment.key === key); onSelect(index === selectedIndex ? null : index); } : undefined} primary={centerPrimary} secondary={centerSub} emptyLabel={emptyLabel} />
    {total <= 0 && <p className="text-center text-xs text-si-muted">{emptyLabel}</p>}
    <figcaption className="mt-1 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-0.5 font-plex text-xs text-si-muted">
      {period && <span>{period}</span>}{scope && <span>· {scope}</span>}{source && <span>· Source: {source}</span>}{generatedAt && <span>· Updated {timestamp(generatedAt)}</span>}
    </figcaption>
    <table className="sr-only"><caption>{label}</caption><tbody>{segments.map((segment) => <tr key={segment.key}><th scope="row">{segment.label}</th><td>{segment.value}</td></tr>)}<tr><th scope="row">Total</th><td>{total}</td></tr></tbody></table>
  </figure>;
}