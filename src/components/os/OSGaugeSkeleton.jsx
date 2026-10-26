import { OS_COLORS } from "./gaugeCore";

// Loading state for any gauge size: the instrument's ring architecture is
// preserved (never a blank box) with a soft, honest "calibrating" label.
// No values, counters or trends are implied while data is in flight.
export default function OSGaugeSkeleton({ R = 246, label = "Calibrating instrument" }) {
  return (
    <svg viewBox="0 0 520 520" className="block w-full" role="status" aria-label={label}>
      <circle cx={260} cy={260} r={246} fill="none" stroke={OS_COLORS.hairline} strokeOpacity="0.25" strokeWidth="1" />
      <circle cx={260} cy={260} r={236} fill="none" stroke={OS_COLORS.hairline} strokeOpacity="0.12" strokeWidth="0.75" />
      <circle cx={260} cy={260} r={154} fill="none" stroke={OS_COLORS.hairline} strokeOpacity="0.1" strokeWidth="0.75" strokeDasharray="2 5" />
      <circle cx={260} cy={260} r={124} fill="none" stroke={OS_COLORS.hairline} strokeOpacity="0.1" strokeWidth="0.75" strokeDasharray="2 6" />
      <circle cx={260} cy={260} r={102} fill="none" stroke={OS_COLORS.hairline} strokeOpacity="0.1" strokeWidth="4" strokeLinecap="round" />
      <circle cx={260} cy={260} r={88} fill="none" stroke={OS_COLORS.hairline} strokeOpacity="0.1" strokeWidth="4" strokeLinecap="round" />
      <text x={260} y={266} textAnchor="middle" fontSize="13" fill={OS_COLORS.silver} className="font-plex">
        {label}
      </text>
    </svg>
  );
}