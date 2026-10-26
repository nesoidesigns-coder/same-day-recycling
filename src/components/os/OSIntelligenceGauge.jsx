import { useId } from "react";
import { GAUGE_SIZES, OS_COLORS, polar, ringSector, arcPath } from "./gaugeCore";
import OSGaugeRing from "./OSGaugeRing";
import OSGaugeSegment from "./OSGaugeSegment";
import OSGaugeIndicator from "./OSGaugeIndicator";

// The master gauge of Recycling OS — the reusable instrument family
// extracted from the Live Intelligence Canadian Service Radar. Every gauge
// on the platform renders through this component so ring architecture,
// proportions, typography, motion and honest empty states are identical.
//
// Layers (drawn in order, radii as fractions of R):
//   { type: "dial", ticks, tickMajorEvery, spokes, draw }   — reference scale
//   { type: "orbital" }                                      — ambient drift dots
//   { type: "segments", items: [...], onSelect }             — categorical sectors
//     item: { key, r0, r1, a0, a1, fill, opacity, selected, dim, ghost, title, value }
//   { type: "ring", radius, dash, opacity }                  — reference ring
//   { type: "arc", r0, r1, spanDeg|null, color, title }      — proportional arc
//   { type: "nodes", radius, items: [...], onSelect }        — indicator nodes
//
// Micro size renders a single compact ring + arc for status rows and tables.

const CENTER_SCALE = {
  hero: { value: "text-4xl sm:text-5xl", title: "text-[9px] tracking-[0.3em]", status: "text-[9px]", note: "text-[9px]" },
  feature: { value: "text-3xl", title: "text-[8px] tracking-[0.26em]", status: "text-[8px]", note: "text-[8px]" },
  standard: { value: "text-2xl", title: "text-[7px] tracking-[0.2em]", status: "hidden", note: "hidden" },
  compact: { value: "text-lg", title: "hidden", status: "hidden", note: "hidden" },
};

export default function OSIntelligenceGauge({
  size = "feature",
  appearance = "dark",
  loading = false,
  error = false,
  center = null,
  pulseKey = 0,
  layers = [],
  ariaLabel = "Intelligence gauge",
  className = "",
}) {
  const spec = GAUGE_SIZES[size] || GAUGE_SIZES.feature;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  if (size === "micro") {
    const arcLayer = layers.find((l) => l.type === "arc");
    const span = arcLayer?.spanDeg == null ? null : Math.max(0, Math.min(359.999, arcLayer.spanDeg));
    return (
      <svg viewBox="0 0 60 60" className={`os-gauge ${className}`} data-appearance={appearance} width="40" height="40" role="img" aria-label={ariaLabel}>
        <circle cx="30" cy="30" r="23" fill="none" stroke={OS_COLORS.line} strokeOpacity="0.4" strokeWidth="4" />
        {loading ? (
          <circle cx="30" cy="30" r="23" fill="none" stroke={OS_COLORS.silver} strokeOpacity="0.3" strokeWidth="4" strokeDasharray="3 6" />
        ) : span > 0 ? (
          <path d={arcPath(23, 90, 90 + span, 30, 30)} fill="none" stroke={arcLayer.color || OS_COLORS.cyan} strokeWidth="4" strokeLinecap="round" />
        ) : null}
        <circle cx="30" cy="30" r="3" fill={error ? OS_COLORS.coral : span != null ? arcLayer?.color || OS_COLORS.cyan : OS_COLORS.silver} fillOpacity="0.9" />
      </svg>
    );
  }

  return (
    <div className={`os-gauge relative mx-auto w-full ${className}`} data-appearance={appearance} style={{ maxWidth: spec.max }}>
      <svg viewBox="0 0 520 520" className="block w-full" role="group" aria-label={ariaLabel}>
        <defs>
          <radialGradient id={`os-amb-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={OS_COLORS.cyan} stopOpacity="0.12" />
            <stop offset="45%" stopColor={OS_COLORS.blue} stopOpacity="0.05" />
            <stop offset="100%" stopColor={OS_COLORS.cyan} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`os-core-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={OS_COLORS.surface} stopOpacity="0.92" />
            <stop offset="100%" stopColor={OS_COLORS.deep} stopOpacity="0.96" />
          </radialGradient>
        </defs>

        {/* ambient bloom — one soft cyan halo, never neon */}
        <circle cx={260} cy={260} r={spec.R} fill={`url(#os-amb-${uid})`} />

        {/* central display disc beneath the HTML overlay */}
        {center && (
          <>
            <circle cx={260} cy={260} r={72} fill={`url(#os-core-${uid})`} />
            <circle cx={260} cy={260} r={72} fill="none" stroke={OS_COLORS.hairline} strokeOpacity="0.25" strokeWidth="0.75" />
          </>
        )}

        {layers.map((layer, i) => (
          <GaugeLayer key={i} layer={layer} R={spec.R} />
        ))}
      </svg>

      {center && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="relative text-center">
            {pulseKey > 0 && <span key={pulseKey} className="cine-pulse-ring absolute -inset-6 rounded-full" aria-hidden="true" />}
            <div className={`font-plex font-bold uppercase text-os-cyan ${CENTER_SCALE[size].title}`}>{center.title}</div>
            <div className={`metric mt-1.5 ${CENTER_SCALE[size].value} ${center.value != null && center.value !== "" ? "text-os-ink" : "text-os-silver"}`}>
              {center.value != null && center.value !== "" ? center.value : "—"}
            </div>
            <div className={`os-gauge-status mt-1 font-plex uppercase tracking-[0.08em] text-os-silver ${CENTER_SCALE[size].status}`}>{center.status}</div>
            <div className={`text-os-silver ${CENTER_SCALE[size].note}`}>{center.note}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function GaugeLayer({ layer, R }) {
  switch (layer.type) {
    case "dial":
      return (
        <g className="radar-in" style={{ animationDelay: `${layer.delay || 0}ms` }} aria-hidden="true">
          <OSGaugeRing R={R} {...layer} />
        </g>
      );
    case "ring":
      return (
        <circle
          cx={260}
          cy={260}
          r={R * layer.radius}
          fill="none"
          stroke={layer.color || OS_COLORS.hairline}
          strokeOpacity={layer.opacity ?? 0.16}
          strokeWidth={layer.width ?? 0.75}
          strokeDasharray={layer.dash}
        />
      );
    case "orbital":
      return (
        <g aria-hidden="true">
          <g className="orb-slow">
            <circle cx={polar(R * 0.985, 30)[0]} cy={polar(R * 0.985, 30)[1]} r="7" fill={OS_COLORS.cyan} opacity="0.08" />
            <circle cx={polar(R * 0.985, 30)[0]} cy={polar(R * 0.985, 30)[1]} r="2" fill={OS_COLORS.cyan} opacity="0.85" />
          </g>
          <g className="orb-fast">
            <circle cx={polar(R * 0.935, 150)[0]} cy={polar(R * 0.935, 150)[1]} r="6" fill={OS_COLORS.violet} opacity="0.08" />
            <circle cx={polar(R * 0.935, 150)[0]} cy={polar(R * 0.935, 150)[1]} r="1.6" fill={OS_COLORS.violet} opacity="0.8" />
          </g>
        </g>
      );
    case "segments":
      return (
        <g className="radar-in" style={{ animationDelay: `${layer.delay || 0}ms` }}>
          {layer.items.map((s) => (
            <OSGaugeSegment key={s.key} R={R} {...s} onSelect={layer.onSelect && s.interactive !== false ? () => layer.onSelect(s.key) : undefined} />
          ))}
        </g>
      );
    case "arc":
      return (
        <g className="radar-in" style={{ animationDelay: `${layer.delay || 0}ms` }}>
          <circle
            cx={260}
            cy={260}
            r={((layer.r0 + layer.r1) / 2) * R}
            fill="none"
            stroke={OS_COLORS.hairline}
            strokeOpacity={layer.trackOpacity ?? 0.12}
            strokeWidth={((layer.r1 - layer.r0) * R).toFixed(2)}
            strokeLinecap="round"
          />
          {layer.spanDeg != null && (
            <path d={ringSector(layer.r0 * R, layer.r1 * R, layer.a0 ?? 60, (layer.a0 ?? 60) + layer.spanDeg)} fill={layer.color} opacity={layer.opacity ?? 0.85}>
              {layer.title && <title>{layer.title}</title>}
            </path>
          )}
        </g>
      );
    case "nodes":
      return (
        <g className="radar-in" style={{ animationDelay: `${layer.delay || 0}ms` }}>
          {layer.items.map((n, i) => (
            <OSGaugeIndicator
              key={n.key}
              R={R}
              radius={layer.radius}
              angle={n.angle ?? i * (360 / layer.items.length) - 90}
              {...n}
              onClick={layer.onSelect ? () => layer.onSelect(n.key) : undefined}
            />
          ))}
        </g>
      );
    default:
      return null;
  }
}