import { polar, ringSector, OS_COLORS } from "./gaugeCore";

// One gauge segment: a categorical sector (with optional centered value) or
// a quiet dashed "ghost" stub preserving the visual structure when a
// category has no verified observations. Radii are fractions of R so every
// gauge size shares identical proportions.
export default function OSGaugeSegment({
  R = 246,
  r0,
  r1,
  a0,
  a1,
  fill,
  opacity = 1,
  selected = false,
  dim = false,
  ghost = false,
  title,
  value = null,
  onSelect,
  interactive = true,
}) {
  const R0 = r0 * R;
  const R1 = r1 * R;

  if (ghost) {
    return (
      <path
        d={ringSector(R0, R1, a0, a1)}
        fill="none"
        stroke={OS_COLORS.silver}
        strokeOpacity="0.14"
        strokeWidth="0.75"
        strokeDasharray="2 4"
        className="pointer-events-none"
        aria-label={title}
      />
    );
  }

  const midR = (R0 + R1) / 2;
  const midA = (a0 + a1) / 2;
  return (
    <g>
      <path
        d={ringSector(R0, R1, a0, a1)}
        fill={fill}
        opacity={opacity}
        stroke={selected ? OS_COLORS.cyan : "none"}
        strokeWidth={selected ? 1.5 : 0}
        className={onSelect ? "cursor-pointer outline-none transition-opacity duration-500" : "pointer-events-none"}
        {...(onSelect
          ? {
              role: "button",
              tabIndex: 0,
              "aria-label": title,
              onClick: onSelect,
              onKeyDown: (e) => (e.key === "Enter" || e.key === " ") && onSelect(),
            }
          : {})}
      >
        {title && <title>{title}</title>}
      </path>
      {value != null && (
        <text
          x={polar(midR, midA)[0]}
          y={polar(midR, midA)[1]}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10.5"
          fontWeight="700"
          fill="#06121F"
          opacity={dim ? 0.3 : 0.85}
          className="font-plex pointer-events-none"
        >
          {value}
        </text>
      )}
    </g>
  );
}