import { CATEGORY_LABELS, MARKET_CATEGORIES, PROVINCE_NAMES, previousPeriod } from './demand.ts';

const norm = (v) => String(v || '').trim().toLowerCase();
const unique = (xs) => [...new Set(xs.filter(Boolean))];
const validMonth = (p) => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(p || ''));
export const isTrend = (r) => r.volume_basis === 'google_trends' || r.metric_type === 'relative_interest';
const kind = (r) => r.metric_type || 'unspecified_estimate';
export const engineOf = (r) => r.search_engine && r.search_engine !== 'unknown' ? r.search_engine : r.volume_basis === 'keyword_planner' || isTrend(r) ? 'google' : 'unknown';
const isVolume = (r) => ['monthly_volume','monthly_average'].includes(kind(r));
const family = (r) => `${r.provider || r.volume_basis || 'admin_import'}|${r.source}`;
const identity = (r) => `${engineOf(r)}|${r.geo_type}|${norm(r.province_code)}|${norm(r.geo_key || r.city)}|${norm(r.keyword)}`;
const cohortKey = (r) => `${identity(r)}|${family(r)}|${kind(r)}|${(r.close_variants || []).map(norm).sort().join(';')}`;
const sum = (rows) => rows.length ? rows.reduce((n, r) => n + Number(r.est_monthly_volume), 0) : null;
const pct = (now, before) => before > 0 ? Math.round((now - before) / before * 1000) / 10 : null;
const sourcePriority = (r) => r.volume_basis === 'keyword_planner' ? 3 : r.volume_basis === 'published_estimate' ? 2 : 1;

// Monthly values, rolling averages, and Trends samples are distinct measures.
// Keep only one volume provider per canonical keyword/geography/month. Trends
// samples keep their own comparison window and never replace volume records.
export function cleanObservations(rows) {
  const best = new Map();
  for (const r of rows) {
    if (!validMonth(r.period) || r.period > new Date().toISOString().slice(0,7) || !r.keyword || !r.source) continue;
    if (r.country_code !== 'CA') continue;
    if (!['national','province','city'].includes(r.geo_type) || (r.geo_type === 'province' && !PROVINCE_NAMES[r.province_code]) || (r.geo_type === 'city' && (!r.city || !PROVINCE_NAMES[r.province_code]))) continue;
    const trend = isTrend(r), click = kind(r).startsWith('estimated_');
    if (!trend && !click && !isVolume(r)) continue;
    if (trend ? !Number.isFinite(r.trend_index) || r.trend_index < 0 || r.trend_index > 100 || !r.comparison_group : click ? !Number.isFinite(r.estimated_clicks) || r.estimated_clicks < 0 || !r.methodology_note || !r.source_url : !Number.isFinite(r.est_monthly_volume) || r.est_monthly_volume < 0) continue;
    const key = `${identity(r)}|${r.period}|${kind(r)}|${trend ? r.comparison_group : ''}`;
    const prev = best.get(key);
    if (!prev || sourcePriority(r) > sourcePriority(prev) || (sourcePriority(r) === sourcePriority(prev) && String(r.last_updated || '') > String(prev.last_updated || ''))) best.set(key, r);
  }
  // Provider-declared variants count once, including reciprocal variant groups.
  const selected = [...best.values()].sort((a,b) => (b.close_variants?.length || 0)-(a.close_variants?.length || 0) || norm(a.keyword).localeCompare(norm(b.keyword))), grouped = new Set(), result = [];
  const variantKey = (r, keyword) => [engineOf(r),r.geo_type,norm(r.geo_key),norm(r.province_code),r.period,kind(r),family(r),norm(keyword)].join('|');
  for (const r of selected) {
    if (grouped.has(variantKey(r,r.keyword))) continue;
    result.push(r);
    for (const keyword of [r.keyword,...(r.close_variants || [])]) grouped.add(variantKey(r,keyword));
  }
  return result;
}

function sameCohort(a, b) {
  if (!a.length || a.length !== b.length) return false;
  const keys = new Set(a.map(cohortKey));
  return b.every((r) => keys.has(cohortKey(r)));
}
function metadata(rows, scope, period, type = 'Estimated') {
  return { scope, period: period || null, sources: unique(rows.map((r) => r.source)), source_urls: unique(rows.map((r) => r.source_url)), engines: unique(rows.map(engineOf)),
    updated: rows.map((r) => r.last_updated || '').sort().pop() || null, refreshed_at: rows.map((r) => r.retrieved_at || r.last_updated || '').sort().pop() || null,
    reporting_windows: unique(rows.map((r) => `${r.period_start || r.period} to ${r.period_end || r.period}`)), cadences: unique(rows.map((r) => r.update_cadence)), classification: type };
}
function metric(rows, prev, scope, period) {
  const monthly = rows.filter((r) => kind(r) === 'monthly_volume');
  const averages = rows.filter((r) => kind(r) === 'monthly_average');
  // Do not mix rolling averages with individual months. Prefer actual monthly
  // estimates when available and disclose the selected measure's coverage.
  const selected = monthly.length ? monthly : averages.length ? averages : rows;
  const prior = prev.filter((r) => kind(r) === 'monthly_volume');
  const comparable = monthly.length > 0 && sameCohort(monthly, prior);
  return { ...metadata(selected, scope, period), value: sum(selected), available: selected.length > 0, keywords: selected.length,
    measure: monthly.length ? 'Monthly search-volume estimate' : averages.length ? 'Average monthly searches (rolling window)' : 'Estimate; reporting basis not specified',
    mom_pct: comparable ? pct(sum(monthly), sum(prior)) : null, previous_period: period ? previousPeriod(period) : null,
    change_note: comparable ? 'Same keyword, provider and geographic coverage' : 'Needs comparable monthly estimates for both months',
    omitted_measures: rows.length - selected.length };
}
function monthRange(start, end) {
  if (!start || !end) return [];
  const periods = []; let p = start;
  while (p <= end) { periods.push(p); const [y,m] = p.split('-').map(Number); p = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2,'0')}`; }
  return periods;
}
function ranked(rows, field, period, scope) {
  const grouped = new Map();
  for (const r of rows) {
    const key = field === 'city' ? `${r.city}|${r.province_code || ''}` : r.province_code;
    if (!key) continue;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(r);
  }
  return [...grouped.entries()].map(([key, rs]) => ({ key, name: field === 'city' ? rs[0].city : PROVINCE_NAMES[key] || key,
    province_code: rs[0].province_code || '', geo_type: field === 'city' ? 'city' : 'province', ...metric(rs, [], scope, period) }))
    .sort((a,b) => (b.value || 0) - (a.value || 0));
}

export function buildMarketCommand(input, filters = {}, storedCount = input.length) {
  const all = cleanObservations(input);
  const province = String(filters.province || '').toUpperCase();
  const city = String(filters.city || '').trim();
  const category = filters.category || 'all';
  const matchesGeo = (r) => (!province || r.province_code === province) && (!city || norm(r.city) === norm(city));
  const within = (r) => (!filters.periodFrom || r.period >= filters.periodFrom) && (!filters.periodTo || r.period <= filters.periodTo);
  const engine = filters.engine || 'google';
  const engineRows = all.filter((r) => engineOf(r) === engine && (!filters.provider || r.provider === filters.provider || r.volume_basis === filters.provider));
  const filtered = engineRows.filter((r) => (category === 'all' || r.service_category === category) && matchesGeo(r));
  const volumes = filtered.filter(isVolume);
  const level = city ? 'city' : province ? 'province' : 'national';
  const scoped = volumes.filter((r) => r.geo_type === level);
  // Source history, never the website launch or its first booking, sets the range.
  // An average-only dataset remains visible, explicitly labeled and not converted.
  const latestAvailable = unique(scoped.filter(within).map((r) => r.period)).sort().at(-1);
  const desired = filters.measure || (scoped.some((r) => kind(r) === 'monthly_volume' && r.period === latestAvailable) ? 'monthly_volume' : 'monthly_average');
  const relevant = scoped.filter((r) => kind(r) === desired && within(r));
  const periods = unique(relevant.map((r) => r.period)).sort();
  const latest = periods.at(-1) || null;
  const regionalLatest = unique(volumes.filter((r) => kind(r) === desired && within(r)).map((r) => r.period)).sort().at(-1) || null;
  const scopeLabel = city ? `${city}${province ? `, ${province}` : ''}` : province ? PROVINCE_NAMES[province] || province : 'Canada';
  const currentAll = volumes.filter((r) => r.period === (latest || regionalLatest) && kind(r) === desired);
  const candidates = scoped.filter((r) => r.period === latest && kind(r) === desired);
  const averageWindow = candidates.map((r) => `${r.period_start}|${r.period_end}`).sort()[0];
  const current = desired === 'monthly_average' ? candidates.filter((r) => `${r.period_start}|${r.period_end}` === averageWindow) : candidates;
  const previous = scoped.filter((r) => r.period === previousPeriod(latest));
  const overview = metric(current, previous, scopeLabel, latest);
  const categories = MARKET_CATEGORIES.filter((c) => category === 'all' || c === category).map((c) => {
    const available = scoped.filter((r) => r.service_category === c && within(r));
    const newest = unique(available.map((r) => r.period)).sort().at(-1);
    const measure = filters.measure || (available.some((r) => kind(r) === 'monthly_volume' && r.period === newest) ? 'monthly_volume' : 'monthly_average');
    const eligible = available.filter((r) => kind(r) === measure);
    const period = unique(eligible.map((r) => r.period)).sort().at(-1) || null;
    const candidates = eligible.filter((r) => r.period === period);
    const window = candidates.map((r) => `${r.period_start}|${r.period_end}`).sort()[0];
    const rows = measure === 'monthly_average' ? candidates.filter((r) => `${r.period_start}|${r.period_end}` === window) : candidates;
    // Leading city per service: city-level observations only, never projected
    // from national or provincial totals.
    const cityAgg = new Map();
    for (const r of engineRows.filter((r) => r.geo_type === 'city' && r.service_category === c && kind(r) === desired && within(r))) {
      const ck = `${norm(r.city)}|${norm(r.province_code)}`;
      cityAgg.set(ck, (cityAgg.get(ck) || 0) + Number(r.est_monthly_volume));
    }
    const topCity = [...cityAgg.entries()].sort((a,b) => b[1]-a[1])[0] || null;
    const leading_city = topCity ? { city: topCity[0].split('|')[0], province_code: topCity[0].split('|')[1], value: topCity[1] } : null;
    return { category:c, label:CATEGORY_LABELS[c], ...metric(rows, available.filter((r) => r.period === previousPeriod(period)), scopeLabel, period), leading_city, included_in_overview:period === latest && measure === desired && (measure !== 'monthly_average' || window === averageWindow) };
  });
  const monthly = scoped.filter((r) => kind(r) === 'monthly_volume' && within(r));
  const monthlyPeriods = unique(monthly.map((r) => r.period)).sort();
  const history = monthRange(monthlyPeriods[0], monthlyPeriods.at(-1)).map((period) => {
    const rs = monthly.filter((r) => r.period === period); return { period, volume: sum(rs), keywords: rs.length, ...metadata(rs, scopeLabel, period) };
  });
  const complete = history.filter((r) => r.volume !== null);
  const comparableSeason = complete.length >= 12 && complete.length === history.length && new Set(complete.map((r) => r.period.slice(5))).size === 12 && complete.every((p) => sameCohort(monthly.filter((r) => r.period === p.period), monthly.filter((r) => r.period === complete[0].period)));
  const seasonality = comparableSeason ? Array.from({length:12}, (_,i) => {
    const rs = complete.filter((r) => Number(r.period.slice(5)) === i+1); return { month: new Date(Date.UTC(2000,i,1)).toLocaleString('en-CA',{month:'short',timeZone:'UTC'}), volume: rs.length ? Math.round(rs.reduce((n,r) => n+r.volume,0)/rs.length) : null, samples: rs.length };
  }) : [];
  const regional = currentAll.filter((r) => r.geo_type !== 'national' && (desired !== 'monthly_average' || !averageWindow || `${r.period_start}|${r.period_end}` === averageWindow));
  const provinces = ranked(regional.filter((r) => r.geo_type === 'province'), 'province_code', latest || regionalLatest, 'Province-level estimates');
  const cities = ranked(regional.filter((r) => r.geo_type === 'city'), 'city', latest || regionalLatest, 'City-level estimates');
  const keywords = current.map((r) => {
    const prev = previous.find((p) => cohortKey(p) === cohortKey(r));
    return { keyword: r.keyword, category: r.service_category, variants: r.close_variants || [], value: r.est_monthly_volume, competition: r.competition || 'unknown',
      mom_pct: kind(r) === 'monthly_volume' && prev && kind(prev) === 'monthly_volume' ? pct(r.est_monthly_volume, prev.est_monthly_volume) : null,
      ...metadata([r], scopeLabel, latest), measure: kind(r) };
  }).sort((a,b) => b.value-a.value);
  // Transparent rule, not a prediction of bookings or a claim of market share.
  const opportunities = keywords.filter((r) => r.value > 0).sort((a,b) =>
    Number(b.mom_pct > 0) - Number(a.mom_pct > 0) || Number(b.competition === 'low') - Number(a.competition === 'low') || b.value-a.value).slice(0,15);
  const groups = new Map();
  for (const r of filtered.filter((r) => isTrend(r) && within(r) && r.geo_type === (city ? 'city' : province ? 'province' : 'national'))) {
    const key = `${identity(r)}|${r.comparison_group}`;
    if (!groups.has(key)) groups.set(key, []); groups.get(key).push(r);
  }
  const trends = [...groups.values()].map((rs) => {
    rs.sort((a,b) => a.period.localeCompare(b.period)); const last = rs.at(-1); const before = rs.find((r) => r.period === previousPeriod(last.period));
    return { keyword: last.keyword, comparison_group: last.comparison_group, value: last.trend_index, change_points: before ? last.trend_index-before.trend_index : null,
      direction: before ? last.trend_index > before.trend_index ? 'rising' : last.trend_index < before.trend_index ? 'declining' : 'steady' : 'unknown',
      ...metadata(rs,scopeLabel,last.period,'Sampled relative interest'), series: rs.map((r) => ({period:r.period,index:r.trend_index})) };
  }).sort((a,b) => String(b.updated).localeCompare(String(a.updated)));
  // Only the newest export window per term is comparable to itself.
  const seenTrends = new Set(); const latestTrends = trends.filter((r) => {if(seenTrends.has(r.keyword)) return false; seenTrends.add(r.keyword); return true;});
  const clickMetrics = Object.fromEntries(['estimated_organic_clicks','estimated_paid_clicks'].map((measure) => {
    const rs = filtered.filter((r) => kind(r) === measure && r.geo_type === level && within(r));
    const p = unique(rs.map((r) => r.period)).sort().at(-1) || null, latestRows = rs.filter((r) => r.period === p);
    return [measure,{...metadata(latestRows,scopeLabel,p),available:latestRows.length > 0,value:latestRows.length ? latestRows.reduce((n,r) => n+r.estimated_clicks,0) : null,methodologies:unique(latestRows.map((r) => r.methodology_note))}];
  }));
  const fastest = categories.filter((r) => r.period === latest && r.mom_pct > 0).sort((a,b) => b.mom_pct-a.mom_pct)[0] || null;
  const provinceCohort = (r) => currentAll.filter((v) => v.geo_type === 'province' && v.province_code === r.key).map((v) => `${norm(v.keyword)}|${family(v)}|${kind(v)}`).sort().join(';');
  const comparableProvinces = provinces.length > 1 && provinces.every((r) => provinceCohort(r) === provinceCohort(provinces[0]));
  const dataState = overview.available ? 'available' : storedCount === 0 ? 'not_backfilled' : 'no_matching_observations';
  return { overview, categories, latest_period: latest, scope: scopeLabel, level, engine, measure:desired, click_metrics:clickMetrics, fastest_growing:fastest,
    data_status:{state:dataState,stored_observations:storedCount,historical_market_data:overview.available ? 'source_observations_loaded' : 'not_determined_from_internal_database',website_activity_used:false,
      note:storedCount === 0 ? 'Historical market data has not been backfilled into this app. An empty internal database is not evidence that Canadian market history does not exist. Provider authorization and retrieval are pending.' : overview.available ? 'Indicators use source-reported market periods without a website-launch cutoff. Website visits, bookings and advertising clicks are not inputs.' : 'The app contains market observations, but none match this geography, engine and measure. This is a dataset coverage gap, not evidence of absent market demand.'},
    history_coverage:{first_period:monthlyPeriods[0] || null,last_period:monthlyPeriods.at(-1) || null,months:complete.length,seasonality_comparable:comparableSeason},
    highest_province:comparableProvinces ? provinces[0] : null, regional_period:latest || regionalLatest,
    provider_coverage:unique(engineRows.map((r) => r.source)).map((source) => ({source,...metadata(engineRows.filter((r) => r.source === source),'Recorded Canadian geographies',null)})),
    coverage_note: level === 'national' ? 'Canada-level estimates for tracked keywords only, not every Canadian search or unique people. Provincial and city observations are never added to the national total.' : `Only source-reported ${level}-level observations are included. No national figure is projected into this geography.`,
    connection_status:overview.available ? 'Verified market observations loaded; API connection status is managed separately' : storedCount === 0 ? 'Historical data not yet retrieved into this app' : 'No matching source observations for this selection',
    history, seasonality, provinces, cities, keywords: keywords.slice(0,15), opportunities, trends: latestTrends.slice(0,20),
    rising: keywords.filter((r) => r.mom_pct > 0).sort((a,b) => b.mom_pct-a.mom_pct).slice(0,6),
    declining: keywords.filter((r) => r.mom_pct < 0).sort((a,b) => a.mom_pct-b.mom_pct).slice(0,6),
    periods, geography: {provinces: unique(engineRows.map((r) => r.province_code)), cities: [...new Map(engineRows.filter((r) => r.geo_type === 'city' && r.city).map((r) => [`${r.city}|${r.province_code}`,{key:r.city,province_code:r.province_code}])).values()]},
    methodology: 'Estimated searches are not unique people or exact live counts. Monthly estimates and rolling averages are never added together. Month-over-month compares identical keyword/provider/geography cohorts only. Missing data stays unavailable. Trends export indices (0–100) are sampled, window-normalized interest, never search volumes. Ad competition is not provider availability.' };
}