import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { checkRateLimit, rateLimitedResponse } from '../../shared/rateLimit.ts';
import { isTestPartner } from '../../shared/coverageStatus.ts';
import { capacityByCity } from '../../shared/territory.ts';

// Same Day Recycling LIVE: public, aggregated intelligence feed.
// Every number is computed from real platform records and labelled with its
// source and timeframe. Internal-test fixtures, website traffic and cancelled
// intake never count as demand. Only aggregates leave this function — no
// customer or contractor personal data.

const DAY_MS = 86400000;
const DAY_WINDOWS = [7, 30, 90, 365];

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

const items = (p: any) => (Array.isArray(p) ? p : p?.items) || [];
const monthKey = (iso: string) => String(iso || '').slice(0, 7);
const valueOf = (p: any) => (p.status === 'fulfilled' ? items(p.value) : []);

// National overview: the four homepage intelligence cards.
async function overview(base44: any, days: number) {
  const startIso = new Date(Date.now() - days * DAY_MS).toISOString();
  const [leadsP, requestsP, signalsP, partnersP] = await Promise.allSettled([
    base44.asServiceRole.entities.QuoteLead.filter({ created_date: { $gte: startIso } }, { limit: 1000 }),
    base44.asServiceRole.entities.NationalRequest.filter({ record_type: 'service', created_date: { $gte: startIso } }, { limit: 1000 }),
    base44.asServiceRole.entities.DemandSignal.list({ limit: 1000 }),
    base44.asServiceRole.entities.Partner.filter({ active: true, verified: true }, { limit: 500 }),
  ]);

  const leads = valueOf(leadsP);
  const requests = valueOf(requestsP).filter((r: any) => r.record_type === 'service');
  const signals = valueOf(signalsP);
  const partners = valueOf(partnersP).filter((p: any) => !isTestPartner(p));

  const capacity = capacityByCity(partners);
  const cities = Object.keys(capacity).sort((a: string, b: string) => a.localeCompare(b));

  const recentSignals = signals.filter((s: any) => new Date(s.created_date).getTime() >= Date.now() - days * DAY_MS);
  const bySource: Record<string, number> = {};
  recentSignals.forEach((s: any) => {
    const k = s.source_platform || 'unlabelled';
    bySource[k] = (bySource[k] || 0) + 1;
  });
  const byCategory: Record<string, number> = {};
  signals.forEach((s: any) => (s.market_categories || []).forEach((c: string) => {
    byCategory[c] = (byCategory[c] || 0) + 1;
  }));

  const requestCount = leads.length + requests.length;
  return {
    window_days: days,
    generated_at: new Date().toISOString(),
    service_requests: {
      value: requestCount,
      available: requestCount > 0,
      source: 'QuoteLead + NationalRequest records (service requests only, test fixtures excluded)',
    },
    service_areas: {
      value: cities.length,
      available: cities.length > 0,
      cities,
      contractors: partners.length,
      same_day_capable: partners.filter((p: any) => p.same_day_capable).length,
      source: 'verified partner service territories (coverage records)',
    },
    market_signals: {
      value: recentSignals.length,
      available: recentSignals.length > 0,
      by_source: bySource,
      source: 'external demand observations (DemandSignal records), labelled by source platform',
    },
    service_categories: {
      count: Object.keys(byCategory).length,
      available: Object.keys(byCategory),
      source: 'market categories present in verified demand records',
    },
  };
}

// Filtered intelligence for the LIVE Centre gauge, map and trend.
async function gauge(base44: any, f: { days: number; province: string; city: string; category: string }) {
  const query: any = { created_date: { $gte: new Date(Date.now() - f.days * DAY_MS).toISOString() } };
  if (f.province) query.province_code = f.province;
  if (f.city) query.city = f.city;
  if (f.category) query.market_categories = f.category;

  const signals = items(await base44.asServiceRole.entities.DemandSignal.filter(query, { limit: 1000 }));

  const rows: any[] = [];
  for (const key of MARKET_CATEGORIES) {
    const matches = signals.filter((s: any) => (s.market_categories || []).includes(key));
    if (!matches.length) continue;
    const demand_types: Record<string, number> = {};
    matches.forEach((s: any) => {
      const t = s.demand_type || 'unknown';
      demand_types[t] = (demand_types[t] || 0) + 1;
    });
    rows.push({ key, count: matches.length, demand_types });
  }
  const uncategorised = signals.filter((s: any) => !(s.market_categories || []).length).length;

  const cityMap: any = {};
  signals.forEach((s: any) => {
    if (!s.city || s.geo_confidence === 'unresolved') return;
    const name = String(s.city).trim();
    const k = name.toLowerCase();
    cityMap[k] = cityMap[k] || { city: name, province_code: s.province_code || '', count: 0 };
    cityMap[k].count += 1;
  });
  const cities = Object.values(cityMap).sort((a: any, b: any) => b.count - a.count).slice(0, 12);

  const trendMap: any = {};
  signals.forEach((s: any) => {
    const m = monthKey(s.created_date);
    if (m) trendMap[m] = (trendMap[m] || 0) + 1;
  });
  const trend = Object.keys(trendMap).sort().map((m) => ({ month: m, count: trendMap[m] }));

  const by_source: Record<string, number> = {};
  signals.forEach((s: any) => {
    const k = s.source_platform || 'unlabelled';
    by_source[k] = (by_source[k] || 0) + 1;
  });

  return {
    filters: { province: f.province || 'all', city: f.city || 'all', category: f.category || 'all', window_days: f.days },
    total: signals.length,
    rows,
    uncategorised,
    cities,
    trend,
    by_source,
    basis_note:
      'Counts of real demand records. Observed public requests, platform inquiries and confirmed bookings are shown separately — never merged into one demand score. Search interest is never counted as individual requests.',
    empty_note: 'Insufficient observations for this selection.',
    generated_at: new Date().toISOString(),
  };
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const limited = await checkRateLimit(base44, req, 'liveIntelligence', 60);
    if (!limited.allowed) return rateLimitedResponse();
    const body = await req.json().catch(() => ({}));
    const action = body?.action || 'overview';
    const days = DAY_WINDOWS.includes(Number(body?.days)) ? Number(body.days) : 30;
    if (action === 'overview') return Response.json(await overview(base44, days));
    if (action === 'gauge') {
      const category = MARKET_CATEGORIES.includes(body?.category) ? body.category : '';
      const province = String(body?.province || '').trim().toUpperCase().slice(0, 2);
      const city = String(body?.city || '').trim().slice(0, 80);
      return Response.json(await gauge(base44, { days, province, city, category }));
    }
    return Response.json({ error: 'Unknown action.' }, { status: 422 });
  } catch (e: any) {
    return Response.json({ error: 'Live intelligence feed is unavailable right now.', detail: String(e?.message || e) }, { status: 500 });
  }
}