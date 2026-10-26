import CompositionGauge from "@/components/os/CompositionGauge";
import MetricGauge from "@/components/os/MetricGauge";

export default function DemandRing({ value, max, segments = [], selected, onSelect, empty, loading, unit, centerSub, label }) {
  const total = segments.reduce((sum, segment) => sum + (Number(segment.value) || 0), 0);
  if (!loading && !empty && !max && total > 0) return <CompositionGauge label={label || "Demand gauge"} segments={segments.map((segment) => ({ ...segment, key: segment.key ?? segment.label }))} total={total} selectedKey={selected} onSelect={onSelect} primary={value} secondary={[unit, centerSub].filter(Boolean).join(" · ")} />;
  return <MetricGauge value={value} max={max ?? null} display={value} unit={unit} unavailable={empty} loading={loading} label={label || "Demand gauge"} size={260}>
    {empty ? <span className="text-xs text-ri-slate">No verified data yet</span> : <><div className="metric text-2xl text-ri-charcoal">{value ?? "—"}</div>{unit && <div className="mt-1 text-[10px] text-ri-slate">{unit}</div>}{centerSub && <div className="mt-1 text-[9px] text-ri-slate">{centerSub}</div>}</>}
  </MetricGauge>;
}