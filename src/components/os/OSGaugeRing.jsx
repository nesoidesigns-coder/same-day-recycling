import { polar, OS_COLORS } from "./gaugeCore";

// Reference scale layer: hairline ring(s), minute tick marks and optional
// cardinal spokes. Ticks and spokes describe real measurement structure —
// a ring without data beneath it is rendered dashed and quiet, never as a
// decorative progress arc.
export default function OSGaugeRing({
  R = 246,
  radius = 1,
  ticks = 0,
  tickMajorEvery = 3,
  tickLengthMinor = 6,
  tickLengthMajor = 11,
  spokes = null,
  dash = null,
  draw = false,
  ringOpacity = 0.3,
  width = 1,
}) {
  const r = R * radius;
  return (
    <>
      <circle
        cx={260}
        cy={260}
        r={r}
        fill="none"
        stroke={OS_COLORS.hairline}
        strokeOpacity={ringOpacity}
        strokeWidth={width}
        strokeDasharray={dash}
        className={draw ? "cine-draw" : undefined}
      />
      {ticks > 0 &&
        Array.from({ length: ticks }, (_, i) => {
          const deg = (360 / ticks) * i;
          const major = i % tickMajorEvery === 0;
          const len = major ? tickLengthMajor : tickLengthMinor;
          const [x1, y1] = polar(r - len, deg);
          const [x2, y2] = polar(r, deg);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={OS_COLORS.silver} strokeOpacity={major ? 0.4 : 0.15} strokeWidth="0.75" />;
        })}
      {spokes &&
        Array.from({ length: 8 }, (_, i) => {
          const [x1, y1] = polar(R * spokes[0], i * 45 - 90);
          const [x2, y2] = polar(R * spokes[1], i * 45 - 90);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={OS_COLORS.hairline} strokeOpacity="0.12" strokeWidth="0.75" />;
        })}
    </>
  );
}