import { MAJOR_CITIES, keyOf } from '@/components/observatory-v2/observatoryData';

const OFFSET = { Vancouver: [-12, 20], Calgary: [10, 16], Edmonton: [10, -9], Toronto: [-13, 20], Ottawa: [-10, -11], Montreal: [12, 8], Halifax: [10, 17], "St. John's": [10, -6] };
export default function MapNodes({ locations, selected, onCity, layer, scale, hover, setHover }) {
  return locations.filter(c => scale > 1.4 || MAJOR_CITIES.includes(c.name) || c.state === 'same_day' || c.state === 'matching' || c.observations).map(c => {
    const active = selected === c.name || hover === c.name, label = active || MAJOR_CITIES.includes(c.name);
    const [dx, dy] = OFFSET[c.name] || [9, -10];
    const color = c.state === 'same_day' ? 'text-obs-mint' : c.state === 'matching' ? 'text-obs-amber' : 'text-obs-muted';
    return <g key={c.name} transform={`translate(${c.x} ${c.y}) scale(${1 / scale})`} role="button" tabIndex={0} aria-label={`${c.name}: ${c.state === 'same_day' ? 'verified provider' : c.state === 'matching' ? 'provider matching' : 'explore location'}`} aria-pressed={selected === c.name} onClick={() => onCity(c.name)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCity(c.name); } }} onMouseEnter={() => setHover(c.name)} onMouseLeave={() => setHover('')} className={`obs-map-node cursor-pointer outline-none ${color}`}>
      <title>{c.name} · {c.observations == null ? 'No city count returned in current sample' : `${c.observations} recorded signals in this sample`}</title>
      <circle r="16" fill="transparent" />
      {layer === 'observations' && c.observations > 0 && <circle r={9 + Math.min(15, Math.sqrt(c.observations))} className="fill-obs-cyan/15 stroke-obs-cyan/55" strokeWidth="1" />}
      {active && <><circle r="11" fill="none" className="stroke-obs-mint" strokeWidth="1" /><path d="M-17 0H-13M13 0H17M0 -17V-13M0 13V17" className="stroke-obs-mint" fill="none" /></>}
      <circle r={active ? 4 : 3} fill={c.state === 'same_day' || c.state === 'matching' || active ? 'currentColor' : 'var(--obs-map-ocean)'} stroke="currentColor" strokeWidth="1.5" />
      {label && <text x={dx} y={dy} textAnchor={dx < 0 ? 'end' : 'start'} className={active ? 'obs-city-label fill-obs-ink' : 'obs-city-label fill-obs-muted'} fontSize="11" fontWeight={active ? 600 : 400}>{c.name}</text>}
      <circle className="obs-node-focus" r="15" fill="none" stroke="currentColor" strokeWidth="2" opacity="0" />
    </g>;
  });
}