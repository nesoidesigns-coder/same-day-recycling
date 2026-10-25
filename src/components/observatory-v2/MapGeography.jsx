import { project } from '@/components/observatory-v2/observatoryData';

const LABELS = [['YT', -136, 65], ['NT', -121, 66], ['NU', -94, 69], ['BC', -125, 55], ['AB', -114.8, 56], ['SK', -106, 55], ['MB', -98, 55], ['ON', -86, 51], ['QC', -71, 54], ['NL', -60, 54]];
const path = coords => coords.map(([lng, lat], i) => { const p = project(lng, lat); return `${i ? 'L' : 'M'}${p.x},${p.y}`; }).join(' ');
const graticules = [...[-140, -120, -100, -80, -60].map(lng => path(Array.from({ length: 37 }, (_, i) => [lng, 42 + i]))), ...[50, 60, 70, 80].map(lat => path(Array.from({ length: 48 }, (_, i) => [-145 + i * 2, lat])))];
export default function MapGeography({ geography, province, onProvince }) {
  return (
    <>
      <defs><pattern id="obs-hatch" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M0 7L7 0" className="stroke-obs-line/10" strokeWidth="0.5" /></pattern><clipPath id="obs-land">{geography.provinces.map(p => <path key={p.code} d={p.paths.join('')} />)}</clipPath></defs>
      <g fill="none" className="stroke-obs-line/15" strokeWidth="0.5">{graticules.map((d, i) => <path key={i} d={d} />)}</g>
      {geography.provinces.map(p => <path key={p.code} d={p.paths.join('')} fillRule="evenodd" vectorEffect="non-scaling-stroke" className={province === p.code ? 'obs-province obs-province-selected' : 'obs-province'} onClick={() => onProvince(p.code)}><title>{p.name} · select to explore</title></path>)}
      <rect x="260" y="0" width="590" height="520" fill="url(#obs-hatch)" clipPath="url(#obs-land)" pointerEvents="none" />
      <g pointerEvents="none" className="fill-obs-cyan/70 font-mono" fontSize="9" letterSpacing="3">{LABELS.map(([code, lng, lat]) => { const p = project(lng, lat); return <text key={code} x={p.x} y={p.y} textAnchor="middle">{code}</text>; })}</g>
      <text x="575" y="303" fontSize="10" letterSpacing="2" className="fill-obs-cyan/45 font-mono" textAnchor="middle">HUDSON BAY</text>
      <text x="775" y="210" fontSize="9" letterSpacing="3" className="fill-obs-cyan/35 font-mono">ATLANTIC</text>
      <text x="244" y="340" fontSize="9" letterSpacing="3" className="fill-obs-cyan/35 font-mono" transform="rotate(-65 244 340)">PACIFIC OCEAN</text>
    </>
  );
}