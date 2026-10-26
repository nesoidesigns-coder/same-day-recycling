import MetricGauge from "@/components/os/MetricGauge";
import { OS_COLORS } from "@/components/os/gaugeCore";

export function speedoStatus(value, target, warning) {
  if (target == null || value >= target) return "ok";
  if (warning != null && value >= warning) return "warn";
  return "bad";
}
const COLORS = { ok: OS_COLORS.green, warn: OS_COLORS.amber, bad: OS_COLORS.coral };
const STATUS_TEXT = { ok: "On target", warn: "Needs attention", bad: "Critical" };

export default function SpeedometerGauge({ value, min = 0, max = 100, unit = "%", target, warning, display }) {
  const present = value != null && Number.isFinite(Number(value));
  const clamped = Math.max(min, Math.min(max, Number(value) || 0));
  const status = speedoStatus(clamped, target, warning);
  return <div>
    <MetricGauge value={present ? clamped : null} min={min} max={max} display={display ?? Math.round(clamped)} unit={unit} label="Performance" target={target} color={COLORS[status]} size={190} />
    <div className="mt-1 flex flex-wrap justify-between gap-2 text-[10px] text-li-slate tabular">
      <span>{min}{unit}</span>{target != null && <span>Target {target}{unit}</span>}<span>{max}{unit}</span>
    </div>
    <div className="mt-2 text-center text-[11px] font-semibold text-li-slate">{!present ? "Awaiting data" : target == null ? "No target set" : STATUS_TEXT[status]}</div>
  </div>;
}