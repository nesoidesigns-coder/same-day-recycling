// National Demand Intelligence — shared aggregation logic (server side).
// The industry layer never fabricates data: it sums admin-verified,
// source-labeled DemandObservation records only, deduplicated so overlapping
// keyword variants and duplicate geographic records are never counted twice.

export const SERVICE_CATEGORIES = [
  'junk_removal', 'furniture_removal', 'mattress_disposal', 'appliance_removal', 'electronics',
  'recycling', 'waste_disposal', 'estate_cleanout', 'construction_debris', 'demolition_cleanup',
  'yard_waste_removal', 'commercial_waste', 'hot_tub_removal', 'scrap_metal',
  'bin_rentals', 'same_day_pickup', 'other',
];

// Every tracked service category (all but "other") shown on the homepage
// market-demand dashboard.
export const MARKET_CATEGORIES = SERVICE_CATEGORIES.filter((c) => c !== 'other');

export const CATEGORY_LABELS = {
  junk_removal: 'Junk Removal',
  furniture_removal: 'Furniture Removal',
  appliance_removal: 'Appliance Removal',
  mattress_disposal: 'Mattress Disposal',
  electronics: 'Electronics Recycling',
  recycling: 'Recycling',
  waste_disposal: 'Waste Disposal',
  estate_cleanout: 'Estate Cleanouts',
  construction_debris: 'Construction Debris',
  demolition_cleanup: 'Demolition Cleanup',
  yard_waste_removal: 'Yard Waste Removal',
  commercial_waste: 'Commercial Waste Removal',
  hot_tub_removal: 'Hot Tub Removal',
  scrap_metal: 'Scrap Metal Recycling',
  bin_rentals: 'Bin Rentals',
  same_day_pickup: 'Same-Day Junk Pickup',
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
  'furniture removal': 'furniture_removal', furniture: 'furniture_removal',
  mattress: 'mattress_disposal', 'mattress disposal': 'mattress_disposal',
  'mattress removal': 'mattress_disposal', 'mattress recycling': 'mattress_disposal',
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
  'demolition cleanup': 'demolition_cleanup', 'demolition clean up': 'demolition_cleanup',
  'yard waste': 'yard_waste_removal', 'yard waste removal': 'yard_waste_removal',
  'yard cleanup': 'yard_waste_removal', leaves: 'yard_waste_removal', 'branch removal': 'yard_waste_removal',
  'commercial waste': 'commercial_waste', 'commercial waste removal': 'commercial_waste',
  'commercial junk removal': 'commercial_waste',
  'hot tub': 'hot_tub_removal', 'hot tub removal': 'hot_tub_removal', 'spa removal': 'hot_tub_removal',
  'scrap metal': 'scrap_metal', 'scrap metal recycling': 'scrap_metal', 'metal recycling': 'scrap_metal',
  'bin rental': 'bin_rentals', 'bin rentals': 'bin_rentals', 'dumpster rental': 'bin_rentals',
  'disposal bin': 'bin_rentals',
  'same day junk removal': 'same_day_pickup', 'same day pickup': 'same_day_pickup',
  'same day junk pickup': 'same_day_pickup',
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

// ---------------------------------------------------------------------------
// Market intelligence (homepage gauges): per-geography, per-category demand
// aggregates from deduped observations. Estimates only — never fabricated,
// never zero-filled, and Search Console visibility is never used here.
// ---------------------------------------------------------------------------

const normGeo = (s) => String(s || '').trim().toLowerCase();

function sumVol(rows) {
  return rows.reduce((a, r) => a + (Number(r.est_monthly_volume) || 0), 0);
}

function summarizeMarketCategory(rows, prevRows, cat) {
  const catRows = rows.filter((r) => r.service_category === cat);
  if (!catRows.length) return { category: cat, label: CATEGORY_LABELS[cat], available: false };
  const volRows = catRows.filter((r) => (Number(r.est_monthly_volume) || 0) > 0);
  const idxRows = catRows.filter((r) => (Number(r.trend_index) || 0) > 0);
  let value, unit, prevValue = null;
  if (volRows.length) {
    value = sumVol(volRows);
    unit = 'searches';
    const prevVolRows = prevRows.filter((r) => r.service_category === cat && (Number(r.est_monthly_volume) || 0) > 0);
    if (prevVolRows.length) prevValue = sumVol(prevVolRows);
  } else if (idxRows.length) {
    value = Math.round(idxRows.reduce((a, r) => a + (Number(r.trend_index) || 0), 0) / idxRows.length);
    unit = 'index';
    const prevIdxRows = prevRows.filter((r) => r.service_category === cat && (Number(r.trend_index) || 0) > 0);
    if (prevIdxRows.length) {
      prevValue = Math.round(prevIdxRows.reduce((a, r) => a + (Number(r.trend_index) || 0), 0) / prevIdxRows.length);
    }
  } else {
    return { category: cat, label: CATEGORY_LABELS[cat], available: false };
  }
  const lastUpdated = catRows.map((r) => String(r.last_updated || '')).sort().pop() || '';
  return {
    category: cat,
    label: CATEGORY_LABELS[cat],
    available: true,
    value,
    unit,
    prev_value: prevValue,
    trend_pct: prevValue ? Math.round(((value - prevValue) / prevValue) * 1000) / 10 : null,
    trend_direction: catRows[0].trend_direction || 'unknown',
    last_updated: lastUpdated,
    volume_basis: [...new Set(catRows.map((r) => r.volume_basis).filter(Boolean))],
    sources: [...new Set(catRows.map((r) => r.source).filter(Boolean))],
    keywords: catRows.length,
  };
}

// One geographic scope. Only rows at the scope's own geography level are
// aggregated (national rows for Canada, province rows for a province, city
// rows for a city), with a documented fallback when a level has no data —
// levels are mutually exclusive, so the same keyword is never double-counted
// across national, provincial and city summaries of the same period.
export function marketScopeSummary(deduped, geoType, geoKey) {
  const periods = [...new Set(deduped.map((r) => r.period).filter(Boolean))].sort();
  const latest = periods[periods.length - 1] || '';
  if (!latest) {
    return { available: false, note: 'No verified demand observations on file yet. Market figures appear once a Keyword Planner or licensed dataset is connected or imported and verified in the admin panel.' };
  }
  const prevP = previousPeriod(latest);

  let rows, level, level_note;
  if (geoType === 'national') {
    const nat = deduped.filter((r) => r.period === latest && r.geo_type === 'national');
    const prov = deduped.filter((r) => r.period === latest && r.geo_type === 'province');
    const city = deduped.filter((r) => r.period === latest && r.geo_type === 'city');
    if (nat.length) { rows = nat; level = 'national'; level_note = 'National-level estimates'; }
    else if (prov.length) { rows = prov; level = 'province'; level_note = 'Aggregated from provincial estimates (no overlapping national rows)'; }
    else { rows = city; level = 'city'; level_note = 'Aggregated from city-level estimates (no overlapping national or provincial rows)'; }
  } else if (geoType === 'province') {
    const prov = deduped.filter((r) => r.period === latest && r.geo_type === 'province' && normGeo(r.province_code) === normGeo(geoKey));
    const city = deduped.filter((r) => r.period === latest && r.geo_type === 'city' && normGeo(r.province_code) === normGeo(geoKey));
    if (prov.length) { rows = prov; level = 'province'; level_note = `${PROVINCE_NAMES[normGeo(geoKey).toUpperCase()] || geoKey} provincial estimates`; }
    else { rows = city; level = 'city'; level_note = `Aggregated from city-level estimates in ${PROVINCE_NAMES[normGeo(geoKey).toUpperCase()] || geoKey}`; }
  } else {
    rows = deduped.filter((r) => r.period === latest && r.geo_type === 'city' && normGeo(r.city) === normGeo(geoKey));
    level = 'city';
    level_note = `${geoKey} city-level estimates`;
  }
  if (!rows.length) {
    return { available: false, latest_period: latest, note: 'Data pending — no observations for this geography and period yet.' };
  }

  const prevRows = deduped.filter((r) => r.period === prevP && rowsMatchScope(r, geoType, geoKey, level));
  const categories = MARKET_CATEGORIES.map((cat) => summarizeMarketCategory(rows, prevRows, cat));

  // Scope total: only when at least one volume-based (defensible,
  // deduplicated) estimate exists. Trend indices are never summed.
  const volRows = rows.filter((r) => (Number(r.est_monthly_volume) || 0) > 0);
  const idxOnly = rows.length > 0 && volRows.length === 0;
  const total = volRows.length
    ? {
        available: true,
        value: sumVol(volRows),
        unit: 'searches',
        prev_value: sumVol(deduped.filter((r) => r.period === prevP && rowsMatchScope(r, geoType, geoKey, level) && (Number(r.est_monthly_volume) || 0) > 0)) || null,
        keywords: volRows.length,
        index_only_count: rows.length - volRows.length,
      }
    : { available: false, note: idxOnly ? 'Only relative interest indices are on file for this scope — indices are never summed into a search total.' : 'No volume-based estimate on file for this scope yet.' };

  return {
    available: true,
    geo_type: geoType,
    geo_key: geoKey,
    level,
    level_note,
    latest_period: latest,
    previous_period: prevP,
    categories,
    total,
    last_updated: rows.map((r) => String(r.last_updated || '')).sort().pop() || '',
    sources: [...new Set(rows.map((r) => r.source).filter(Boolean))],
    volume_basis: [...new Set(rows.map((r) => r.volume_basis).filter(Boolean))],
  };
}

function rowsMatchScope(row, geoType, geoKey, level) {
  if (geoType === 'national') {
    if (level === 'national') return row.geo_type === 'national';
    if (level === 'province') return row.geo_type === 'province';
    return row.geo_type === 'city';
  }
  if (geoType === 'province') {
    const code = normGeo(geoKey);
    if (level === 'province') return row.geo_type === 'province' && normGeo(row.province_code) === code;
    return row.geo_type === 'city' && normGeo(row.province_code) === code;
  }
  return row.geo_type === 'city' && normGeo(row.city) === normGeo(geoKey);
}

// Full homepage market-intelligence payload: every geography that has data,
// pre-aggregated, so the frontend only filters.
export function marketIntelligence(deduped) {
  const periods = [...new Set(deduped.map((r) => r.period).filter(Boolean))].sort();
  const anyRows = deduped.length > 0;
  const provinces = [...new Set(
    deduped.filter((r) => r.geo_type === 'province' && r.province_code).map((r) => normGeo(r.province_code).toUpperCase())
  )];
  const cityMap = new Map();
  for (const r of deduped.filter((row) => row.geo_type === 'city' && row.city)) {
    const key = normGeo(r.city);
    if (!cityMap.has(key)) cityMap.set(key, { key: String(r.city).trim(), province_code: normGeo(r.province_code || '').toUpperCase() });
  }
  const cities = [...cityMap.values()];

  const scopes = {};
  scopes['CA'] = marketScopeSummary(deduped, 'national', 'CA');
  for (const code of provinces) scopes[code] = marketScopeSummary(deduped, 'province', code);
  for (const c of cities) scopes[c.key] = marketScopeSummary(deduped, 'city', c.key);

  return {
    available: anyRows,
    latest_period: periods[periods.length - 1] || '',
    periods,
    geo: { provinces, cities },
    scopes,
    pending_note: 'Estimated monthly search volumes come from Google Ads Keyword Planner or properly licensed keyword datasets; regional interest and seasonality come from Google Trends. Each figure carries its source and reporting date, and overlapping keyword variants are deduplicated before aggregation. Search Console visibility for Same Day Recycling is tracked separately and is never used as market demand.',
  };
}