import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { isTestPartner } from '../../shared/coverageStatus.ts';
import { PROVINCES } from '../../shared/demand.ts';
import { buildMarketCommand, cleanObservations, isTrend } from '../../shared/marketCommand.ts';

// Public market data only. Acquisition and contractor records are never
// included in the public response; the contractor view is explicitly admin-only.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const filters = payload.filters || {};
    for (const key of ['periodFrom', 'periodTo']) {
      if (filters[key] && !/^\d{4}-(0[1-9]|1[0-2])$/.test(filters[key])) return Response.json({ error: 'Invalid reporting month' }, { status: 400 });
    }
    if (filters.periodFrom && filters.periodTo && filters.periodFrom > filters.periodTo) return Response.json({ error: 'Start month must not follow end month' }, { status: 400 });
    const query = {};
    if (filters.category && filters.category !== 'all') query.service_category = String(filters.category).slice(0,60);
    if (filters.periodTo) query.period = { $lte: filters.periodTo };
    let rows = [], cursor;
    for (let i = 0; i < 120; i++) {
      const page = await base44.entities.DemandObservation.filter(query, {sort:'-period',limit:500,cursor});
      rows.push(...(page.items || []));
      if (!page.has_more) { cursor = undefined; break; }
      cursor = page.next_cursor;
    }
    if (cursor) return Response.json({ error: 'This selection exceeds the reporting limit. Narrow the service or date range; no partial total was published.' }, { status: 422 });
    const command = buildMarketCommand(rows, filters);
    if (payload.view === 'contractor') {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') return Response.json({ error:'Forbidden' },{status:403});
      const counts = new Map(); let partnerCursor;
      do {
        const page = await base44.entities.Partner.filter({active:true,verified:true},{limit:500,cursor:partnerCursor});
        for (const p of page.items || []) if (!isTestPartner(p)) {const k=String(p.city || '').trim().toLowerCase(); counts.set(k,(counts.get(k)||0)+1);}
        partnerCursor = page.has_more ? page.next_cursor : undefined;
      } while (partnerCursor);
      return Response.json({ regions:command.cities.map((r) => ({...r,verified_providers:counts.get(r.name.toLowerCase()) || 0})).sort((a,b) => a.verified_providers-b.verified_providers || (b.value||0)-(a.value||0)), period:command.latest_period,
        note:'Expansion screening only: recorded search estimates and verified platform providers are separate columns. Zero providers means none on file, not no competition in the market.' });
    }
    if (payload.view === 'command') return Response.json(command);
    // Compatibility payload for the homepage cards, with per-gauge provenance.
    // Capture is pulled from the latest DemandSnapshot, never stale notes.
    const snap = await base44.entities.DemandSnapshot.list({ sort: '-refreshed_at', limit: 1 });
    const latestCapture = snap.items?.[0] || null;
    const clean = cleanObservations(rows).filter((r) => !isTrend(r));
    const scopes = {};
    const toScope = (c) => ({available:c.overview.available,latest_period:c.latest_period,last_updated:c.overview.updated,sources:c.overview.sources,level_note:c.coverage_note,
      categories:c.categories.map((r) => ({...r,value:r.value,unit:'searches',last_updated:r.updated,trend_pct:r.mom_pct,volume_basis:[],label:r.label})),
      total:{...c.overview,unit:'searches',prev_value:null}});
    scopes.CA = toScope(command);
    for (const code of command.geography.provinces) scopes[code] = toScope(buildMarketCommand(rows,{province:code}));
    for (const city of command.geography.cities) scopes[city.key] = toScope(buildMarketCommand(rows,{province:city.province_code,city:city.key}));
    return Response.json({ industry:{available:command.overview.available,latest_period:command.latest_period,total_est_monthly_searches:command.overview.value,by_category:command.categories,by_province:command.provinces,by_city:command.cities},
      market:{available:command.overview.available,latest_period:command.latest_period,geo:command.geography,scopes},
      series:clean.slice(0,800).map(({keyword,geo_type,geo_key,province_code,city,service_category,period,est_monthly_volume,volume_basis,metric_type,source,last_updated,competition}) => ({keyword,geo_type,geo_key,province_code,city,service_category,period,est_monthly_volume,volume_basis,metric_type,source,last_updated,competition})),
      series_truncated:clean.length>800,provinces:PROVINCES,capture:latestCapture?.capture || null,methodology:{industry:command.methodology,updates:'Keyword Planner historical metrics are published monthly. Trends export samples update only when a new source export is imported.'} });
  } catch (error) {
    return Response.json({error:error.message},{status:500});
  }
}