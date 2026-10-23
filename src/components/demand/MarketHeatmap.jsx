import { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import { CITIES } from '@/lib/cities';
import 'leaflet/dist/leaflet.css';

const CENTERS = {BC:[54,-125],AB:[54,-115],SK:[54,-106],MB:[55,-98],ON:[50,-85],QC:[52,-71],NB:[46.5,-66.5],NS:[45,-63],PE:[46.4,-63.3],NL:[53,-60],YT:[64,-135],NT:[65,-120],NU:[67,-95]};
const norm = (s) => String(s || '').toLowerCase();
export default function MarketHeatmap({ data, onSelect }) {
  const [level,setLevel] = useState('province');
  const rows = level === 'province' ? data.provinces : data.cities;
  const markers = rows.map((r) => ({...r,coord:level === 'province' ? CENTERS[r.key] : (() => {const c=CITIES.find((c) => norm(c.name) === norm(r.name));return c ? [c.lat,c.lng] : null;})()})).filter((r) => r.coord);
  const max = Math.max(1,...markers.map((r) => r.value));
  return <section className="overflow-hidden rounded-2xl border border-market-line bg-market-surface">
    <div className="p-5"><h3 className="font-bold">Canadian geographic demand heatmap</h3><p className="mt-1 text-xs text-market-muted">{data.engine} · {data.regional_period || 'No reporting period'} · colour intensity is relative to the largest recorded regional estimate, not market share.</p>
      <div className="mt-3 flex gap-2">{['province','city'].map((key) => <button key={key} aria-pressed={level === key} onClick={() => setLevel(key)} className={`rounded-full border px-4 py-2 text-xs font-bold ${level === key ? 'border-market-accent text-market-accent' : 'border-market-line text-market-muted'}`}>{key === 'province' ? 'Provinces' : 'Cities'}</button>)}</div>
    </div>
    {markers.length ? <div className="relative z-0 h-80"><MapContainer center={[57,-100]} zoom={3} minZoom={2} maxZoom={9} scrollWheelZoom={false} className="h-full w-full bg-market-bg">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'/>
      {markers.map((r) => <CircleMarker key={r.key} center={r.coord} radius={10+24*Math.sqrt(r.value/max)} pathOptions={{color:'hsl(var(--market-accent))',fillColor:'hsl(var(--market-accent))',fillOpacity:0.15+0.65*r.value/max,weight:1}} eventHandlers={{click:() => onSelect(r)}}><Tooltip><strong>{r.name}</strong><br/>{r.value.toLocaleString('en-CA')} estimated searches<br/>{r.period} · {r.sources.join(' · ')}<br/>{level === 'province' ? 'Province-level estimate at region centre' : 'Source-reported city estimate'}</Tooltip></CircleMarker>)}
    </MapContainer></div> : <p className="px-5 pb-8 text-sm text-market-muted">No geolocatable {level}-level estimates on file. Missing regions are not zero demand.</p>}
    <p className="p-5 text-[11px] leading-relaxed text-market-muted">Select a region to drill down. Province markers represent the whole province, not local readings at the marker. National values are never distributed into regions. Cities without known coordinates remain in the rankings below.</p>
  </section>;
}