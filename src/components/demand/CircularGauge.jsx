import MetricGauge from "@/components/os/MetricGauge";

export default function CircularGauge({ value, max, size = 232, stroke = 20, label, sublabel, neutral = false, neutralLabel = "Data unavailable", onClick, ariaLabel }) {
  return <div className="relative mx-auto w-full" style={{ maxWidth: size }}>
    <MetricGauge value={value} max={max} display={label} label={ariaLabel || "Demand activity"} unavailable={neutral} appearance="dark" size={size}>
      {neutral ? <p className="text-xs font-bold leading-snug text-os-silver">{neutralLabel}</p> : <><p className="metric text-3xl text-os-ink">{label}</p>{sublabel && <p className="mt-1.5 text-[10px] font-semibold text-os-silver">{sublabel}</p>}</>}
    </MetricGauge>
    {onClick && <button type="button" onClick={onClick} className="absolute inset-0 rounded-full" aria-label={ariaLabel || "Explore demand activity"} />}
  </div>;
}