import { useRef, useState } from "react";
import OSGaugeRing from "@/components/os/OSGaugeRing";
import OSGaugeSegment from "@/components/os/OSGaugeSegment";
import { OS_COLORS, CATEGORY_PALETTE } from "@/components/os/gaugeCore";

// Multi-ring radial demand gauge. Rings: outer = industries, middle =
// subdivisions, inner = topics. Drag rotates; tap drills down. Pure display —
// all data comes from the nationalDemand function, already basis-labelled.
const RING_DEFS = {
  outer: { r1: 188, r2: 171 },
  middle: { r1: 151, r2: 137 },
  inner: { r1: 114, r2: 102 },
};
const GAP = 0.035; // radians of spacing between sectors


function ringSectors(ringKey, items, selectedSlug, onSelect, dimmed) {
  const def = RING_DEFS[ringKey];
  if (!items?.length) return null;
  const span = Math.PI * 2 - GAP * items.length;
  const step = span / items.length;
  return items.map((item, i) => {
    const a0 = -Math.PI / 2 + GAP / 2 + i * step;
    const a1 = a0 + step;
    const isConnected = item.weight > 0;
    const isSel = selectedSlug === item.slug;
    return (
      <OSGaugeSegment key={item.slug} R={196} r0={def.r2 / 196} r1={def.r1 / 196} a0={a0 * 180 / Math.PI} a1={a1 * 180 / Math.PI}
        fill={isConnected ? CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] : OS_COLORS.silver}
        selected={isSel} opacity={dimmed && !isSel ? 0.3 : isConnected ? 0.5 + Math.min(1, item.weight) * 0.5 : 0.12}
        title={`${item.name}${isConnected ? "" : ": no observations yet"}`}
        onSelect={() => { if (!dragState.current.moved) onSelect(item); }} />
    );
  });
}

// Shared drag tracker (set inside the component's ref below).
const dragState = { current: { moved: false } };

export default function IndustryGauge({ rings, selected, onSelect, loading, centerTitle, centerSub, onBack, topTopic }) {
  const [angle, setAngle] = useState(0);
  const [hovered, setHovered] = useState(null);
  const drag = useRef({ active: false, moved: false, startX: 0, startAngle: 0 });

  const handleSelect = (ringKey) => (item) => {
    setHovered(null);
    onSelect(ringKey, item);
  };

  return (
    <div className="relative mx-auto w-full max-w-[420px] select-none">
      <svg
        viewBox="0 0 400 400"
        className="w-full"
        role="img"
        aria-label="Canadian demand gauge: industries, subdivisions and search topics. Drag to rotate, tap a ring to drill down."
        style={{ touchAction: "pan-y" }}
        onPointerDown={(e) => { drag.current = { active: true, moved: false, startX: e.clientX, startAngle: angle }; }}
        onPointerMove={(e) => {
          if (!drag.current.active) return;
          const dx = e.clientX - drag.current.startX;
          if (Math.abs(dx) > 6) { drag.current.moved = true; dragState.current.moved = true; }
          setAngle(drag.current.startAngle + dx * 0.35);
        }}
        onPointerUp={() => { drag.current.active = false; setTimeout(() => { dragState.current.moved = false; }, 60); }}
        onPointerLeave={() => { if (drag.current.active) { drag.current.active = false; setTimeout(() => { dragState.current.moved = false; }, 60); } }}
      >
        <circle cx="200" cy="200" r="199" fill={OS_COLORS.core} />
        <circle cx="200" cy="200" r="71" fill={OS_COLORS.deep} stroke={OS_COLORS.line} />
        <g transform="translate(-60 -60)"><OSGaugeRing R={196} ticks={60} tickMajorEvery={5} ringOpacity={0.3} /></g>
        {!rings.middle && <circle cx="200" cy="200" r="144" fill="none" stroke={OS_COLORS.line} strokeDasharray="2 6" />}
        {!rings.inner && <circle cx="200" cy="200" r="108" fill="none" stroke={OS_COLORS.line} strokeDasharray="2 6" />}
        <g transform={`rotate(${angle} 200 200)`}><g transform="translate(-60 -60)">
          {ringSectors("outer", rings.outer, selected.outer, handleSelect("outer"), Boolean(selected.outer))}
          {ringSectors("middle", rings.middle, selected.middle, handleSelect("middle"), Boolean(selected.middle))}
          {ringSectors("inner", rings.inner, selected.inner, handleSelect("inner"), false)}
        </g></g>
      </svg>

      {/* Centre label + drill-down control (HTML for crisp, accessible text) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex w-40 flex-col items-center text-center">
          {loading ? (
            <div className="h-4 w-24 animate-pulse rounded-full bg-emerald-400/30" role="status" aria-label="Loading demand data" />
          ) : selected.outer ? (
            <button type="button" onClick={onBack} className="pointer-events-auto flex flex-col items-center gap-1 rounded-full px-3 py-2 text-os-silver hover:text-os-ink" aria-label="Back to all industries">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/80">Back</span>
              <span className="line-clamp-2 text-xs font-bold leading-tight">{hovered?.name || centerTitle}</span>
            </button>
          ) : (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/90">{topTopic ? "Strongest now" : "Canada"}</p>
              <p className="mt-0.5 text-sm font-bold leading-tight text-white">{hovered?.name || (topTopic ? topTopic.name : centerTitle)}</p>
              <p className="mt-1 text-[10px] leading-tight text-emerald-100/70">
                {hovered ? "Tap to explore" : topTopic ? `${topTopic.sub} · ${topTopic.ind}` : centerSub}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}