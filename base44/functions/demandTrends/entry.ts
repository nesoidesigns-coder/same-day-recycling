import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { normalizeCategory, currentPeriod, CATEGORY_LABELS, PROVINCES } from '../../shared/demand.ts';
import { cleanObservations, isTrend } from '../../shared/marketCommand.ts';
import { isTestPartner } from '../../shared/coverageStatus.ts';

// Public city-level trends: industry search demand (estimated) compared with
// aggregate service volume for that city. Aggregates only — never raw
// visitor, booking or contractor data; internal test records are excluded.
const normCity = (s) => String(s || '').trim().toLowerCase();

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const current = currentPeriod();
    const periodsBack = (d, n) => { const [y,m] = String(d).split('-').map(Number); const dt = new Date(Date.UTC(y, m - 1 - n, 1)); return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,'0')}`; };
    const periodFrom = periodsBack(current, 12);

    // Demand observations: cleaned, trends separated so sampled interest is
    // never charted as search counts.
    let obs = [], cursor;
    do {
      const page = await base44.entities.DemandObservation.filter({ geo_type: 'city', period: { $gte: periodFrom } }, { limit: 500, cursor });
      obs.push(...(page.items || []));
      if (!page.has_more) { cursor = undefined; break; }
      cursor = page.next_cursor;
    } while (cursor);
    const clean = cleanObservations(obs);
    const volumes = clean.filter((r) => !isTrend(r));

    // Aggregate service volume per city/month: verified records only
    // (record_type = service, excluding every test fixture).
    const bookingPage = await base44.entities.Booking.filter({ record_type: 'service', status: 'completed' }, { limit: 1000 });
    const requestPage = await base44.entities.NationalRequest.filter({ record_type: 'service' }, { limit: 1000 });
    const serviceMap = new Map();
    const bump = (city, period) => {
      if (!city || !period) return;
      const key = `${normCity(city)}|${period.slice(0,7)}`;
      serviceMap.set(key, (serviceMap.get(key) || 0) + 1);
    };
    for (const b of bookingPage.items || []) {
      if (isTestPartner({ city: b.city })) continue;
      const period = String(b.updated_date || b.created_date || '').slice(0,7);
      bump(b.city, period);
    }
    for (const n of requestPage.items || []) {
      if (isTestPartner({ city: n.city })) continue;
      const period = String(n.created_date || '').slice(0,7);
      bump(n.city, period);
    }

    // One row per city and month; missing demand stays null (no zero-fill).
    const cities = new Map();
    for (const r of volumes) {
      const key = normCity(r.city);
      if (!cities.has(key)) cities.set(key, { city: String(r.city).trim(), province_code: r.province_code || '', series: new Map(), sources: new Set() });
      const entry = cities.get(key);
      entry.sources.add(r.source || 'Unknown source');
      const prev = entry.series.get(r.period) || { demand: 0, keywords: 0 };
      entry.series.set(r.period, { demand: prev.demand + (Number(r.est_monthly_volume) || 0), keywords: prev.keywords + 1 });
    }
    const allPeriods = [...new Set(volumes.map((r) => r.period))].sort();
    const out = [...cities.entries()].map(([key, c]) => {
      const series = allPeriods.map((period) => ({ period, demand: c.series.get(period)?.demand ?? null, service_volume: serviceMap.get(`${key}|${period}`) || 0 }));
      return {
        city: c.city, province_code: c.province_code,
        has_demand: series.some((s) => s.demand !== null),
        has_service: series.some((s) => s.service_volume > 0),
        series, sources: [...c.sources],
        latest_period: allPeriods[allPeriods.length - 1] || '',
      };
    }).sort((a, b) => (b.series.at(-1)?.demand || 0) - (a.series.at(-1)?.demand || 0));

    return Response.json({
      cities: out,
      series_note: 'Industry demand lines are estimated monthly searches (source-labeled, deduplicated). Bars are aggregate counts of completed pickups and service requests in Recycling OS — operational volume, never demand. Missing months stay gaps; sampled relative-interest indices are never charted as search counts.',
      period_from: periodFrom,
      current_period: current,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}