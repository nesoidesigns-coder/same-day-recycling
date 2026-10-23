import { CATEGORY_LABELS, MARKET_CATEGORIES, PROVINCE_NAMES, previousPeriod } from './demand.ts';

const norm = (v) => String(v || '').trim().toLowerCase();
const unique = (xs) => [...new Set(xs.filter(Boolean))];
const validMonth = (p) => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(p || ''));
export const isTrend = (r) => r.volume_basis === 'google_trends' || r.metric_type === 'relative_interest';
const kind = (r) => r.metric_type || 'unspecified_estimate';
const family = (r) => isTrend(r) ? 'google_trends' : r.volume_basis || 'admin_import';
const identity = (r) => `${r.geo_type}|${norm(r.province_code)}|${norm(r.geo_key || r.city)}|${norm(r.keyword)}`;
const cohortKey = (r) => `${identity(r)}|${family(r)}|${kind(r)}`;
const sum = (rows) => rows.length ? rows.reduce((n, r) => n + Number(r.est_monthly_volume), 0) : null;
const pct = (now, before) => before > 0 ? Math.round((now - before) / before * 1000) / 10 : null;
const sourcePriority = (r) => r.volume_basis === 'keyword_planner' ? 3 : r.volume_basis === 'published_estimate' ? 2 : 1;

// Monthly values, rolling averages, and Trends samples are distinct measures.
// Keep only one volume provider per canonical keyword/geography/month. Trends
// samples keep their own comparison window and never replace volume records.
export function cleanObservations(rows) {
  const best = new Map();
  for (const r of rows) {
    if (!validMonth(r.period) || !r.keyword || !r.source) continue;
    const trend = isTrend(r);
    if (trend ? !Number.isFinite(r.trend_index) || r.trend_index < 0 || r.trend_index > 100 || !r.comparison_group : !Number.isFinite(r.est_monthly_volume) || r.est_monthly_volume < 0) continue;
    const key = `${identity(r)}|${r.period}|${trend ? `trend|${r.comparison_group}` : 'volume'}`;
    const prev = best.get(key);
    if (!prev || sourcePriority(r) > sourcePriority(prev) || (sourcePriority(r) === sourcePriority(prev) && String(r.last_updated || '') > String(prev.last_updated || ''))) best.set(key, r);
  }
  return [...best.values()];
}

function sameCohort(a, b) {
  if (!a.length || a.length !== b.length) return false;
  const keys = new Set(a.map(cohortKey));
  return b.every((r) => keys.has(cohortKey(r)));
}
function metadata(rows, scope, period, type = 'Estimated') {
  return { scope, period: period || null, sources: unique(rows.map((r) => r.source)), updated: rows.map((r) => r.last_updated || '').sort().pop() || null, classification: type };
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
  while (p <= end && periods.length < 60) { periods.push(p); const [y,m] = p.split('-').map(Number); p = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2,'0')}`; }
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

export function buildMarketCommand(input, filters = {}) {
  const all = cleanObservations(input);
  const province = String(filters.province || '').toUpperCase();
  const city = String(filters.city || '').trim();
  const category = filters.category || 'all';
  const matchesGeo = (r) => (!province || r.province_code === province) && (!city || norm(r.city) === norm(city));
  const within = (r) => (!filters.periodFrom || r.period >= filters.periodFrom) && (!filters.periodTo || r.period <= filters.periodTo);
  const filtered = all.filter((r) => (category === 'all' || r.service_category === category) && matchesGeo(r));
  const volumes = filtered.filter((r) => !isTrend(r));
  const periods = unique(volumes.filter(within).map((r) => r.period)).sort();
  const latest = periods.at(-1) || null;
  const scopeLabel = city ? `${city}${province ? `, ${province}` : ''}` : province ? PROVINCE_NAMES[province] || province : 'Canada';
  const currentAll = volumes.filter((r) => r.period === latest);
  const level = city ? 'city' : province ? (currentAll.some((r) => r.geo_type === 'province') ? 'province' : 'city') :
    currentAll.some((r) => r.geo_type === 'national') ? 'national' : currentAll.some((r) => r.geo_type === 'province') ? 'province' : 'city';
  // Use the SAME geography level through time. Missing months remain null.
  const scoped = volumes.filter((r) => r.geo_type === level);
  const current = scoped.filter((r) => r.period === latest);
  const previous = scoped.filter((r) => r.period === previousPeriod(latest));
  const overview = metric(current, previous, scopeLabel, latest);
  const categories = MARKET_CATEGORIES.filter((c) => category === 'all' || c === category).map((c) => ({ category: c, label: CATEGORY_LABELS[c],
    ...metric(current.filter((r) => r.service_category === c), previous.filter((r) => r.service_category === c), scopeLabel, latest) }));
  const first = periods[0];
  const monthly = scoped.filter((r) => kind(r) === 'monthly_volume');
  const history = monthRange(first, latest).map((period) => {
    const rs = monthly.filter((r) => r.period === period); return { period, volume: sum(rs), keywords: rs.length, ...metadata(rs, scopeLabel, period) };
  });
  const complete = history.filter((r) => r.volume !== null);
  const comparableSeason = complete.length >= 12 && complete.every((p) => sameCohort(monthly.filter((r) => r.period === p.period), monthly.filter((r) => r.period === complete[0].period)));
  const seasonality = comparableSeason ? Array.from({length:12}, (_,i) => {
    const rs = complete.filter((r) => Number(r.period.slice(5)) === i+1); return { month: new Date(Date.UTC(2000,i,1)).toLocaleString('en-CA',{month:'short',timeZone:'UTC'}), volume: rs.length ? Math.round(rs.reduce((n,r) => n+r.volume,0)/rs.length) : null, samples: rs.length };
  }) : [];
  const regional = currentAll.filter((r) => r.geo_type !== 'national');
  const provinces = ranked(regional.filter((r) => r.geo_type === 'province'), 'province_code', latest, 'Province-level estimates');
  const cities = ranked(regional.filter((r) => r.geo_type === 'city'), 'city', latest, 'City-level estimates');
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
  return { overview, categories, latest_period: latest, scope: scopeLabel, level,
    coverage_note: level === 'national' ? 'National estimates for tracked keywords, not all Canadian searches or unique people.' : `Only recorded ${level}-level coverage is included; this is not a complete national total.`,
    history, seasonality, provinces, cities, keywords: keywords.slice(0,15), opportunities, trends: latestTrends.slice(0,20),
    rising: keywords.filter((r) => r.mom_pct > 0).sort((a,b) => b.mom_pct-a.mom_pct).slice(0,6),
    declining: keywords.filter((r) => r.mom_pct < 0).sort((a,b) => a.mom_pct-b.mom_pct).slice(0,6),
    periods, geography: {provinces: unique(all.map((r) => r.province_code)), cities: [...new Map(all.filter((r) => r.geo_type === 'city' && r.city).map((r) => [`${r.city}|${r.province_code}`,{key:r.city,province_code:r.province_code}])).values()]},
    methodology: 'Estimated searches are not unique people or exact live counts. Monthly estimates and rolling averages are never added together. Month-over-month compares identical keyword/provider/geography cohorts only. Missing data stays unavailable. Trends export indices (0–100) are sampled, window-normalized interest, never search volumes. Ad competition is not provider availability.' };
}