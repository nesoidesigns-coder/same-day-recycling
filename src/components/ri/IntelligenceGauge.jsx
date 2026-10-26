import MetricGauge from "@/components/os/MetricGauge";
import { OS_COLORS } from "@/components/os/gaugeCore";

const fmtTime = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" });
};
export default function IntelligenceGauge({ value, max, unit = "", label, sub, source, updatedAt, unavailableReason }) {
  return <div className="flex flex-col items-center text-center">
    <MetricGauge value={value} max={max} display={value == null ? undefined : Math.round(Number(value) * 10) / 10} unit={unit} label={label} unavailable={!!unavailableReason} color={OS_COLORS.green} size={220} />
    <div className="mt-2 text-sm font-bold text-ri-charcoal">{unavailableReason ? "Not available" : label}</div>
    {(unavailableReason || sub) && <div className="mt-1 max-w-[260px] text-xs text-ri-slate">{unavailableReason || sub}</div>}
    <div className="mt-2 font-plex text-xs text-ri-slate">{unavailableReason ? "Insufficient verified data" : <>Source: {source} · Updated {fmtTime(updatedAt) || "recently"}</>}</div>
  </div>;
}