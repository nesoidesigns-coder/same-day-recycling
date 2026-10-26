import MetricGauge from "@/components/os/MetricGauge";
import { OS_COLORS } from "@/components/os/gaugeCore";

export default function ProgressRing({ value, target, display, targetDisplay, label }) {
  const pct = target > 0 ? (Number(value) || 0) / target * 100 : null;
  return <div>
    <MetricGauge value={value} max={target} display={display} unit={targetDisplay ? `of ${targetDisplay}` : ""} label={label || "Progress"} color={OS_COLORS.green} size={180} />
    <div className="mt-1 text-center text-[11px] font-semibold text-li-slate">
      {value == null ? "Awaiting data" : pct == null ? "No target set" : pct > 100 ? `Over target by ${Math.round(pct - 100)}%` : `${Math.max(0, pct).toFixed(0)}% of target`}
    </div>
  </div>;
}