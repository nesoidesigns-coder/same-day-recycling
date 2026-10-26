import OSIntelligenceGauge from "@/components/os/OSIntelligenceGauge";
import { CATEGORY_PALETTE, OS_COLORS } from "@/components/os/gaugeCore";

// THE CANADA SIGNAL — signature master gauge, now on the Recycling OS
// instrument family (the same dial, segments, indicator nodes and center
// display as the Live Intelligence radar) in its light appearance.
//   outer sectors = service-category signals (relative to the strongest)
//   tick dial     = the measurement scale
//   inner nodes   = cities with verified contractor records
//   center        = the Signal value — actual customer searches, never a blend
export default function CanadaSignal({
  value,
  period,
  periodOverride,
  categories = [],
  selected = "",
  onSelect,
  geoLabel = "Canada",
  coverageCount = 0,
  updatedAt,
  isLoading,
}) {
  const hasValue = value != null;
  const display = hasValue ? String(Math.round(value)) : "—";
  const pulseKey = hasValue ? Math.round(value) : 0;
  // Categories carry real search counts — sector intensity is relative to the
  // strongest category, not a fixed 0-100 scale.
  const maxCategory = Math.max(...categories.map((c) => Number(c.value) || 0), 0);

  const segSpan = 360 / Math.max(categories.length, 1);
  const gap = segSpan > 20 ? 6 : 3;
  let angle = -90;
  const segmentItems = categories.map((c, i) => {
    const a0 = angle + gap / 2;
    angle += segSpan;
    const a1 = angle - gap / 2;
    const isSel = selected === c.key;
    const frac = c.available ? Math.max(0.12, Math.min(1, (Number(c.value) || 0) / (maxCategory || 1))) : 0;
    return {
      key: c.key,
      r0: 0.74,
      r1: 0.86,
      a0,
      a1,
      fill: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
      selected: isSel,
      ghost: !c.available,
      opacity: selected && !isSel ? 0.3 : 0.4 + 0.6 * frac,
      title: `${c.label}${c.available ? ` — ${c.value} customer searches` : " — no searches recorded yet"}`,
    };
  });

  const cityDots = Math.min(coverageCount, 12);
  const layers = [
    { type: "dial", radius: 0.96, ticks: 72, tickMajorEvery: 6, ringOpacity: 0.22, delay: 0 },
    { type: "ring", radius: 0.52, opacity: 0.28, dash: "1 6" },
    ...(cityDots > 0
      ? [
          {
            type: "nodes",
            radius: 0.52,
            items: Array.from({ length: cityDots }, (_, i) => ({
              key: `city-${i}`,
              angle: (i / cityDots) * 360,
              share: 0.15,
              color: OS_COLORS.green,
              title: `${coverageCount} cities with verified contractor records`,
            })),
          },
        ]
      : []),
    { type: "segments", items: segmentItems, delay: 120 },
  ];

  return (
    <div className="relative mx-auto w-full max-w-[340px]">
      <OSIntelligenceGauge
        size="feature"
        appearance="light"
        loading={isLoading && !hasValue}
        pulseKey={pulseKey}
        ariaLabel={`Canada Signal: ${hasValue ? `${display} customer searches` : "not available"}, ${period || ""}, ${geoLabel}`}
        center={
          hasValue
            ? {
                title: "SEARCHES",
                value: display,
                status: "CUSTOMER SEARCHES",
                note: `actual count · ${periodOverride || period || "28-day window"}`,
              }
            : {
                title: "SEARCHES",
                value: "",
                status: isLoading ? "READING VERIFIED DATA" : "NO RECORDED SEARCHES YET",
                note: "",
              }
        }
        layers={layers}
      />

      <div className="mt-1 flex flex-col items-center gap-1 text-center">
        <span className="rounded-full bg-ri-amber/15 px-2.5 py-0.5 text-xs font-bold text-ri-forest">{geoLabel}</span>
        {updatedAt && (
          <span className="font-plex text-[11px] text-ri-slate">
            updated {new Date(updatedAt).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </span>
        )}
      </div>
    </div>
  );
}