import { useMemo, useState } from "react";
import { CANADA_OUTLINES, pt, MAP_BOUNDS, GEOGRAPHY_SOURCE } from "@/lib/canadaOutline";

const MINT = "#27D5B0";
const SILVER = "#D9E5E0";

const statusFill = (status) => {
  if (status === "same_day") return MINT;
  if (status === "matching") return "#FFFFFF";
  if (status === "recruiting") return "#172B28";
  return SILVER;
};

// CANADA CONNECTED — interactive geographic network prototype. Light neutral
// landmass (Natural Earth 1:110m, public domain), precise markers only where
// real coverage relationships exist, and thin corridor lines between served
// locations in the same province. No invented activity, no decorative 3D.
export default function CanadaNetworkMap({ locations, selected, onSelect, hoverable = true }) {
  const [hover, setHover] = useState(null);

  const pad = 1.2;
  const view = useMemo(() => ({
    x: MAP_BOUNDS.minX - pad, y: MAP_BOUNDS.minY - pad,
    w: MAP_BOUNDS.maxX - MAP_BOUNDS.minX + pad * 2,
    h: MAP_BOUNDS.maxY - MAP_BOUNDS.minY + pad * 2,
  }), []);

  const paths = useMemo(() => CANADA_OUTLINES.map((poly) =>
    poly.map(([lat, lng], i) => {
      const p = pt(lat, lng);
      return `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    }).join(" ") + " Z"
  ), []);

  // Corridor lines: served locations linked to their nearest served neighbour
  // in the same province — a real, verifiable relationship (same network,
  // same province). Never drawn between unrelated or unserved locations.
  const links = useMemo(() => {
    const byProvince = {};
    locations.forEach((l) => { (byProvince[l.province || "?"] = byProvince[l.province || "?"] || []).push(l); });
    const out = [];
    Object.values(byProvince).forEach((group) => {
      group.forEach((a) => {
        let best = null, bestD = Infinity;
        group.forEach((b) => {
          if (a === b) return;
          const d = (a.pt.x - b.pt.x) ** 2 + (a.pt.y - b.pt.y) ** 2;
          if (d < bestD) { bestD = d; best = b; }
        });
        if (best) out.push([a.pt, best.pt]);
      });
    });
    return out;
  }, [locations]);

  const sel = locations.find((l) => l.name === selected);
  const k = sel ? 2.2 : 1;
  const tx = sel ? view.x + view.w / 2 - k * sel.pt.x : 0;
  const ty = sel ? view.y + view.h / 2 - k * sel.pt.y : 0;

  return (
    <div className="relative">
      <svg viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} className="w-full h-auto" role="img" aria-label="Interactive map of Canada's service network">
        {/* landmass */}
        {paths.map((d, i) => (
          <path key={i} d={d} fill="#EFF5F2" stroke={SILVER} strokeWidth="0.04" />
        ))}
        <g
          className="transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transformOrigin: `${view.x + view.w / 2}px ${view.y + view.h / 2}px` }}
          transform={`translate(${tx} ${ty}) scale(${k})`}
        >
          {links.map(([a, b], i) => {
            const active = sel && (a === sel.pt || b === sel.pt);
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={active ? MINT : "rgba(39,213,176,0.35)"} strokeWidth={active ? 0.055 : 0.035} />;
          })}
          {locations.map((l) => {
            const isSel = l.name === selected;
            const isHover = l.name === hover;
            return (
              <g key={l.name} onClick={() => onSelect(isSel ? null : l.name)}
                onMouseEnter={() => hoverable && setHover(l.name)} onMouseLeave={() => setHover(null)}
                className={hoverable ? "cursor-pointer" : ""}>
                {isSel && <circle cx={l.pt.x} cy={l.pt.y} r="0.16" fill={MINT} opacity="0.25" className="animate-ping motion-reduce:animate-none" />}
                <circle cx={l.pt.x} cy={l.pt.y} r={isSel ? 0.1 : 0.065}
                  fill={statusFill(l.status)} stroke={isSel ? "#123C32" : "#FFFFFF"} strokeWidth="0.03"
                  className="transition-all duration-300 motion-reduce:transition-none" />
                {(isSel || isHover) && (
                  <text x={l.pt.x} y={l.pt.y - 0.22} textAnchor="middle" fontSize="0.22" fontWeight="600" fill="#123C32" style={{ paintOrder: "stroke" }} stroke="#FFFFFF" strokeWidth="0.06">{l.name}</text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-plex text-[10px] text-[#123C32]/70">
        <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: MINT }} /> Same-day available</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full border" style={{ borderColor: "#123C32" }} /> Provider matching</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: "#172B28" }} /> Recruiting providers</span>
        <span>Corridor lines link served locations in the same province</span>
        <span className="text-[#123C32]/40">Geography: Natural Earth 1:110m ({GEOGRAPHY_SOURCE.replace("https://", "")})</span>
      </div>
    </div>
  );
}