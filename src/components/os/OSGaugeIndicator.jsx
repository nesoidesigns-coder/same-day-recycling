import { polar, OS_COLORS } from "./gaugeCore";

// One precision indicator node on a gauge ring — sized and brightened by its
// share of the measured data, with an optional short label. Clicking focuses
// the gauge (and the rest of the page) on that item.
export default function OSGaugeIndicator({
  R = 246,
  radius = 0.5,
  angle = 0,
  label,
  share = 0.5,
  color = OS_COLORS.cyan,
  title,
  onClick,
}) {
  const [x, y] = polar(R * radius, angle);
  return (
    <g className={onClick ? "cursor-pointer outline-none" : undefined} onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined} aria-label={onClick ? title || label : undefined} onKeyDown={onClick ? (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onClick(); } } : undefined}>
      <circle cx={x} cy={y} r={3 + share * 4} fill={color} fillOpacity={0.25 + share * 0.65}>
        {title && <title>{title}</title>}
      </circle>
      {label && (
        <text x={x} y={y - 9} textAnchor="middle" fontSize="7.5" fontWeight="700" fill={OS_COLORS.silver} className="font-plex pointer-events-none">
          {label}
        </text>
      )}
    </g>
  );
}