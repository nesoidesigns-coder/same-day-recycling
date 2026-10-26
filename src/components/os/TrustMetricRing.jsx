import MetricGauge from "@/components/os/MetricGauge";
import { OS_COLORS } from "@/components/os/gaugeCore";

export default function TrustMetricRing({ pct, neutral }) {
  return <div className="w-20">
    <MetricGauge value={pct} unavailable={neutral} display={`${Math.round(pct)}%`} label="Trust metric" color={OS_COLORS.green} size={80} />
    <p className="mt-1 text-center text-[9px] text-ri-slate">{neutral ? "pending data" : "verified"}</p>
  </div>;
}