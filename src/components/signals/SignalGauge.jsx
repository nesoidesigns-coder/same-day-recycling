import { useEffect, useRef, useState } from "react";
import DataFreshness from "@/components/signals/DataFreshness";
import SignalPulse from "@/components/signals/SignalPulse";
import MetricGauge from "@/components/os/MetricGauge";
import { OS_COLORS } from "@/components/os/gaugeCore";

export default function SignalGauge({ value, max, unit = "", label, sub, source, updatedAt, observedAt, verification = "verified", unavailableReason, pulse = true, size = 220 }) {
  const usable = !unavailableReason && value != null && Number(max) > 0;
  const previous = useRef(value);
  const [pulseKey, setPulseKey] = useState(0);
  useEffect(() => {
    if (previous.current !== value) { previous.current = value; setPulseKey((key) => key + 1); }
  }, [value]);
  return <div className="flex flex-col items-center text-center">
    <MetricGauge value={value} max={max} display={value == null ? undefined : Math.round(Number(value) * 10) / 10} unit={unit} label={label} unavailable={!!unavailableReason} color={verification === "verified" ? OS_COLORS.green : OS_COLORS.cyan} size={size} />
    <div className="mt-2 text-sm font-bold text-ri-forest">{unavailableReason ? "Not available" : label}</div>
    {(unavailableReason || sub) && <div className="mt-1 max-w-[280px] text-xs text-ri-slate">{unavailableReason || sub}</div>}
    {pulse && usable && <div className="mt-1.5 h-4"><SignalPulse trigger={pulseKey} /></div>}
    <DataFreshness className="mt-2" source={unavailableReason ? null : source} observedAt={observedAt} updatedAt={updatedAt} verification={verification} size={pulse && usable ? "xs" : "sm"} />
    {unavailableReason && <div className="mt-1 font-plex text-xs text-ri-slate">Insufficient verified data</div>}
  </div>;
}