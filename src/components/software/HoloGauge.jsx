import MetricGauge from "@/components/os/MetricGauge";
import { OS_COLORS } from "@/components/os/gaugeCore";

export default function HoloGauge({ value, label, sub }) {
  return <div className="flex flex-col items-center gap-3">
    <MetricGauge value={value} max={100} display={value == null ? undefined : `${value}%`} label={label} appearance="dark" color={OS_COLORS.green} size={150} />
    <div className="text-center"><div className="text-sm font-bold text-os-ink">{label}</div>{sub && <div className="mt-1 text-[11px] text-os-silver">{sub}</div>}</div>
  </div>;
}