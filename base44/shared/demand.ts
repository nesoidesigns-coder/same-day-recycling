// National Demand Intelligence — shared aggregation logic (server side).
// The industry layer never fabricates data: it sums admin-verified,
// source-labeled DemandObservation records only, deduplicated so overlapping
// keyword variants and duplicate geographic records are never counted twice.

export const SERVICE_CATEGORIES = [
  'junk_removal', 'furniture_removal', 'appliance_removal', 'electronics',
  'recycling', 'waste_disposal', 'estate_cleanout', 'construction_debris', 'other',
];

export const CATEGORY_LABELS = {
  junk_removal: 'Junk Removal',
  furniture_removal: 'Furniture Removal',
  appliance_removal: 'Appliance Removal',
  electronics: 'Electronics Recycling',
  recycling: 'Recycling',
  waste_disposal: 'Waste Disposal',
  estate_cleanout: 'Estate Cleanouts',
  construction_debris: 'Construction Debris',
  other: 'Other Services',
};

export const PROVINCES = [
  ['AB', 'Alberta'], ['BC', 'British Columbia'], ['MB', 'Manitoba'],
  ['NB', 'New Brunswick'], ['NL', 'Newfoundland and Labrador'],
  ['NS', 'Nova Scotia'], ['NT', 'Northwest Territories'], ['NU', 'Nunavut'],
  ['ON', 'Ontario'], ['PE', 'Prince Edward Island'], ['QC', 'Quebec'],
  ['SK', 'Saskatchewan'], ['YT', 'Yukon'],
];

export const PROVINCE_NAMES = Object.fromEntries(PROVINCES);

export function currentPeriod(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function previousPeriod(period) {
  const [y, m] = String(period || '').split('-').map(Number);
  if (!y || !m) return '';
  const dt = new Date(Date.UTC(y, m - 2, 1));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`;
}

const CATEGORY_ALIASES = {
  'junk removal': 'junk_removal', junk_removal: 'junk_removal', junk: 'junk_removal',
  'garbage removal': 'junk_removal', trash: 'junk_removal', rubbish: 'junk_removal', decluttering: 'junk_removal',
  'furniture removal': 'furniture_removal', furniture: 'furniture_removal', mattress: 'furniture_removal',
  couch: 'furniture_removal', 'couch removal': 'furniture_removal', sofas: 'furniture_removal',
  'appliance removal': 'appliance_removal', appliances: 'appliance_removal', appliance: 'appliance_removal',
  fridge: 'appliance_removal', freezer: 'appliance_removal', washer: 'appliance_removal',
  electronics: 'electronics', ewaste: 'electronics', 'e-waste': 'electronics', tv: 'electronics', computers: 'electronics',
  recycling: 'recycling', recycle: 'recycling',
  'waste disposal': 'waste_disposal', disposal: 'waste_disposal', waste: 'waste_disposal', garbage: 'waste_disposal',
  'estate cleanout': 'estate_cleanout', cleanout: 'estate_cleanout', cleanouts: 'estate_cleanout',
  estate: 'estate_cleanout', hoarding: 'estate_cleanout',
  'construction debris': 'construction_debris', 'construction waste': 'construction_debris',
  renovation: 'construction_debris', 'demo debris': 'construction_debris',
  other: 'other',
};

export function normalizeCategory(raw) {
  const value = String(raw || '').toLowerCase().trim().replace(/[\s-]+/g, ' ');
  if (!value) return 'other';
  if (CATEGORY_ALIASES[value]) return CATEGORY_ALIASES[value];
  const snake = value.replace(/\s+/g, '_');
  return SERVICE_CATEGORIES.includes(snake) ? snake : 'other';
}

export function normalizeCompetition(raw) {
  const value = String(raw || '').toLowerCase().trim();
  if (['low', 'medium', 'high'].includes(value)) return value;
  if (['0', '0.0-0.33'].includes(value)) return 'low';
  return 'unknown';
}

// Deduplicate: one record per (keyword, geo_key, period). The freshest
// observation wins (latest last_updated, then the higher volume), so
// overlapping keyword variants and re-imported rows never double-count.
export function dedupeObservations(rows) {
  const best = new Map();
  for (const r of rows || []) {
    const key = `${String(r.keyword || '').toLowerCase().trim()}|${r.geo_key || ''}|${r.period || ''}`;
    const prev = best.get(key);
    if (!prev) { best.set(key, r); continue; }
    const prevTime = Date.parse(prev.last_updated || '') || 0;
    const curTime = Date.parse(r.last_updated || '') || 0;
    if (curTime > prevTime || (curTime === prevTime && (r.est_monthly_volume || 0) > (prev.est_monthly_volume || 0))) {
      best.set(key, r);
    }
  }
  return [...best.values()];
}

// Aggregate deduped observations into the public industry-demand summary.
// All figures are labeled with their basis; trend indices are never presented
// as exact search counts.
export function summarizeDemand(deduped) {
  if (!deduped.length) {
    return { available: false, note: 'No verified demand observations on file yet. Industry figures appear once a volume source is imported and verified in the admin panel.' };
  }
  const periods = [...new Set(deduped.map((r) => r.period).filter(Boolean))].sort();
  const latest = periods[periods.length - 1] || '';
  const inLatest = deduped.filter((r) => r.period === latest);

  const sum = (rows) => rows.reduce((acc, r) => acc + (Number(r.est_monthly_volume) || 0), 0);

  const totalEst = sum(inLatest);

  const byCategory = SERVICE_CATEGORIES
    .map((cat) => ({ category: cat, label: CATEGORY_LABELS[cat], volume: sum(inLatest.filter((r) => r.service_category === cat)) }))
    .filter((c) => c.volume > 0)
    .sort((a, b) => b.volume - a.volume);

  const prevP = previousPeriod(latest);
  const fastestGrowing = SERVICE_CATEGORIES
    .map((cat) => {
      const cur = sum(deduped.filter((r) => r.service_category === cat && r.period === latest));
      const prev = sum(deduped.filter((r) => r.service_category === cat && r.period === prevP));
      if (!cur || !prev) return null;
      return { category: cat, label: CATEGORY_LABELS[cat], current: cur, previous: prev, growth_pct: Math.round(((cur - prev) / prev) * 1000) / 10 };
    })
    .filter(Boolean)
    .sort((a, b) => b.growth_pct - a.growth_pct)
    .slice(0, 5);

  const provinceRows = inLatest.filter((r) => r.geo_type === 'province' && r.province_code);
  const byProvinceMap = new Map();
  for (const r of provinceRows) {
    const code = r.province_code;
    byProvinceMap.set(code, (byProvinceMap.get(code) || 0) + (Number(r.est_monthly_volume) || 0));
  }
  const maxProvince = Math.max(0, ...byProvinceMap.values());
  const byProvince = [...byProvinceMap.entries()]
    .map(([code, volume]) => ({ province_code: code, province: PROVINCE_NAMES[code] || code, volume, index: maxProvince ? Math.round((volume / maxProvince) * 100) : 0 }))
    .sort((a, b) => b.volume - a.volume);

  const cityRows = inLatest.filter((r) => r.geo_type === 'city' && r.city);
  const byCityMap = new Map();
  for (const r of cityRows) {
    const key = r.city;
    const e = byCityMap.get(key) || { city: key, province_code: r.province_code || '', volume: 0 };
    e.volume += Number(r.est_monthly_volume) || 0;
    byCityMap.set(key, e);
  }
  const byCity = [...byCityMap.values()].sort((a, b) => b.volume - a.volume);

  const topKeywords = [...inLatest]
    .filter((r) => (Number(r.est_monthly_volume) || 0) > 0)
    .sort((a, b) => (b.est_monthly_volume || 0) - (a.est_monthly_volume || 0))
    .slice(0, 12)
    .map((r) => ({
      keyword: r.keyword,
      category: r.service_category,
      label: CATEGORY_LABELS[r.service_category] || 'Other',
      geo_key: r.geo_key || '',
      volume: r.est_monthly_volume || 0,
      trend_direction: r.trend_direction || 'unknown',
      competition: r.competition || 'unknown',
      source: r.source || '',
      volume_basis: r.volume_basis || 'admin_import',
      last_updated: r.last_updated || '',
    }));

  const sources = [...new Set(deduped.map((r) => r.source).filter(Boolean))];

  return {
    available: totalEst > 0 || inLatest.length > 0,
    latest_period: latest,
    periods,
    total_est_monthly_searches: totalEst,
    volume_basis: [...new Set(inLatest.map((r) => r.volume_basis).filter(Boolean))],
    sources,
    by_category: byCategory,
    fastest_growing: fastestGrowing,
    by_province: byProvince,
    by_city: byCity,
    top_keywords: topKeywords,
    observations_in_latest_period: inLatest.length,
  };
}