import { CANADA_OUTLINES, LAYER_HEX, MAP_BOUNDS, pt } from "@/lib/canadaOutline";
import { networkCopy } from "@/components/sdr/heroNetworkCopy";

const path = CANADA_OUTLINES.map((poly) => poly.map(([lat, lng], i) => { const p = pt(lat, lng); return `${i ? "L" : "M"}${p.x},${-p.y}`; }).join(" ") + " Z").join(" ");
export default function HeroCanadaMap2D({ nodes = [], links = [], focus, selectedKey, onSelect, lang = "en" }) {
  const t = networkCopy(lang);
  const width = MAP_BOUNDS.maxX - MAP_BOUNDS.minX + 4, height = MAP_BOUNDS.maxY - MAP_BOUNDS.minY + 3;
  const center = focus ? pt(focus.lat, focus.lng) : null;
  const viewBox = center ? `${center.x - width * 0.28} ${-center.y - height * 0.32} ${width * 0.56} ${height * 0.64}` : `${MAP_BOUNDS.minX - 2} ${-MAP_BOUNDS.maxY - 1.5} ${width} ${height}`;
  return (
    <div className="absolute inset-0 p-2" data-testid="hero-canada-2d">
      <svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="xMidYMid meet" role="group" aria-label={t.mapLabel}>
        <path d={path} className="fill-market-line stroke-market-muted" strokeWidth="0.12" strokeLinejoin="round" />
        {links.map((link, i) => { const a = pt(...link.a), b = pt(...link.b); return <path key={i} d={`M${a.x},${-a.y} Q${(a.x + b.x) / 2},${-(a.y + b.y) / 2 - 1} ${b.x},${-b.y}`} fill="none" className="stroke-market-accent" strokeWidth="0.12"><title>{lang === "fr" ? "Territoire explicite partagé" : "Shared explicit contractor territory"}</title></path>; })}
        {nodes.map((node) => {
          const p = pt(node.lat, node.lng), color = LAYER_HEX[node.layer] || LAYER_HEX.unknown;
          return <g key={node.key} role="button" tabIndex={0} aria-label={`${t.explore} ${node.name}`} onClick={() => onSelect(node)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(node); } }} className="cursor-pointer focus:outline-none focus:[&_circle]:stroke-market-ink">
            <title>{`${t.explore} ${node.name}`}</title>
            <circle cx={p.x} cy={-p.y} r="0.8" fill="transparent" />
            <circle cx={p.x} cy={-p.y} r={selectedKey === node.key ? "0.44" : "0.26"} fill={selectedKey === node.key ? LAYER_HEX.selected : color} className="stroke-market-bg" strokeWidth="0.1" />
          </g>;
        })}
      </svg>
    </div>
  );
}