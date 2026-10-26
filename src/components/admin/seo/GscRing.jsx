import MetricGauge from "@/components/os/MetricGauge";
import { OS_COLORS } from "@/components/os/gaugeCore";

export default function GscRing({ pct, value, label, sub, status = "ok" }) {
  const color = status === "ok" ? OS_COLORS.green : status === "pending" ? OS_COLORS.amber : OS_COLORS.silver;
  return <div className="surface-dark p-5 text-center text-os-ink">
    <MetricGauge value={pct ?? (value != null ? 0 : null)} max={pct == null ? null : 100} display={value} label={label} appearance="dark" color={color} size={130} />
    <div className="mt-2 text-sm font-bold">{label}</div>
    <div className="mt-1 text-xs text-os-silver">{sub}</div>
  </div>;
}