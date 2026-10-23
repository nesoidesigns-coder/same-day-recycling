import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { normalizeCategory, normalizeCompetition, currentPeriod } from '../../shared/demand.ts';

// Google Ads Keyword Planner retrieval — the ONLY authorized automated volume
// source. Pulls monthly search-volume estimates for every major Canadian
// recycling / junk-removal category across Canada, each province and key
// cities, then upserts source-labeled DemandObservation records. Volumes come
// straight from the API; nothing is estimated, zero-filled or fabricated.

const REQUIRED = [
  'GOOGLE_ADS_DEVELOPER_TOKEN',
  'GOOGLE_ADS_CUSTOMER_ID',
  'GOOGLE_ADS_CLIENT_ID',
  'GOOGLE_ADS_CLIENT_SECRET',
  'GOOGLE_ADS_REFRESH_TOKEN',
];

const SEEDS = [
  'junk removal',
  'furniture removal',
  'appliance removal',
  'mattress disposal',
  'estate cleanout services',
  'construction waste removal',
  'electronics recycling',
  'waste disposal services',
  'recycling pickup',
  'yard waste removal',
  'commercial waste removal',
  'hot tub removal',
  'scrap metal recycling',
  'bin rental',
  'same day junk removal',
];

const PROVINCE_NAMES = {
  AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', NT: 'Northwest Territories',
  NU: 'Nunavut', ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec',
  SK: 'Saskatchewan', YT: 'Yukon',
};

const CITIES = [
  'Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'Coquitlam', 'Langley',
  'Victoria', 'Abbotsford', 'Kelowna', 'Toronto', 'Mississauga', 'Brampton',
  'Ottawa', 'Montreal', 'Calgary', 'Edmonton', 'Winnipeg', 'Halifax',
];

const normName = (s) =>
  String(s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ').trim();

function trendFrom(vols) {
  const nums = (vols || []).map((v) => Number(v.monthlySearches) || 0).filter((v) => v > 0);
  if (nums.length < 2) return 'unknown';
  const last = nums[nums.length - 1];
  const prev = nums[nums.length - 2];
  if (!prev) return 'unknown';
  const pct = (last - prev) / prev;
  if (pct > 0.1) return 'rising';
  if (pct < -0.1) return 'falling';
  return 'steady';
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const payload = await req.json().catch(() => ({}));
    const svc = base44.asServiceRole;
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const started = now.toISOString();
    const period = currentPeriod(now);
    const CADENCE = 'Monthly retrieval via Google Ads API (Keyword Planner volumes are monthly estimates)';

    // Connection check (no API work) — also used by the admin panel.
    const missing = REQUIRED.filter((n) => !secrets.get(n));
    if (payload.checkOnly || missing.length > 0) {
      return Response.json({
        ok: true,
        status: missing.length ? 'unavailable' : 'connected',
        connected: missing.length === 0,
        missing,
        period,
        cadence: CADENCE,
      });
    }

    // ---- 1. OAuth access token from the refresh token ----
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: secrets.get('GOOGLE_ADS_CLIENT_ID'),
        client_secret: secrets.get('GOOGLE_ADS_CLIENT_SECRET'),
        refresh_token: secrets.get('GOOGLE_ADS_REFRESH_TOKEN'),
        grant_type: 'refresh_token',
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!tokenRes.ok) {
      const t = await tokenRes.text().catch(() => '');
      return Response.json({ ok: false, status: 'failed', error: `Google OAuth token exchange failed (${tokenRes.status}): ${t.slice(0, 300)}` });
    }
    const { access_token } = await tokenRes.json();
    const customerId = String(secrets.get('GOOGLE_ADS_CUSTOMER_ID')).replace(/\D/g, '');
    const devToken = secrets.get('GOOGLE_ADS_DEVELOPER_TOKEN');
    const authHeaders = {
      Authorization: `Bearer ${access_token}`,
      'developer-token': devToken,
      'login-customer-id': customerId,
      'Content-Type': 'application/json',
    };

    // ---- 2. Resolve Canadian geo targets (national fixed, rest by name) ----
    let API = 'https://googleads.googleapis.com/v18';
    const nameList = [...new Set([...Object.values(PROVINCE_NAMES), ...CITIES])]
      .map((n) => `'${n.replace(/'/g, "\\'")}'`)
      .join(', ');
    const geoQuery = `SELECT geo_target_constant.resource_name, geo_target_constant.canonical_name, geo_target_constant.country_code, geo_target_constant.target_type FROM geo_target_constant WHERE geo_target_constant.canonical_name IN (${nameList})`;
    const geoSearch = async () =>
      fetch(`${API}/customers/${customerId}/googleAds:search`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ query: geoQuery, pageSize: 500 }),
        signal: AbortSignal.timeout(20000),
      });
    let geoRes = await geoSearch();
    if (!geoRes.ok && [400, 404].includes(geoRes.status)) {
      API = 'https://googleads.googleapis.com/v17';
      geoRes = await geoSearch();
    }
    if (!geoRes.ok) {
      const t = await geoRes.text().catch(() => '');
      return Response.json({ ok: false, status: 'failed', error: `Google Ads geo target lookup failed (${geoRes.status}): ${t.slice(0, 300)}` });
    }
    const geoData = await geoRes.json();
    const geoIndex = new Map();
    for (const r of geoData.results || []) {
      if ((r.countryCode || r.country_code || '') !== 'CA') continue;
      geoIndex.set(normName(r.canonicalName || r.canonical_name), r.resourceName || r.resource_name);
    }

    const scopeDefs = [
      { scope: 'national', label: 'Canada (national)', geo_type: 'national', geo_key: 'CA', province_code: '', city: '', resource: 'geoTargetConstants/2124' },
      ...Object.entries(PROVINCE_NAMES).map(([code, name]) => ({
        scope: `province:${code}`, label: `${name} (province)`, geo_type: 'province', geo_key: code,
        province_code: code, city: '', resource: geoIndex.get(normName(name)) || '',
      })),
      ...CITIES.map((city) => ({
        scope: `city:${city}`, label: `${city} (city)`, geo_type: 'city', geo_key: city,
        province_code: '', city, resource: geoIndex.get(normName(city)) || '',
      })),
    ];
    const runnable = scopeDefs.filter((s) => s.resource);
    const unresolved = scopeDefs.filter((s) => !s.resource).map((s) => s.label);

    // ---- 3. Keyword ideas per geography, batches of 6 ----
    const callIdeas = async (scope) => {
      const res = await fetch(`${API}/customers/${customerId}:generateKeywordIdeas`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          keywordSeed: { keywords: SEEDS },
          geoTargetConstants: [scope.resource],
          languageConstant: 'languageConstants/1000',
          keywordPlanNetwork: 'GOOGLE_SEARCH',
          pageSize: 100,
        }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`generateKeywordIdeas failed (${res.status}): ${t.slice(0, 200)}`);
      }
      const data = await res.json();
      return data.ideas || [];
    };

    const results = [];
    for (let i = 0; i < runnable.length; i += 6) {
      const batch = runnable.slice(i, i + 6);
      const settled = await Promise.allSettled(batch.map((s) => callIdeas(s)));
      settled.forEach((r, j) => {
        if (r.status === 'fulfilled') results.push({ scope: batch[j], ideas: r.value, error: '' });
        else results.push({ scope: batch[j], ideas: null, error: String((r.reason && r.reason.message) || r.reason) });
      });
    }

    // ---- 4. Keep the top 3 keyword observations per category per geography ----
    const records = [];
    const failedGeos = [];
    for (const r of results) {
      if (!r.ideas) { failedGeos.push(`${r.scope.label}: ${r.error}`); continue; }
      const perCat = new Map();
      for (const idea of r.ideas) {
        const m = idea.keywordIdeaMetrics;
        if (!m || !(Number(m.avgMonthlySearches) > 0)) continue;
        const cat = normalizeCategory(m.keyword);
        if (cat === 'other') continue;
        if (!perCat.has(cat)) perCat.set(cat, []);
        perCat.get(cat).push({
          keyword: m.keyword,
          volume: Number(m.avgMonthlySearches),
          competition: normalizeCompetition(String(m.competition || 'unknown')),
          trend: trendFrom(m.monthlySearchVolumes),
        });
      }
      for (const [cat, entries] of perCat) {
        entries.sort((a, b) => b.volume - a.volume);
        for (const e of entries.slice(0, 3)) {
          records.push({
            geo_type: r.scope.geo_type,
            geo_key: r.scope.geo_key,
            province_code: r.scope.province_code || '',
            city: r.scope.city || '',
            service_category: cat,
            keyword: e.keyword,
            period,
            est_monthly_volume: e.volume,
            volume_basis: 'keyword_planner',
            trend_index: 0,
            trend_direction: e.trend,
            competition: e.competition,
            source: 'Google Ads Keyword Planner (API)',
            source_url: 'https://ads.google.com/aw/keywordplanner/home',
            methodology_note: 'Google Ads Keyword Planner monthly search-volume estimates for the geography, retrieved via the Google Ads API. Overlapping keyword variants are deduplicated at aggregation time.',
            last_updated: today,
          });
        }
      }
    }

    // ---- 5. Upsert against existing observations for this period ----
    const existingPage = await svc.entities.DemandObservation.filter({ period }, { limit: 1000 });
    const existing = new Map();
    for (const row of existingPage.items || []) {
      existing.set(`${(row.keyword || '').toLowerCase()}|${row.geo_key || ''}|${row.geo_type || ''}`, row);
    }
    const updates = [];
    const creates = [];
    const seen = new Set();
    for (const rec of records) {
      const key = `${rec.keyword.toLowerCase()}|${rec.geo_key}|${rec.geo_type}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const match = existing.get(key);
      if (match) {
        updates.push({
          id: match.id,
          est_monthly_volume: rec.est_monthly_volume,
          competition: rec.competition,
          trend_direction: rec.trend_direction,
          volume_basis: rec.volume_basis,
          source: rec.source,
          source_url: rec.source_url,
          methodology_note: rec.methodology_note,
          last_updated: rec.last_updated,
        });
      } else {
        creates.push(rec);
      }
    }
    for (let i = 0; i < creates.length; i += 100) {
      await svc.entities.DemandObservation.bulkCreate(creates.slice(i, i + 100));
    }
    for (let i = 0; i < updates.length; i += 100) {
      await svc.entities.DemandObservation.bulkUpdate(updates.slice(i, i + 100));
    }

    // ---- 6. Log the run honestly ----
    const okGeos = results.filter((r) => r.ideas).length;
    const status = okGeos === 0 ? 'failed' : failedGeos.length ? 'partial' : 'success';
    const coverageParts = [
      `${okGeos}/${runnable.length} geographies returned volumes (${records.length} keyword observations).`,
      unresolved.length ? `Unresolved geo targets: ${unresolved.join(', ')}.` : '',
      failedGeos.length ? `Failed: ${failedGeos.slice(0, 5).join(' | ')}.` : '',
    ].filter(Boolean).join(' ');

    await svc.entities.DemandSyncLog.create({
      source: 'google_ads_keyword_planner',
      status,
      run_date: today,
      started_at: started,
      finished_at: new Date().toISOString(),
      records_upserted: creates.length + updates.length,
      period,
      coverage_note: coverageParts,
      error: failedGeos.length ? failedGeos[0] : '',
      next_update_cadence: CADENCE,
    });

    return Response.json({
      ok: true,
      status,
      records_upserted: creates.length + updates.length,
      geos_ok: okGeos,
      geos_total: runnable.length,
      period,
      coverage_note: coverageParts,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}