// Public trend-analysis series: monthly search demand (industry-wide,
// deduplicated estimates) overlaid with Same Day Recycling's service volume
// (bookings + nationwide requests), per city. Aggregate-only — no PII, and
// internal_test records are excluded from the service layer.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { dedupeObservations, CATEGORY_LABELS } from '../../shared/demand.ts';

const normCity = (s) => String(s || '').trim().toLowerCase();
const monthOf = (iso) => String(iso || '').slice(0, 7);

function monthRange(periods) {
  const valid = periods.filter((p) => /^\d{4}-\d{2}$/.test(p)).sort();
  if (!valid.length) return [];
  const out = [];
  let [y, m] = valid[0].split('-').map(Number);
  const [ey, em] = valid[valid.length - 1].split('-').map(Number);
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    const [obsPage, bookingPage, nreqPage] = await Promise.all([
      base44.asServiceRole.entities.DemandObservation.list({ limit: 2000 }),
      base44.asServiceRole.entities.Booking.filter({ record_type: 'service' }, { limit: 1000 }),
      base44.asServiceRole.entities.NationalRequest.filter({ record_type: 'service' }, { limit: 1000 }),
    ]);
    const obs = obsPage.items || [];
    const bookings = bookingPage.items || [];
    const nreqs = nreqPage.items || [];

    const deduped = dedupeObservations(obs);

    // Demand layer: city-level observations only, summed per period.
    const demandByCity = new Map(); // cityKey -> {city, province_code, periods: Map(period -> {demand, rows, basis, sources, updated})}
    for (const r of deduped) {
      if (r.geo_type !== 'city' || !r.city) continue;
      const key = normCity(r.city);
      if (!key) continue;
      if (!demandByCity.has(key)) {
        demandByCity.set(key, { city: String(r.city).trim(), province_code: String(r.province_code || '').toUpperCase(), periods: new Map() });
      }
      const entry = demandByCity.get(key);
      if (!entry.province_code && r.province_code) entry.province_code = String(r.province_code).toUpperCase();
      const period = r.period || '';
      if (!entry.periods.has(period)) entry.periods.set(period, { demand: 0, rows: 0, index_only: 0, basis: new Set(), sources: new Set(), updated: '' });
      const p = entry.periods.get(period);
      p.rows += 1;
      const vol = Number(r.est_monthly_volume) || 0;
      if (vol > 0) p.demand += vol; else p.index_only += 1;
      if (r.volume_basis) p.basis.add(r.volume_basis);
      if (r.source) p.sources.add(r.source);
      if (r.last_updated && String(r.last_updated) > p.updated) p.updated = String(r.last_updated);
    }

    // Service layer: bookings + nationwide requests per city-month.
    const serviceByCity = new Map(); // cityKey -> Map(period -> {bookings, national_requests})
    const bump = (city, iso, field) => {
      const key = normCity(city);
      if (!key || !iso) return;
      if (!serviceByCity.has(key)) serviceByCity.set(key, new Map());
      const periods = serviceByCity.get(key);
      const period = monthOf(iso);
      if (!periods.has(period)) periods.set(period, { bookings: 0, national_requests: 0 });
      periods.get(period)[field] += 1;
    };
    for (const b of bookings) bump(b.city, b.created_date, 'bookings');
    for (const n of nreqs) bump(n.city, n.created_date, 'national_requests');

    // Union of cities from both layers.
    const keys = new Set([...demandByCity.keys(), ...serviceByCity.keys()]);
    const cities = [];
    for (const key of keys) {
      const d = demandByCity.get(key);
      const s = serviceByCity.get(key);
      const allPeriods = new Set([...(d ? [...d.periods.keys()] : []), ...(s ? [...s.periods.keys()] : [])]);
      const range = monthRange([...allPeriods]);
      const series = range.map((period) => {
        const dp = d ? d.periods.get(period) : null;
        const sp = s ? s.get(period) : null;
        return {
          period,
          demand: dp && dp.demand > 0 ? dp.demand : null,
          index_only: dp ? dp.index_only : 0,
          bookings: sp ? sp.bookings : 0,
          national_requests: sp ? sp.national_requests : 0,
          service_volume: sp ? sp.bookings + sp.national_requests : null,
        };
      });
      const totalDemand = series.reduce((a, x) => a + (x.demand || 0), 0);
      const totalService = series.reduce((a, x) => a + (x.service_volume || 0), 0);
      cities.push({
        city: d ? d.city : (serviceCityName(bookings, nreqs, key) || key),
        province_code: d ? d.province_code : '',
        has_demand: !!d && [...d.periods.values()].some((p) => p.demand > 0),
        has_service: totalService > 0,
        total_demand: totalDemand,
        total_service: totalService,
        series,
        demand_basis: d ? [...new Set([...d.periods.values()].flatMap((p) => [...p.basis]))] : [],
        sources: d ? [...new Set([...d.periods.values()].flatMap((p) => [...p.sources]))] : [],
      });
    }
    cities.sort((a, b) => (b.total_demand - a.total_demand) || (b.total_service - a.total_service));

    return Response.json({
      cities,
      series_note: 'Search demand is an industry-wide, deduplicated monthly estimate from source-labeled observations (Google Ads Keyword Planner or licensed datasets); months without an observation show a gap, never a fabricated zero. Service volume counts platform bookings and nationwide requests recorded in that month; internal test records are excluded. The two scales are independent and never merged into a market share.',
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function serviceCityName(bookings, nreqs, key) {
  for (const b of bookings) if (normCity(b.city) === key) return String(b.city).trim();
  for (const n of nreqs) if (normCity(n.city) === key) return String(n.city).trim();
  return '';
}