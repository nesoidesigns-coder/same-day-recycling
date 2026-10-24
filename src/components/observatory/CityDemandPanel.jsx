import { X, MapPin, Users, Truck, Activity, ShieldCheck, AlertTriangle } from 'lucide-react';
import { fmtTime } from './useObservatory';

// Drill-down panel for one selected city on the Observatory demand map.
// Every number comes from verified observatoryFeed records — nothing estimated.
export default function CityDemandPanel({ city, onClose }) {
  if (!city) return null;
  const { row, events } = city;
  const covered = (row.contractors || 0) > 0;
  const demandTotal = (row.demand_events || 0) + (row.public_opportunities || 0);

  // Service categories actually observed in the city's recent feed events.
  const services = {};
  for (const e of events) {
    if (!e.service) continue;
    services[e.service] = (services[e.service] || 0) + 1;
  }
  const serviceList = Object.entries(services).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="rounded-2xl border border-[#187B65]/40 bg-[#0a2e25] p-4 sm:p-5" role="dialog" aria-label={`${row.city} demand detail`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#54D9AE]"><MapPin className="h-3 w-3" />City drill-down</p>
          <h4 className="mt-0.5 text-lg font-extrabold text-market-ink">{row.city}{row.province_code ? `, ${row.province_code}` : ''}</h4>
          <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${covered ? 'bg-[#187B65]/25 text-[#54D9AE]' : 'bg-amber-400/15 text-amber-300'}`}>
            {covered ? <ShieldCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
            {covered ? 'Covered by verified contractor territory' : 'Unmatched demand — contractor recruitment area'}
          </span>
        </div>
        <button onClick={onClose} aria-label="Close city detail" className="rounded-full p-1.5 text-market-muted hover:bg-white/10 hover:text-market-ink"><X className="h-4 w-4" /></button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { icon: Activity, label: 'Demand events (30d)', value: row.demand_events || 0 },
          { icon: MapPin, label: 'Public opportunities', value: row.public_opportunities || 0 },
          { icon: Users, label: 'Verified contractors', value: row.contractors || 0 },
          { icon: Truck, label: 'Daily truck capacity', value: row.truck_capacity || 0 },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-market-line bg-market-bg px-3 py-2.5">
            <p className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-market-muted"><Icon className="h-3 w-3 text-[#54D9AE]" />{label}</p>
            <p className="mt-0.5 text-xl font-extrabold text-market-ink">{value}</p>
          </div>
        ))}
      </div>

      {serviceList.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-market-muted">Observed service activity</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {serviceList.map(([service, n]) => (
              <span key={service} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-market-ink">{service} <span className="text-market-muted">×{n}</span></span>
            ))}
          </div>
        </div>
      )}

      {events.length > 0 ? (
        <div className="mt-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-market-muted">Recent verified events</p>
          <ul className="mt-1.5 space-y-1.5">
            {events.slice(0, 5).map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs">
                <span className="font-bold text-market-ink">{e.category_label}</span>
                <span className="text-market-muted">{fmtTime(e.event_at)} · {e.layer}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-xs text-market-muted">No verified activity recorded in the current feed window{demandTotal > 0 ? ' — historical aggregate counts shown above' : ''}.</p>
      )}
    </div>
  );
}