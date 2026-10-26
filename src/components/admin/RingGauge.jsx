import OSIntelligenceGauge from "@/components/os/OSIntelligenceGauge";
import { OS_COLORS } from "@/components/os/gaugeCore";

// Admin status-row gauge, rendered through the shared OSIntelligenceGauge
// family so ring geometry, thickness, colours and empty states match the
// master Live Intelligence design everywhere. The arc is drawn only when a
// meaningful fraction exists (value and max both present).
export default function RingGauge({ value, max = 100, label, sub, unavailableReason, color = OS_COLORS.green }) {
  const frac = value === null || value === undefined || unavailableReason ? null : Math.max(0, Math.min(1, Number(value) / max));

  return (
    <div className="rounded-[14px] bg-white border border-li-steel shadow-sm p-5 flex items-center gap-4">
      <OSIntelligenceGauge
        size="micro"
        appearance="light"
        className="w-16 h-16 shrink-0"
        ariaLabel={label}
        layers={[
          ...(frac !== null
            ? [{ type: "arc", r0: 0.72, r1: 0.9, spanDeg: frac * 340, color, title: `${label}: ${value}` }]
            : []),
        ]}
      />
      <div>
        <div className="text-sm font-bold text-li-carbon">{label}</div>
        <div className="metric text-2xl text-li-carbon">
          {unavailableReason ? "—" : (value === null || value === undefined ? "—" : value)}
        </div>
        <div className="text-xs text-li-slate mt-0.5">
          {unavailableReason ? `Not tracked: ${unavailableReason}` : sub}
        </div>
      </div>
    </div>
  );
}