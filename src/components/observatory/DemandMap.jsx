import { Fragment } from 'react';
import { MapContainer, TileLayer, Circle, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { CITIES } from '@/lib/cities';

const norm = (s) => String(s || '').trim().toLowerCase();
const CITY_BY_NAME = new Map(CITIES.map((c) => [norm(c.name), c]));

const PROVINCE_COORDS = {
  BC: [54.5, -125], AB: [53.5, -113.5], SK: [52.7, -106], MB: [50.2, -97],
  ON: [50, -85], QC: [52, -72], NB: [46.5, -66.5], NS: [44.8, -63.5],
  PE: [46.4, -63.2], NL: [49.5, -56], NT: [64, -116], YT: [62, -136], NU: [68, -100],
};

// Interactive Canadian demand map. Coverage comes from verified contractor
// territories (home city + confirmed municipalities) — one contractor can
// cover many cities, and search activity is never presented as availability.
export default function DemandMap({ data }) {
  const regions = data?.regions || [];

  return (
    <div className="rounded-3xl border border-market-line bg-market-surface p-4 sm:p-6">
      <h3 className="text-sm font-extrabold text-market-ink">Canadian Demand &amp; Coverage Map</h3>
      <p className="mt-0.5 text-xs text-market-muted">
        Green = verified contractor territory (actual confirmed coverage). Markers show verified demand and public opportunities. Amber ring = demand with no verified contractor. Search interest alone never implies availability.
      </p>
      <div className="mt-3 overflow-hidden rounded-2xl border border-market-line h-[380px] sm:h-[460px] relative z-0">
        <MapContainer center={[53, -100]} zoom={4} minZoom={3} scrollWheelZoom={false} className="w-full h-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {regions.map((r) => {
            const city = CITY_BY_NAME.get(norm(r.city));
            const center = city ? [city.lat, city.lng] : PROVINCE_COORDS[r.province_code];
            if (!center) return null;
            const covered = r.contractors > 0;
            const demandTotal = (r.demand_events || 0) + (r.public_opportunities || 0);
            const radius = city ? (city.radius || 12000) : 120000;
            return (
              <Fragment key={r.city}>
                {covered && (
                  <Circle center={center} radius={radius} pathOptions={{ color: '#187B65', fillColor: '#187B65', fillOpacity: 0.12, weight: 1.5 }} />
                )}
                {!covered && demandTotal > 0 && (
                  <Circle center={center} radius={radius} pathOptions={{ color: '#fbbf24', fillColor: '#fbbf24', fillOpacity: 0.06, weight: 1, dashArray: '4 6' }} />
                )}
                <CircleMarker
                  center={center}
                  radius={Math.min(16, 5 + demandTotal * 2 + (r.contractors || 0))}
                  pathOptions={{ color: covered ? '#54D9AE' : '#fbbf24', fillColor: covered ? '#187B65' : '#b45309', fillOpacity: 0.75, weight: 1 }}
                >
                  <Popup>
                    <div className="text-xs" style={{ fontFamily: 'system-ui, sans-serif' }}>
                      <p className="font-bold text-[#102B2A]">{r.city}{r.province_code ? `, ${r.province_code}` : ''}</p>
                      <p>Verified demand events (30d): <b>{r.demand_events || 0}</b></p>
                      <p>Public opportunities (open): <b>{r.public_opportunities || 0}</b></p>
                      <p>Verified contractors: <b>{r.contractors || 0}</b></p>
                      <p>Daily truck capacity: <b>{r.truck_capacity || 0}</b></p>
                      <p className="mt-1 font-semibold">
                        {covered ? 'Covered by verified territory' : r.demandTotal === 0 ? 'No verified demand recorded' : 'Unmatched demand — recruitment area'}
                      </p>
                    </div>
                  </Popup>
                </CircleMarker>
              </Fragment>
            );
          })}
        </MapContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-wider text-market-muted">
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#187B65]" /> Verified coverage</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#b45309]" /> Demand marker (size = volume)</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border border-amber-300" /> Unmatched demand</span>
      </div>
    </div>
  );
}