import { CANADA_OUTLINES, PROJ, LAYER_HEX } from "@/lib/canadaOutline";

// Static 2D Canada map — the WebGL fallback for the hero background. Same
// projection, same outline, same layer colours and region selection as the
// 3D scene, rendered as plain SVG (works in every browser).
const p = (lat, lng) => [(lng - PROJ.lng0) * PROJ.s, (PROJ.lat0 - lat) * PROJ.s];

export default function HeroCanadaMap2D({ nodes = [], onSelect }) {
  const path = CANADA_OUTLINES
    .map((poly) => poly.map(([lat, lng], i) => `${i === 0 ? "M" : "L"}${p(lat, lng).join(",")}`).join(" ") + " Z")
    .join(" ");
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4" data-testid="hero-canada-2d">
      <svg
        width="100%"
        height="100%"
        viewBox="-24 -16.5 48 25"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Map of Canada showing the Same Day Recycling service network"
        onClick={(e) => {
          const node = nodes.find((n) => n.key === e.target.dataset?.city);
          if (node) onSelect?.(node);
        }}
      >
        <path d={path} fill="#155e4e" stroke="#54d9ae" strokeWidth="0.25" strokeLinejoin="round" />
        {nodes.map((n) => {
          const [x, y] = p(n.lat, n.lng);
          return (
            <g key={n.key} style={{ cursor: "pointer" }}>
              <circle data-city={n.key} cx={x} cy={y} r="1" fill={LAYER_HEX[n.layer] || LAYER_HEX.verified} opacity="0.3" />
              <circle data-city={n.key} cx={x} cy={y} r="0.45" fill={LAYER_HEX[n.layer] || LAYER_HEX.verified} stroke="#0a2e25" strokeWidth="0.08" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}