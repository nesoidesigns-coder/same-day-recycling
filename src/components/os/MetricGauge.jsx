import OSIntelligenceGauge from "@/components/os/OSIntelligenceGauge";
import { OS_COLORS } from "@/components/os/gaugeCore";

// All scalar instruments use the master dial. Counts without a denominator
// retain a neutral track; a verified zero never gets a minimum filled arc.
export default function MetricGauge({
  value, min = 0, max = 100, display, unit = "", label = "Metric",
  loading = false, unavailable = false, color = OS_COLORS.cyan,
  appearance = "light", size = 180, children, target,
}) {
  const present = value != null && Number.isFinite(Number(value)) && !unavailable;
  const fraction = present && max != null && max > min
    ? Math.max(0, Math.min(1, (Number(value) - min) / (max - min))) : null;
  const layers = [
    { type: "dial", radius: 0.96, ticks: 48, tickMajorEvery: 4, ringOpacity: 0.22 },
    { type: "ring", radius: 0.65, opacity: 0.15 },
    { type: "arc", r0: 0.77, r1: 0.82, a0: 100, spanDeg: loading || fraction == null ? null : fraction * 340, color },
    ...(target != null && max > min ? [{ type: "nodes", radius: 0.9, items: [{ key: "target", angle: 100 + Math.max(0, Math.min(1, (target - min) / (max - min))) * 340, share: 0.2, color: OS_COLORS.silver, title: `Target: ${target}${unit}` }] }] : []),
  ];
  return (
    <div className="os-metric-gauge relative mx-auto w-full" style={{ maxWidth: size }} data-appearance={appearance}>
      <OSIntelligenceGauge size="feature" appearance={appearance} loading={loading} ariaLabel={`${label}: ${loading ? "loading" : unavailable || !present ? "unavailable" : display ?? value}${unit}`} layers={layers} />
      <div className="pointer-events-none absolute inset-0 grid place-items-center px-[21%] text-center">
        <div className="w-full min-w-0">
          {loading ? <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground" role="status" aria-label="Loading metric" /> : children || <>
            <div className="os-metric-value metric text-xl leading-tight sm:text-2xl">{unavailable || !present ? "—" : display ?? value}</div>
            {unit && <div className="os-metric-unit mt-1 text-[10px] font-semibold">{unit}</div>}
          </>}
        </div>
      </div>
    </div>
  );
}