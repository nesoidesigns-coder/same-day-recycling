import { useState } from "react";
import OSIntelligenceGauge from "@/components/os/OSIntelligenceGauge";
import { CATEGORY_PALETTE, OS_COLORS } from "@/components/os/gaugeCore";

export default function CompositionGauge({ segments = [], total = 0, selectedKey, onSelect, label, primary, secondary, emptyLabel = "Awaiting verified data", appearance = "light", size = "feature" }) {
  const [hover, setHover] = useState(null);
  const active = hover ?? (selectedKey === "" ? null : selectedKey);
  let angle = -90;
  const items = total > 0 ? segments.map((segment, index) => {
    const span = (segment.value / total) * 360;
    const a0 = angle;
    angle += span;
    return {
      key: segment.key, r0: 0.72, r1: 0.81, a0, a1: a0 + Math.max(0, span - Math.min(2, span / 4)),
      fill: segment.color || CATEGORY_PALETTE[index % CATEGORY_PALETTE.length],
      selected: active === segment.key, opacity: active != null && active !== segment.key ? 0.3 : 0.95,
      title: `${segment.label}: ${segment.value}`,
      onMouseEnter: onSelect ? () => setHover(segment.key) : undefined,
      onMouseLeave: () => setHover(null), onFocus: onSelect ? () => setHover(segment.key) : undefined,
      onBlur: () => setHover(null),
    };
  }) : [];
  return <OSIntelligenceGauge size={size} appearance={appearance} ariaLabel={label} center={{ value: total > 0 ? primary ?? total : "—", status: total > 0 ? secondary : emptyLabel }} layers={[
    { type: "dial", radius: 0.96, ticks: 60, tickMajorEvery: 5, ringOpacity: 0.25 },
    { type: "ring", radius: 0.58, opacity: 0.2, color: OS_COLORS.cyan },
    { type: "arc", r0: 0.72, r1: 0.81, spanDeg: null },
    { type: "segments", items, onSelect },
  ]} />;
}