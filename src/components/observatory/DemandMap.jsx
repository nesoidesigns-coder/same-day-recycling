import { Fragment, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Circle, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Radio, Loader2 } from 'lucide-react';
import { CITIES } from '@/lib/cities';
import CityDemandPanel from './CityDemandPanel';

const norm = (s) => String(s || '').trim().toLowerCase();
const CITY_BY_NAME = new Map(CITIES.map((c) => [norm(c.name), c]));

const PROVINCE_COORDS = {
  BC: [54.5, -125], AB: [53.5, -113.5], SK: [52.7, -106], MB: [50.2, -97],
  ON: [50, -85], QC: [52, -72], NB: [46.5, -66.5], NS: [44.8, -63.5],
  PE: [46.4, -63.2], NL: [49.5, -56], NT: [64, -116], YT: [62, -136], NU: [68, -100],
};

const DAY_MS = 86400000;

// Basemap tile sources, in order. OpenStreetMap's public server is keyless and
// used lightly per its usage policy; the OSM community server (FOSSGIS) is the
// one approved fallback. After both fail we stop — no endless tile retries.
const TILE_SOURCES = [
  { name: 'OpenStreetMap', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' },
  { name: 'OSM Community', url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png' },
];

// Keeps the map centered on a selected city when the drill-down opens.
function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, Math.max(map.getZoom(), 5), { duration: 0.8 });
  }, [center, map]);
  return null;
}

// Interactive Canadian demand map: real-time regional demand and service
// activity from verified Observatory records (auto-refreshes every 60s).
// Layer toggles — Demand markers / Coverage zones / Unmatched demand.
// City markers size with verified demand; cities with activity in the last
// 24h pulse. Clicking a city opens a drill-down panel. Search interest alone
// never implies availability.
export default function DemandMap({ data }) {
  const [layers, setLayers] = useState({ demand: true, coverage: true, unmatched: true });
  const [selected, setSelected] = useState(null); // { row, center, events }

  // Basemap health: log every failed tile, try the next approved source after
  // three failures, and stop after the last one instead of retrying forever.
  const [tileIdx, setTileIdx] = useState(0);
  const [tileErrs, setTileErrs] = useState(0);
  const [basemapFailed, setBasemapFailed] = useState(false);
  const onTileError = (e) => {
    console.warn('[DemandMap] basemap tile failed:', e?.tile?.src || 'unknown tile', e?.error?.message || 'request failed');
    if (tileErrs + 1 >= 3) {
      if (tileIdx < TILE_SOURCES.length - 1) {
        setTileIdx(tileIdx + 1);
        setTileErrs(0);
        setBasemapFailed(false);
      } else {
        setBasemapFailed(true);
      }
    } else {
      setTileErrs(tileErrs + 1);
    }
  };

  const regions = data?.regions || [];
  const feed = data?.feed || [];

  // Real-time activity per city from the verified feed (last 24h).
  const recentByCity = useMemo(() => {
    const now = Date.now();
    const map = {};
    for (const e of feed) {
      const t = new Date(e.event_at || 0).getTime();
      if (!e.city || !t || now - t > DAY_MS) continue;
      (map[norm(e.city)] = map[norm(e.city)] || []).push(e);
    }
    return map;
  }, [feed]);

  const events24h = Object.values(recentByCity).reduce((n, list) => n + list.length, 0);

  const toggle = (key) => setLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  const selectCity = (r, center) => {
    const events = feed
      .filter((e) => norm(e.city) === norm(r.city))
      .sort((a, b) => new Date(b.event_at || 0) - new Date(a.event_at || 0))
      .slice(0, 8);
    setSelected({ row: r, center, events });
  };

  const toggleChip = (key, label, dotClass) => (
    <button
      onClick={() => toggle(key)}
      aria-pressed={layers[key]}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${layers[key] ? 'border-[#187B65]/60 bg-[#187B65]/20 text-[#54D9AE]' : 'border-market-line bg-transparent text-market-muted hover:text-market-ink'}`}
    >
      <span className={`h-2 w-2 rounded-full ${dotClass} ${layers[key] ? '' : 'opacity-40'}`} />
      {label}
    </button>
  );

  return (
    <div className="rounded-3xl border border-market-line bg-market-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-market-ink">Interactive Canadian Demand Map</h3>
          <p className="mt-0.5 text-xs text-market-muted">
            Real-time regional junk removal demand and service activity from verified records. Tap a city for its drill-down. Search interest alone never implies availability.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0a2e25] px-2.5 py-1 text-[10px] font-bold text-[#54D9AE]">
          <Radio className="h-3 w-3" /> {events24h} verified event{events24h === 1 ? '' : 's'} · last 24h
        </span>
      </div>

      {/* Layer controls */}
      <div className="mt-3 flex flex-wrap gap-2">
        {toggleChip('demand', 'Demand & activity', 'bg-[#54D9AE]')}
        {toggleChip('coverage', 'Verified coverage', 'bg-[#187B65]')}
        {toggleChip('unmatched', 'Unmatched demand', 'bg-amber-300')}
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-market-line h-[420px] sm:h-[500px] relative z-0">
        <MapContainer center={[53, -100]} zoom={4} minZoom={3} scrollWheelZoom={false} className="w-full h-full">
          <TileLayer
            key={tileIdx}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={TILE_SOURCES[tileIdx].url}
            maxZoom={19}
            eventHandlers={{ tileerror: onTileError }}
          />
          <FlyTo center={selected?.center} />
          {regions.map((r) => {
            const city = CITY_BY_NAME.get(norm(r.city));
            const center = city ? [city.lat, city.lng] : PROVINCE_COORDS[r.province_code];
            if (!center) return null;
            const covered = r.contractors > 0;
            const demandTotal = (r.demand_events || 0) + (r.public_opportunities || 0);
            const recent = recentByCity[norm(r.city)] || [];
            const radius = city ? (city.radius || 12000) : 120000;
            const unmatchedVisible = layers.unmatched && !covered && demandTotal > 0;
            return (
              <Fragment key={r.city}>
                {layers.coverage && covered && (
                  <Circle center={center} radius={radius} pathOptions={{ color: '#187B65', fillColor: '#187B65', fillOpacity: 0.12, weight: 1.5 }} />
                )}
                {unmatchedVisible && (
                  <Circle center={center} radius={radius} pathOptions={{ color: '#fbbf24', fillColor: '#fbbf24', fillOpacity: 0.06, weight: 1, dashArray: '4 6' }} />
                )}
                {layers.demand && (
                  <CircleMarker
                    center={center}
                    radius={Math.min(16, 5 + demandTotal * 2 + (r.contractors || 0))}
                    pathOptions={{
                      color: recent.length ? '#54D9AE' : covered ? '#187B65' : '#fbbf24',
                      fillColor: covered ? '#187B65' : '#b45309',
                      fillOpacity: 0.8,
                      weight: recent.length ? 2.5 : 1,
                      className: recent.length ? 'network-pulse' : undefined,
                    }}
                    eventHandlers={{ click: () => selectCity(r, center) }}
                  >
                    <Popup>
                      <div className="text-xs" style={{ fontFamily: 'system-ui, sans-serif' }}>
                        <p className="font-bold text-[#102B2A]">{r.city}{r.province_code ? `, ${r.province_code}` : ''}</p>
                        <p>Verified demand events (30d): <b>{r.demand_events || 0}</b></p>
                        <p>Public opportunities (open): <b>{r.public_opportunities || 0}</b></p>
                        <p>Verified contractors: <b>{r.contractors || 0}</b></p>
                        <p>Daily truck capacity: <b>{r.truck_capacity || 0}</b></p>
                        {recent.length > 0 && <p className="mt-1 font-semibold text-[#187B65]">{recent.length} verified event{recent.length === 1 ? '' : 's'} in the last 24h</p>}
                        <p className="mt-1 font-semibold">
                          {covered ? 'Covered by verified territory' : demandTotal === 0 ? 'No verified demand recorded' : 'Unmatched demand — recruitment area'}
                        </p>
                      </div>
                    </Popup>
                  </CircleMarker>
                )}
              </Fragment>
            );
          })}
        </MapContainer>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-wider text-market-muted">
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#187B65]" /> Covered territory marker</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#54D9AE]" /> Live activity (24h pulse)</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#b45309]" /> Demand marker (size = volume)</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border border-amber-300" /> Unmatched demand</span>
      </div>

      {basemapFailed && (
        <p role="alert" className="mt-3 flex items-center gap-2 rounded-2xl border border-amber-400/40 bg-amber-400/10 px-3.5 py-2.5 text-xs font-semibold text-amber-200">
          The map's background image isn't loading right now. All demand markers, layers and city drill-downs still work — please try again shortly.
        </p>
      )}

      {regions.length === 0 && (
        <p role="status" className="mt-3 flex items-center gap-2 text-xs text-market-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> No verified regional activity yet — the map fills in as records arrive.
        </p>
      )}

      {selected && <div className="mt-3"><CityDemandPanel city={selected} onClose={() => setSelected(null)} /></div>}
    </div>
  );
}