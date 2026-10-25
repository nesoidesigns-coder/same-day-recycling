import { useRef, useState } from "react";

// Multi-ring radial demand gauge. Rings: outer = industries, middle =
// subdivisions, inner = topics. Drag rotates; tap drills down. Pure display —
// all data comes from the nationalDemand function, already basis-labelled.
const RING_DEFS = {
  outer: { r1: 196, r2: 156 },
  middle: { r1: 150, r2: 114 },
  inner: { r1: 108, r2: 74 },
};
const GAP = 0.035; // radians of spacing between sectors

function sectorPath(r1, r2, a0, a1) {
  const p = (r, a) => `${(200 + r * Math.cos(a)).toFixed(2)} ${(200 + r * Math.sin(a)).toFixed(2)}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${p(r2, a0)} A ${r2} ${r2} 0 ${large} 1 ${p(r2, a1)} L ${p(r1, a1)} A ${r1} ${r1} 0 ${large} 0 ${p(r1, a0)} Z`;
}

// Vibrant tone ramp corresponding to demand strength: cyan (low) → teal →
// emerald → vivid mint (high). Every connected sector gets its own tone.
function sectorTone(weight) {
  const t = Math.min(1, Math.max(0, weight));
  const hue = 190 - 45 * t;      // 190 (cyan) → 145 (green)
  const sat = 78 + 18 * t;       // 78% → 96%
  const light = 50 + 16 * t;     // 50% → 66%
  return { fill: `hsla(${hue.toFixed(0)}, ${sat.toFixed(0)}%, ${light.toFixed(0)}%, ${(0.42 + 0.5 * t).toFixed(2)})`, edge: `hsla(${hue.toFixed(0)}, 92%, ${(light + 14).toFixed(0)}%, 0.85)` };
}

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
    const tone = sectorTone(item.weight);
    return (
      <path
        key={item.slug}
        d={sectorPath(def.r1, def.r2, a0, a1)}
        fill={isConnected ? tone.fill : "rgba(148,163,184,0.14)"}
        stroke={isSel ? "#7CFFC4" : isConnected ? tone.edge : "rgba(148,163,184,0.3)"}
        strokeWidth={isSel ? 2.5 : 1}
        strokeDasharray={isConnected ? undefined : "3 4"}
        className={`cursor-pointer ${isConnected ? "gauge-pulse" : ""}`}
        style={isConnected ? { animationDelay: `${((i * 0.45) % 3.6).toFixed(2)}s`, animationDuration: `${(3 + item.weight * 1.6).toFixed(2)}s` } : undefined}
        opacity={dimmed ? 0.35 : 1}
        onClick={(e) => { e.stopPropagation(); if (!dragState.current.moved) onSelect(item); }}
      />
    );
  });
}

// Shared drag tracker (set inside the component's ref below).
const dragState = { current: { moved: false } };

export default function IndustryGauge({ rings, selected, onSelect, loading, centerTitle, centerSub, onBack }) {
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
        <circle cx="200" cy="200" r="199" fill="rgba(5,21,17,0.6)" />
        <circle cx="200" cy="200" r="71" fill="rgba(16,43,42,0.9)" stroke="rgba(84,217,174,0.35)" />
        {/* Live sweep: rotating radar arc showing the gauge refreshes itself */}
        <circle className="gauge-sweep" cx="200" cy="200" r="197" fill="none" stroke="rgba(124,255,196,0.55)" strokeWidth="3" strokeLinecap="round" strokeDasharray="36 1202" />
        {!rings.middle && <circle cx="200" cy="200" r="132" fill="none" stroke="rgba(84,217,174,0.18)" strokeDasharray="2 6" />}
        {!rings.inner && <circle cx="200" cy="200" r="91" fill="none" stroke="rgba(84,217,174,0.12)" strokeDasharray="2 6" />}
        <g transform={`rotate(${angle} 200 200)`}>
          {ringSectors("outer", rings.outer, selected.outer, handleSelect("outer"), Boolean(selected.outer))}
          {ringSectors("middle", rings.middle, selected.middle, handleSelect("middle"), Boolean(selected.middle))}
          {ringSectors("inner", rings.inner, selected.inner, handleSelect("inner"), false)}
        </g>
      </svg>

      {/* Centre label + drill-down control (HTML for crisp, accessible text) */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex w-40 flex-col items-center text-center">
          {loading ? (
            <div className="h-4 w-24 animate-pulse rounded-full bg-emerald-400/30" role="status" aria-label="Loading demand data" />
          ) : selected.outer ? (
            <button type="button" onClick={onBack} className="flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-emerald-100 hover:text-white" aria-label="Back to all industries">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/80">Back</span>
              <span className="line-clamp-2 text-xs font-bold leading-tight">{hovered?.name || centerTitle}</span>
            </button>
          ) : (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/90">Canada</p>
              <p className="mt-0.5 text-sm font-bold leading-tight text-white">{hovered?.name || centerTitle}</p>
              {centerSub && <p className="mt-1 text-[10px] leading-tight text-emerald-100/70">{hovered ? "Tap to explore" : centerSub}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}