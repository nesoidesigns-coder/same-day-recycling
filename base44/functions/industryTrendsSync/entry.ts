import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { currentPeriod } from '../../shared/demand.ts';

// Google Trends ingestion: fetches REAL sampled relative-interest data from
// the public Trends explore endpoint (Canada, rolling 5-year weekly window).
// Indices are 0-100 samples normalized within each keyword group's window —
// never search volumes, never summed, never relabeled as monthly volumes.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
// One representative Canadian search phrase per taxonomy topic. Consecutive
// groups of 5 are kept thematically related (indices normalize within a group).
const TERMS = [
  ['junk removal', 'junk-removal'],
  ['furniture removal', 'furniture-removal'],
  ['appliance removal', 'appliance-removal'],
  ['mattress disposal', 'mattress-disposal'],
  ['waste disposal', 'waste-disposal'],
  ['estate cleanout', 'estate-cleanouts'],
  ['demolition cleanup', 'demolition-cleanup'],
  ['yard waste removal', 'yard-waste'],
  ['scrap metal', 'scrap-metal-pickup'],
  ['hot tub removal', 'hot-tub-removal'],
  ['recycling depot', 'recycling-drop-off'],
  ['bin rental', 'bin-rentals'],
  ['electronics recycling', 'electronics-recycling'],
  ['moving company', 'moving-services'],
  ['storage units', 'packing-storage'],
  ['downsizing', 'downsizing-help'],
  ['house cleaning', 'house-cleaning'],
  ['pressure washing', 'pressure-washing'],
  ['gutter cleaning', 'gutter-window'],
  ['pest control', 'pest-control'],
  ['construction debris disposal', 'construction-debris'],
  ['kitchen renovation', 'kitchen-bath-reno'],
  ['flooring installation', 'flooring-painting'],
  ['roofing contractor', 'roofing'],
  ['foundation repair', 'foundation-drainage'],
  ['excavation contractor', 'excavation'],
  ['concrete contractor', 'concrete-works'],
  ['real estate agent', 'realtors'],
  ['home appraisal', 'home-valuation'],
  ['eviction cleanout', 'tenant-turnover'],
  ['property management', 'strata-condo'],
  ['home staging', 'home-staging'],
  ['home inspection', 'home-inspection'],
  ['movers', 'local-movers'],
  ['long distance movers', 'long-distance-movers'],
  ['car shipping', 'car-shipping'],
  ['towing service', 'towing'],
  ['freight shipping', 'freight'],
  ['courier service', 'courier-delivery'],
  ['auto repair', 'auto-repair'],
  ['oil change', 'oil-tires'],
  ['scrap car removal', 'scrap-car'],
  ['tire disposal', 'tire-disposal'],
  ['auto parts', 'auto-parts'],
  ['car detailing', 'car-detailing'],
  ['furniture stores', 'furniture-stores'],
  ['appliance stores', 'appliance-stores'],
  ['used furniture', 'used-furniture'],
  ['donation pickup', 'donation-pickup'],
  ['furniture delivery', 'big-item-delivery'],
  ['walk in clinic', 'walk-in-clinic'],
  ['dentist', 'dental-care'],
  ['home care', 'home-care'],
  ['medical equipment rental', 'medical-equipment'],
  ['gym near me', 'gyms-fitness'],
  ['tutoring', 'tutoring'],
  ['daycare', 'childcare'],
  ['apprenticeship', 'trades-courses'],
  ['first aid course', 'safety-certification'],
  ['mortgage rates', 'mortgage-rates'],
  ['mortgage refinance', 'refinancing'],
  ['home insurance', 'home-insurance'],
  ['car insurance', 'auto-insurance'],
  ['accountant', 'accountant'],
  ['tax return', 'tax-filing'],
  ['computer repair', 'computer-repair'],
  ['it support', 'it-services'],
  ['web design', 'web-design'],
  ['crm software', 'business-software'],
  ['smart home installation', 'smart-install'],
  ['lawyer', 'lawyer'],
  ['notary', 'notary'],
  ['business consultant', 'business-consulting'],
  ['marketing agency', 'marketing-agency'],
  ['catering', 'catering'],
  ['event planner', 'event-planning'],
  ['party rentals', 'party-rentals'],
  ['event venues', 'event-venues'],
  ['farm worker', 'farm-labour'],
  ['land clearing', 'land-clearing'],
  ['equipment repair', 'equipment-repair'],
  ['feed store', 'feed-supplies'],
  ['machining', 'machining'],
  ['machinery removal', 'factory-equipment-removal'],
  ['warehousing', 'warehousing'],
  ['pallet recycling', 'pallet-recycling'],
  ['recreation centre', 'rec-activities'],
  ['hiking trails', 'trails-outdoors'],
  ['photographer', 'photography'],
  ['videographer', 'videography'],
  ['charity', 'charity-donation'],
  ['volunteer', 'volunteering'],
  ['pet grooming', 'pet-services'],
  ['veterinary clinic', 'vet-clinics'],
];
const chunk = (arr, n) => arr.length <= n ? [arr] : [arr.slice(0, n), ...chunk(arr.slice(n), n)];

async function fetchGroup(group, cookie) {
  const req = { comparisonItem: group.map(([k]) => ({ keyword: k, geo: 'CA', time: 'today 5-y' })), category: 0, property: '' };
  const headers = { 'User-Agent': UA, 'Cookie': cookie, 'Referer': 'https://trends.google.com/' };
  const r1 = await fetch('https://trends.google.com/trends/api/explore?hl=en-CA&tz=0&req=' + encodeURIComponent(JSON.stringify(req)),
    { headers: { ...headers, 'Accept': 'application/json' }, signal: AbortSignal.timeout(15000) });
  const t1 = await r1.text();
  if (!r1.ok) { const e = new Error(`Trends explore returned ${r1.status}`); e.status = r1.status; throw e; }
  const explore = JSON.parse(t1.slice(t1.indexOf('{')));
  const widget = (explore.widgets || []).find((w) => w.id === 'TIMESERIES');
  if (!widget) { const e = new Error('Trends explore returned no timeseries widget'); e.status = 502; throw e; }
  const r2 = await fetch('https://trends.google.com/trends/api/widgetdata/multiline?req=' + encodeURIComponent(JSON.stringify(widget.request)) + '&token=' + widget.token + '&tz=0',
    { headers, signal: AbortSignal.timeout(15000) });
  const t2 = await r2.text();
  if (!r2.ok) { const e = new Error(`Trends timeseries returned ${r2.status}`); e.status = r2.status; throw e; }
  const ts = JSON.parse(t2.slice(t2.indexOf('{')));
  return ts.default.timelineData.map((d) => ({ date: new Date(d.time * 1000).toISOString().slice(0, 10), value: d.value }));
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const started = new Date().toISOString();
    const today = new Date().toISOString().slice(0, 10);
    const body = await req.json().catch(() => ({}));
    const only: number[] = Array.isArray(body?.only) ? body.only : [];

    const warm = await fetch('https://trends.google.com/trends/explore?geo=CA', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(10000) });
    const cookie = (warm.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');

    const allGroups = chunk(TERMS, 5);
    const groups = only.length ? allGroups.filter((_, i) => only.includes(i)) : allGroups;
    const results = [], errors = [];
    let upserted = 0, firstMonth = null, lastMonth = null;
    for (const group of groups) {
      try {
        const weeks = await fetchGroup(group, cookie);
        const cg = `CA | ${group.map((t) => t[0]).join(' + ')} | ${weeks[0].date} to ${weeks[weeks.length - 1].date} | 5-year weekly window`.slice(0, 200);
        const sourceUrl = `https://trends.google.com/trends/explore?geo=CA&date=today%205-y&q=${encodeURIComponent(group.map((t) => t[0]).join(','))}`;
        const monthly = new Map();
        for (const wk of weeks) {
          const period = wk.date.slice(0, 7);
          for (let i = 0; i < group.length; i++) {
            const v = wk.value[i];
            if (v === null || v === undefined || !Number.isFinite(v)) continue;
            if (!monthly.has(period)) monthly.set(period, group.map(() => ({ sum: 0, n: 0 })));
            const row = monthly.get(period)[i];
            row.sum += v; row.n += 1;
          }
        }
        const periods = [...monthly.keys()].sort();
        const records = [];
        for (const period of periods) {
          const monthWeeks = weeks.filter((wk) => wk.date.slice(0, 7) === period);
          group.forEach(([keyword, category], i) => {
            const agg = monthly.get(period)[i];
            if (!agg.n) return;
            const index = Math.round(agg.sum / agg.n);
            const prevMonth = (() => { const [y, m] = period.split('-').map(Number); const d = new Date(Date.UTC(y, m - 2, 1)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; })();
            const prev = monthly.get(prevMonth)?.[i];
            const prevIndex = prev?.n ? Math.round(prev.sum / prev.n) : null;
            records.push({
              geo_type: 'national', geo_key: 'CA', province_code: '', city: '', country_code: 'CA', search_engine: 'google',
              provider: 'google_trends', service_category: category, keyword,
              close_variants: [], period, metric_type: 'relative_interest',
              period_start: monthWeeks[0]?.date || period, period_end: monthWeeks[monthWeeks.length - 1]?.date || period,
              est_monthly_volume: 0, estimated_clicks: 0, volume_basis: 'google_trends', trend_index: index,
              comparison_group: cg,
              trend_direction: prevIndex === null ? 'unknown' : index > prevIndex ? 'rising' : index < prevIndex ? 'falling' : 'steady',
              competition: 'unknown', source: 'Google Trends (fetched on demand via public explore endpoint)', source_url: sourceUrl,
              methodology_note: 'Weekly 0-100 relative-interest samples from the public Google Trends explore endpoint, averaged within each reporting month. The index is normalized within this exact keyword group, geography (Canada) and rolling 5-year window. Values are sampled interest, not search volumes, and are not comparable to other keyword groups or windows.',
              update_cadence: 'Fetched on demand; Trends resamples continuously over its rolling 5-year window',
              retrieved_at: started, last_updated: today,
            });
          });
        }
        if (!records.length) { errors.push({ group: group.map((t) => t[0]).join(', '), error: 'No data points returned' }); continue; }
        // Replace by keyword (not by group window) so every keyword keeps
        // exactly one current dataset across runs.
        await base44.entities.DemandObservation.deleteMany({ provider: 'google_trends', geo_key: 'CA', keyword: { $in: group.map((t) => t[0]) } });
        for (let i = 0; i < records.length; i += 400) await base44.entities.DemandObservation.bulkCreate(records.slice(i, i + 400));
        upserted += records.length;
        firstMonth = firstMonth || periods[0]; lastMonth = periods[periods.length - 1];
        results.push({ keywords: group.map((t) => t[0]), comparison_group: cg, periods: periods.length, records: records.length, window: `${periods[0]} to ${periods[periods.length - 1]}` });
      } catch (e) {
        errors.push({ group: group.map((t) => t[0]).join(', '), error: e.message });
      }
    }
    const status = errors.length === 0 ? 'success' : results.length ? 'partial' : 'failed';
    const coverageNote = status === 'failed'
      ? `Google Trends could not be fetched (often IP rate limiting): ${errors.map((e) => e.error).join('; ')}. No values were generated or stored.`
      : `Fetched live Canada-wide Trends samples for ${results.reduce((n, r) => n + r.records, 0)} keyword-months across ${results.length} keyword group(s), window ${firstMonth} to ${lastMonth}. Indices are relative interest (0-100) within each group's own 5-year window; not search volumes.${errors.length ? ` Failed groups: ${errors.map((e) => e.group).join(', ')}.` : ''}`;
    const log = {
      source: 'google_trends', status, run_date: today, started_at: started, finished_at: new Date().toISOString(),
      records_upserted: upserted, period: firstMonth ? `${firstMonth} to ${lastMonth}` : '', coverage_note: coverageNote,
      next_update_cadence: 'Fetched on demand from the Source Health tab',
    };
    await base44.entities.DemandSyncLog.create(log);
    return Response.json({ ok: status !== 'failed', status, records_upserted: upserted, groups: results, errors, coverage_note: coverageNote, reporting_window: firstMonth ? `${firstMonth} to ${lastMonth}` : null, current_period: currentPeriod() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}