import { keyOf } from '@/components/observatory-v2/observatoryData';

export default function MapRelationships({ links, locations, selected, layer }) {
  if (layer !== 'coverage') return null;
  return links.map((link, i) => {
    const a = locations.find(c => keyOf(c.name) === keyOf(link.from));
    const b = locations.find(c => keyOf(c.name) === keyOf(link.to));
    if (!a || !b) return null;
    const active = selected && [a.name, b.name].includes(selected);
    return <path key={i} d={`M${a.x} ${a.y}Q${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - Math.min(24, Math.abs(a.x - b.x) / 7)} ${b.x} ${b.y}`} fill="none" className={active ? 'stroke-obs-mint/70' : 'stroke-obs-mint/25'} strokeWidth={active ? 1.4 : 0.75} vectorEffect="non-scaling-stroke"><title>Confirmed shared contractor territory: {a.name} – {b.name}</title></path>;
  });
}