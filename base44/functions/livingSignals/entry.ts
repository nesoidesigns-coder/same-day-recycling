import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { detectMarkets } from '../../shared/demandTaxonomy.ts';
import { checkRateLimit, rateLimitedResponse } from '../../shared/rateLimit.ts';
import { isTestPartner } from '../../shared/coverageStatus.ts';
import { capacityByCity, partnerCoversCity } from '../../shared/territory.ts';
import { DEFAULT_PRICES, resolveCityPrices } from '../../shared/pricing.ts';

// Living Signals engine — one normalized feed for every Living Signals
// display. It reads only verified records (DemandSignal findings, verified
// Partner availability, published PricingSettings) and returns aggregates
// plus sanitized findings. Customer identities, addresses and contractor
// personal information never leave this function; confirmed bookings are
// excluded from public findings entirely.
//
// Search interest is always a labelled record count / relative index — never
// blended with request or booking counts, never presented as live activity.

const DAY_MS = 86400000;
const DAY_WINDOWS = [7, 28, 30, 90, 365];

const MARKET_CATEGORIES = [
  'furniture_appliance_removal',
  'moving_downsizing',
  'renovation_construction_debris',
  'property_management_turnover',
  'recycling_specialty_disposal',
  'commercial_office_cleanouts',
  'urgent_same_day',
  'donation_reuse_circular',
];

const ACTIVITY_TYPES = ['observed_public_request', 'platform_inquiry', 'qualified_opportunity', 'confirmed_booking'];
const FINDING_TYPES = ['observed_public_request', 'search_interest', 'market_indicator'];

const VERIFICATION = {
  internal_record: 'verified',
  verified_source: 'verified',
  public_source: 'public',
  aggregate_data: 'aggregate',
};

const items = (p) => (Array.isArray(p) ? p : p?.items) || [];

const norm = (v) => String(v || '').toLowerCase().trim();

function normalizeFinding(s) {
  const cityResolved = s.city && s.geo_confidence && s.geo_confidence !== 'unresolved';
  const metric = s.demand_type === 'search_interest' && s.metric_context?.trend_index != null
    ? { value: s.metric_context.trend_index, unit: 'index' }
    : null;
  return {
    id: s.signal_key || s.id,
    finding_type: s.demand_type || 'unknown',
    category: (s.market_categories || [])[0] || 'other',
    title: String(s.title || '').slice(0, 220),
    location: {
      city: cityResolved ? String(s.city).trim() : '',
      province_code: s.province_code || '',
    },
    metric,
    source: s.source_platform || 'unlabelled',
    source_url: s.source_url || '',
    observed_at: s.source_published_at || s.collected_at || s.created_date || null,
    updated_at: s.last_verified_at || s.collected_at || s.updated_date || null,
    verification: VERIFICATION[s.source_reliability] || 'public',
    visibility: 'public',
  };
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const limited = await checkRateLimit(base44, req, 'livingSignals', 240);
    if (!limited.allowed) return rateLimitedResponse();

    const body = await req.json().catch(() => ({}));
    const days = DAY_WINDOWS.includes(Number(body?.days)) ? Number(body.days) : 90;
    const scope = ['national', 'province', 'city'].includes(body?.scope) ? body.scope : 'national';
    const city = scope === 'city' ? String(body?.city || '').trim().slice(0, 80) : '';
    const province = scope === 'province' ? String(body?.province || '').trim().toUpperCase().slice(0, 2) : '';
    const category = MARKET_CATEGORIES.includes(body?.category) ? body.category : '';

    const startIso = new Date(Date.now() - days * DAY_MS).toISOString();

    const [signalsP, partnersP, pricingP, userP] = await Promise.allSettled([
      base44.asServiceRole.entities.DemandSignal.list({ sort: '-created_date', limit: 1000 }),
      base44.asServiceRole.entities.Partner.filter({ active: true, verified: true }, { limit: 500 }),
      base44.asServiceRole.entities.PricingSettings.filter(
        city ? { city } : { $or: [{ city: { $exists: false } }, { city: '' }] }, { limit: 1 }
      ),
      base44.auth.me().catch(() => null),
    ]);

    const user = userP.status === 'fulfilled' ? userP.value : null;

    // Surface rejected reads instead of silently rendering an empty feed.
    const readErrors: Record<string, string> = {};
    for (const [name, p] of [['signals', signalsP], ['partners', partnersP], ['pricing', pricingP]] as const) {
      if (p.status === 'rejected') readErrors[name] = String(p.reason?.message || p.reason);
    }

    let signals = items(signalsP.value).filter((s) => s.created_date >= startIso);
    const allSignals = signals;
    const partners = items(partnersP.value).filter((p) => !isTestPartner(p));

    // Scope filtering — exact city match only (never proximity or substring).
    if (city) {
      const target = norm(city);
      signals = signals.filter((s) => norm(s.city) === target && s.geo_confidence !== 'unresolved');
    }
    if (province) signals = signals.filter((s) => norm(s.province_code) === norm(province));
    if (category) signals = signals.filter((s) => (s.market_categories || []).includes(category));

    const activityRecords = signals.filter((s) => ACTIVITY_TYPES.includes(s.demand_type));
    const searchRecords = signals.filter((s) => s.demand_type === 'search_interest');

    const categoryCounts = MARKET_CATEGORIES
      .map((key) => ({ key, count: signals.filter((s) => (s.market_categories || []).includes(key)).length }))
      .filter((r) => r.count > 0);

    // Verified contractor availability — measured from Partner records only.
    const cityPartners = city ? partners.filter((p) => partnerCoversCity(p, city)) : partners;
    const availableContractors = cityPartners.filter((p) => (p.availability || 'available') !== 'unavailable');
    const capacity = capacityByCity(cityPartners);

    // Published pricing — the authoritative pricing configuration only.
    const priceRows = items(pricingP.value);
    const prices = priceRows[0] ? resolveCityPrices(priceRows[0]) : { ...DEFAULT_PRICES };

    const demandGauge = {
      value: activityRecords.length,
      unit: 'observations',
      available: activityRecords.length > 0,
      basis: 'counted demand records — observed public requests, platform inquiries and confirmed work, each labelled',
      observed_at: activityRecords[0]?.source_published_at || activityRecords[0]?.created_date || null,
      updated_at: new Date().toISOString(),
      source: 'Recycling OS demand records (test fixtures and cancelled intake excluded)',
      verification: 'verified',
    };

    const searchGauge = {
      value: searchRecords.length,
      unit: 'search-intelligence records',
      available: searchRecords.length > 0,
      basis: 'relative search-interest records — an indicator of interest, never a count of requests and never a guarantee of contractor availability',
      observed_at: searchRecords[0]?.source_published_at || searchRecords[0]?.created_date || null,
      updated_at: new Date().toISOString(),
      source: 'search intelligence records (Google Search Console syncs and keyword datasets)',
      verification: 'verified',
    };

    const availabilityGauge = {
      value: availableContractors.length,
      unit: 'verified contractors',
      available: cityPartners.length > 0,
      basis: 'active verified contractors whose explicitly confirmed territory includes this location — availability is re-confirmed per job, never guaranteed in advance',
      updated_at: new Date().toISOString(),
      source: 'verified partner territory records',
      verification: 'verified',
    };

    const pricingGauge = {
      value: prices.minimum_pickup ?? null,
      unit: 'CAD from',
      available: prices.minimum_pickup != null,
      basis: 'published base rate for the minimum pickup tier; the final price is approved by the customer before any work',
      observed_at: priceRows[0]?.updated_date || null,
      updated_at: new Date().toISOString(),
      source: 'published pricing configuration',
      verification: 'verified',
    };

    // Canada Signal — ACTUAL customer search demand. The gauge counts real
    // searches (Google Search Console impressions for this site, ~2-day
    // reporting lag), matched to service categories by deterministic keyword
    // rules. No relative scoring, no index, and never blended with requests,
    // bookings or contractor availability.
    let gscQueries: Array<{ query: string; clicks: number; impressions: number }> | null = null;
    let gscError = '';
    try {
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
      const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!sitesRes.ok) {
        gscError = `Search Console sites request failed (${sitesRes.status})`;
      } else {
        const sitesData = await sitesRes.json();
        const sites = (sitesData.siteEntry || []).map((s) => s.siteUrl);
        const target = sites.find((s) => s.includes('samedayrecycling.ca')) || sites[0] || '';
        if (!target) {
          gscError = 'No verified Search Console property';
        } else {
          const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
          const endD = new Date();
          endD.setUTCDate(endD.getUTCDate() - 2);
          const startD = new Date(endD);
          startD.setUTCDate(startD.getUTCDate() - (days - 1));
          const analyticsRes = await fetch(
            `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(target)}/searchAnalytics/query`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ startDate: fmtDate(startD), endDate: fmtDate(endD), dimensions: ['query'], rowLimit: 250 }),
              signal: AbortSignal.timeout(10000),
            }
          );
          if (!analyticsRes.ok) {
            gscError = `Search Analytics request failed (${analyticsRes.status})`;
          } else {
            const rows = (await analyticsRes.json()).rows || [];
            gscQueries = rows.map((r) => ({ query: String(r.keys[0] || ''), clicks: r.clicks || 0, impressions: r.impressions || 0 }));
          }
        }
      }
    } catch (e) {
      gscError = String(e?.message || e);
    }

    const queryCategories = (q: { query: string }) => detectMarkets(q.query);
    let searchQueries = gscQueries ? gscQueries.filter((q) => queryCategories(q).length > 0) : null;
    if (searchQueries && city) searchQueries = searchQueries.filter((q) => norm(q.query).includes(norm(city)));
    if (searchQueries && category) searchQueries = searchQueries.filter((q) => queryCategories(q).includes(category));

    const totalSearches = searchQueries ? searchQueries.reduce((a, q) => a + q.impressions, 0) : null;
    const totalClicks = searchQueries ? searchQueries.reduce((a, q) => a + q.clicks, 0) : null;

    const signalCategories = MARKET_CATEGORIES.map((key) => {
      const qs = gscQueries ? gscQueries.filter((q) => queryCategories(q).includes(key)) : [];
      const searches = qs.reduce((a, q) => a + q.impressions, 0);
      return {
        key,
        value: gscQueries ? searches : null,
        clicks: qs.reduce((a, q) => a + q.clicks, 0),
        record_count: qs.length,
        available: gscQueries ? searches > 0 : false,
      };
    });

    const signal = {
      name: 'Customer Search Demand',
      available: gscQueries != null,
      value: totalSearches,
      clicks: totalClicks,
      unit: 'searches',
      scale: 'actual count',
      period: `last ${days} days`,
      coverage: 'Google Search Console queries for this site, matched to service categories by keyword rules',
      methodology:
        'Actual counts of customer searches (impressions) recorded in Google Search Console for this site, with roughly a 2-day reporting lag. Each search query is matched to service categories by deterministic keyword rules; the total counts each search once, and a search may appear in more than one matching category. Never a score or index, and never blended with requests, bookings or contractor availability.',
      source: 'Google Search Console (verified)',
      verification: 'verified',
      categories: signalCategories,
      updated_at: new Date().toISOString(),
    };

    const findings = signals
      .filter((s) => FINDING_TYPES.includes(s.demand_type) && (s.market_categories || []).length > 0
        && (s.demand_type !== 'search_interest' || Number(s.metric_context?.trend_index) > 0))
      .sort((a, b) => String(b.source_published_at || b.created_date || '').localeCompare(String(a.source_published_at || a.created_date || '')))
      .slice(0, 12)
      .map(normalizeFinding);

    const result = {
      generated_at: new Date().toISOString(),
      read_errors: readErrors,
      filters: { scope, province: province || 'all', city: city || 'all', category: category || 'all', window_days: days },
      gauges: {
        recorded_activity: demandGauge,
        search_interest: searchGauge,
        contractor_availability: availabilityGauge,
        published_pricing: pricingGauge,
      },
      category_counts: categoryCounts,
      coverage_cities: Object.keys(capacity).sort((a, b) => a.localeCompare(b)),
      partners: { total: cityPartners.length, available: availableContractors.length, same_day: cityPartners.filter((p) => p.same_day_capable).length },
      findings,
      signal,
      insufficient: {
        recorded_activity: activityRecords.length === 0 ? 'No recorded demand for this selection in the window yet.' : null,
        search_interest: searchRecords.length === 0 ? 'No search-intelligence records for this selection yet.' : null,
        contractor_availability: cityPartners.length === 0 ? 'No verified contractor covers this location yet — requests remain open nationwide.' : null,
        search_demand: gscQueries == null
          ? `Customer search counts are unavailable right now (${gscError || 'Search Console connection'}).`
          : totalSearches === 0 ? 'No customer searches recorded in Search Console for this selection yet.' : null,
      },
    };

    // Admin-only internal block: operational counters stay out of every
    // public payload unless the caller is an authenticated admin.
    if (user?.role === 'admin') {
      const [bookingsP, quotesP] = await Promise.allSettled([
        base44.asServiceRole.entities.Booking.count({ status: 'new' }),
        base44.asServiceRole.entities.QuoteLead.count({ status: 'new' }),
      ]);
      result.internal = {
        visibility: 'admin_only',
        bookings_awaiting: bookingsP.status === 'fulfilled' ? bookingsP.value : null,
        quotes_awaiting: quotesP.status === 'fulfilled' ? quotesP.value : null,
        internal_signals: signals.filter((s) => s.source_type === 'internal_platform').length,
      };
    }

    return Response.json(result);
  } catch (e) {
    return Response.json({ error: 'Living Signals feed is unavailable right now.', detail: String(e?.message || e) }, { status: 500 });
  }
}