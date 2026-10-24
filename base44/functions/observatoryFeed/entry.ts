import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';

// National Market Observatory feed — every number and event is derived from
// real records. Internal events (bookings, inquiries) are always ANONYMIZED:
// city, service level and timestamps only — never names, emails, phones or
// addresses, because this endpoint serves the public observatory page.
// Data-layer labels: live = internal platform events; recent = external
// discovery syncs; historical = periodic search datasets; unavailable = no
// verified source. Nothing is estimated or manufactured.

const CONFIRMED = ['confirmed', 'contacted', 'scheduled', 'completed'];
const DAY_MS = 86400000;
const CATEG_LABELS = {
  booking: 'Confirmed booking',
  quote_request: 'Customer quote request',
  service_inquiry: 'Service inquiry',
  contractor_application: 'Contractor application',
  contractor_interest: 'Software / membership interest',
  territory_verified: 'Territory verified',
  public_opportunity: 'Public opportunity',
};
const OPP_SOURCE_LABEL = { reddit: 'Reddit (public)', recycling_os: 'Recycling OS', public_forum: 'Public forum', other: 'Other public source' };

function sourceStatus(lastSyncIso, cadenceDays, failed) {
  if (failed) return 'unavailable';
  if (!lastSyncIso) return 'historical_data_only';
  const ageDays = (Date.now() - new Date(lastSyncIso).getTime()) / DAY_MS;
  if (ageDays <= cadenceDays * 1.5) return 'connected';
  if (ageDays <= cadenceDays * 3) return 'delayed';
  return 'unavailable';
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    // ---- AI market intelligence (admin only) ----
    if (body.action === 'ai_insights') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

      const since = new Date(Date.now() - 45 * DAY_MS).toISOString();
      const [opps, bookings, partners, observations] = await Promise.all([
        base44.asServiceRole.entities.PublicOpportunity.filter({ status: 'open' }, { sort: '-posted_at', limit: 100 }),
        base44.asServiceRole.entities.Booking.filter({ record_type: 'service', created_date: { $gte: since } }, { limit: 300 }),
        base44.asServiceRole.entities.Partner.filter({}, { limit: 500 }),
        base44.asServiceRole.entities.DemandObservation.list({ sort: '-created_date', limit: 200 }),
      ]);
      const items = (p) => (Array.isArray(p) ? p : p?.items) || [];
      const coveredCities = new Set();
      for (const p of items(partners)) {
        if (!p.active || !p.verified) continue;
        if (p.city) coveredCities.add(p.city);
        for (const c of p.service_cities || []) coveredCities.add(c);
      }
      const demandByCity = {};
      for (const b of items(bookings)) demandByCity[b.city] = (demandByCity[b.city] || 0) + 1;
      const catCounts = {};
      for (const o of items(opps)) catCounts[o.service_category] = (catCounts[o.service_category] || 0) + 1;
      const rising = items(observations).filter((o) => o.trend_direction === 'rising').slice(0, 10).map((o) => ({ keyword: o.keyword, period: o.period, index: o.trend_index }));

      const evidence = {
        verified_contractor_cities: [...coveredCities].sort(),
        booking_demand_by_city_45d: demandByCity,
        open_public_opportunities: items(opps).slice(0, 30).map((o) => ({ service: o.service_category, city: o.city, province: o.province_code, status: o.job_status, classification: o.classification })),
        public_opportunities_by_service: catCounts,
        rising_trends: rising,
      };
      const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are the market-intelligence analyst for Same Day Recycling, a Canadian junk removal network. Analyze the VERIFIED observations below and produce at most 6 insights. Rules: (1) Statistical observations must cite the actual counts/evidence given. (2) Recommendations must be clearly advice, not fact. (3) Never invent search volumes, dollar values or demand numbers. (4) Flag when qualified demand has no verified contractor capacity. (5) Be specific about Canadian cities and service categories. Verified observations: ${JSON.stringify(evidence)}`,
        response_json_schema: {
          type: 'object',
          properties: {
            insights: {
              type: 'array',
              maxItems: 6,
              items: {
                type: 'object',
                properties: {
                  kind: { type: 'string', enum: ['statistical_evidence', 'ai_recommendation'] },
                  title: { type: 'string' },
                  detail: { type: 'string' },
                  region: { type: 'string' },
                  service: { type: 'string' },
                  evidence: { type: 'string' },
                },
                required: ['kind', 'title', 'detail'],
              },
            },
          },
          required: ['insights'],
        },
      });
      return Response.json({ insights: (ai && ai.insights) || [], generated_at: new Date().toISOString() });
    }

    // ---- Live / recent / historical feed ----
    const now = Date.now();
    const since30 = new Date(now - 30 * DAY_MS).toISOString();
    const since45 = new Date(now - 45 * DAY_MS).toISOString();
    const todayStart = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z').toISOString();

    const [bookings, leads, apps, inquiries, partners, opps, runs, observations, seoSnapshots] = await Promise.all([
      base44.asServiceRole.entities.Booking.filter({ record_type: 'service', created_date: { $gte: since30 } }, { sort: '-created_date', limit: 200 }),
      base44.asServiceRole.entities.QuoteLead.filter({ created_date: { $gte: since30 } }, { sort: '-created_date', limit: 200 }),
      base44.asServiceRole.entities.ContractorApplication.filter({ created_date: { $gte: since30 } }, { sort: '-created_date', limit: 50 }),
      base44.asServiceRole.entities.SoftwareInquiry.filter({ created_date: { $gte: since30 } }, { sort: '-created_date', limit: 50 }),
      base44.asServiceRole.entities.Partner.filter({}, { limit: 500 }),
      base44.asServiceRole.entities.PublicOpportunity.filter({ status: 'open' }, { sort: '-posted_at', limit: 80 }),
      base44.asServiceRole.entities.DiscoveryRun.list({ sort: '-created_date', limit: 10 }),
      base44.asServiceRole.entities.DemandObservation.list({ sort: '-created_date', limit: 200 }),
      base44.asServiceRole.entities.SeoPerformanceSnapshot.list({ sort: '-created_date', limit: 5 }),
    ]);
    const items = (p) => (Array.isArray(p) ? p : p?.items) || [];

    // ---- Activity feed (anonymized internal events + public opportunities) ----
    // Cancelled requests are recorded in dispatch but never presented as
    // confirmed demand in the Observatory feed or counters.
    const events = [];
    for (const b of items(bookings).filter((b) => b.status !== 'cancelled')) {
      events.push({
        id: `bk_${b.id}`, category: 'booking', layer: 'live',
        source_platform: 'Recycling OS (internal)',
        city: b.city || '', province_code: b.province_code || '',
        service: 'Removal / recycling pickup',
        event_at: b.created_date, verified_at: b.created_date,
        status: b.status, matching: b.partner_name || b.partner_id ? 'assigned' : (CONFIRMED.includes(b.status) ? 'confirmed' : 'awaiting'),
        link: null,
      });
    }
    for (const l of items(leads)) {
      events.push({
        id: `ql_${l.id}`, category: l.source === 'google_business' ? 'service_inquiry' : 'quote_request', layer: 'live',
        source_platform: 'Recycling OS (internal)',
        city: l.city || '', province_code: '',
        service: 'Quote request',
        event_at: l.created_date, verified_at: l.created_date,
        status: l.status, matching: l.status === 'booked' ? 'converted' : 'awaiting',
        link: null,
      });
    }
    for (const a of items(apps)) {
      events.push({
        id: `ap_${a.id}`, category: 'contractor_application', layer: 'live',
        source_platform: 'Recycling OS (internal)',
        city: a.city || '', province_code: a.province_code || a.province || '',
        service: 'Contractor application',
        event_at: a.created_date, verified_at: a.created_date,
        status: a.status, matching: a.status === 'approved' ? 'approved' : 'in_review',
        link: null,
      });
    }
    for (const i of items(inquiries)) {
      events.push({
        id: `si_${i.id}`, category: 'contractor_interest', layer: 'live',
        source_platform: 'Recycling OS (internal)',
        city: i.city || '', province_code: i.province_code || '',
        service: 'Software / membership interest',
        event_at: i.created_date, verified_at: i.created_date,
        status: i.status || 'new', matching: 'n/a',
        link: null,
      });
    }
    for (const p of items(partners)) {
      const d = p.verified_date;
      if (d && new Date(d).getTime() >= new Date(since30).getTime()) {
        events.push({
          id: `tv_${p.id}`, category: 'territory_verified', layer: 'live',
          source_platform: 'Recycling OS (internal)',
          city: p.city || '', province_code: p.province_code || '',
          service: `Territory verified${(p.service_cities || []).length ? ` (+${p.service_cities.length} municipalities)` : ''}`,
          event_at: d, verified_at: d,
          status: p.active ? 'active' : 'inactive', matching: 'n/a',
          link: null,
        });
      }
    }
    for (const o of items(opps)) {
      events.push({
        id: `po_${o.id}`, category: 'public_opportunity', layer: 'recent',
        source_platform: OPP_SOURCE_LABEL[o.source] || 'Public source',
        city: o.city || '', province_code: o.province_code || '',
        service: o.service_category || 'other',
        event_at: o.posted_at || o.created_date, verified_at: o.last_verified_at || o.created_date,
        status: o.job_status || 'potential_lead',
        matching: o.claimed_by_name || o.booking_id ? 'assigned' : 'awaiting',
        link: o.source_url || null,
        title: o.title, classification: o.classification,
      });
    }
    events.sort((a, b) => new Date(b.event_at || 0) - new Date(a.event_at || 0));
    const feed = events.slice(0, 60).map((e) => ({ ...e, category_label: CATEG_LABELS[e.category] || e.category }));

    // ---- Counters ----
    const openOpps = items(opps);
    const qualifiedOpps = openOpps.filter((o) => ['active_request', 'potential_opportunity'].includes(o.classification));
    const awaitingMatching = openOpps.filter((o) => ['potential_lead', 'verified_request'].includes(o.job_status)).length
      + items(bookings).filter((b) => !b.partner_id && b.status !== 'cancelled').length;
    const confirmedBookings = items(bookings).filter((b) => CONFIRMED.includes(b.status)).length;
    const completedJobs = items(bookings).filter((b) => b.status === 'completed').length;
    const requestsToday = items(bookings).filter((b) => b.created_date >= todayStart && b.status !== 'cancelled').length
      + items(leads).filter((l) => l.created_date >= todayStart).length;
    const verifiedCities = new Set();
    let territoryCount = 0;
    for (const p of items(partners)) {
      if (!p.active || !p.verified) continue;
      territoryCount += 1 + (p.service_cities || []).length;
      if (p.city) verifiedCities.add(p.city);
      for (const c of p.service_cities || []) verifiedCities.add(c);
    }

    // ---- Regional demand vs verified coverage ----
    const regional = {};
    const bump = (city, province, key, n = 1) => {
      if (!city) return;
      const k = city;
      regional[k] = regional[k] || { city, province_code: province || '', demand_events: 0, public_opportunities: 0, bookings_30d: 0 };
      regional[k][key] += n;
    };
    for (const b of items(bookings)) bump(b.city, b.province_code, 'demand_events');
    for (const l of items(leads)) bump(l.city, '', 'demand_events');
    for (const o of openOpps) bump(o.city, o.province_code, 'public_opportunities');
    for (const p of items(partners)) {
      if (!p.active || !p.verified) continue;
      const cities = [p.city, ...(p.service_cities || [])].filter(Boolean);
      for (const c of cities) {
        regional[c] = regional[c] || { city: c, province_code: p.province_code || '', demand_events: 0, public_opportunities: 0, bookings_30d: 0 };
        regional[c].contractors = (regional[c].contractors || 0) + 1;
        regional[c].truck_capacity = (regional[c].truck_capacity || 0) + (Number(p.truck_capacity) || 1);
      }
    }
    const regions = Object.values(regional).map((r) => ({
      ...r,
      contractors: r.contractors || 0,
      truck_capacity: r.truck_capacity || 0,
      unmatched_demand: (r.demand_events + r.public_opportunities) > 0 && r.contractors === 0,
      covered: r.contractors > 0,
    })).sort((a, b) => (b.demand_events + b.public_opportunities) - (a.demand_events + a.public_opportunities)).slice(0, 25);

    // ---- Trending service categories (observed) + historical search indicators ----
    const catObs = {};
    for (const o of openOpps) if (o.service_category) catObs[o.service_category] = (catObs[o.service_category] || 0) + 1;
    const trending = Object.entries(catObs).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([cat, n]) => ({ category: cat, open_opportunities: n }));
    const obsByKeyword = {};
    for (const o of items(observations)) {
      if (!o.keyword || obsByKeyword[o.keyword]) continue;
      obsByKeyword[o.keyword] = { keyword: o.keyword, period: o.period, measure: o.metric_type, value: o.metric_type === 'monthly_volume' ? o.est_monthly_volume : o.trend_index, direction: o.trend_direction, retrieved_at: o.retrieved_at || o.created_date, source: o.provider };
    }
    const historicalSignals = Object.values(obsByKeyword).slice(0, 6);

    // ---- Source connection status ----
    const latest = (rows, field = 'created_date') => (rows.length ? rows.map((r) => r[field]).filter(Boolean).sort().pop() : null);
    const redditRuns = items(runs).filter((r) => r.source === 'reddit');
    const lastReddit = redditRuns[0];
    const trendsLatest = latest(items(observations).map((o) => ({ created_date: o.retrieved_at || o.created_date })));
    const seoLatest = latest(items(seoSnapshots));
    const internalLatest = [latest(items(bookings)), latest(items(leads)), latest(items(apps))].filter(Boolean).sort().pop();
    const sources = [
      { key: 'platform', label: 'Recycling OS platform (bookings, inquiries, contractors)', status: 'connected', last_sync: internalLatest, cadence: 'Real time', layer: 'live' },
      {
        key: 'reddit', label: 'Public opportunity discovery (Reddit API)', layer: 'recent',
        status: lastReddit ? (lastReddit.status === 'success' ? sourceStatus(lastReddit.created_date, 1) : lastReddit.status === 'unavailable' ? 'unavailable' : 'delayed') : 'historical_data_only',
        last_sync: lastReddit?.created_date || null, cadence: 'Daily',
        note: lastReddit && lastReddit.status !== 'success' ? lastReddit.error || lastReddit.notes || undefined : undefined,
      },
      { key: 'google_trends', label: 'Google Trends (relative search interest)', layer: 'historical', status: sourceStatus(trendsLatest, 45), last_sync: trendsLatest, cadence: 'Monthly dataset', note: 'Relative interest index only — never converted into invented search volumes.' },
      { key: 'search_console', label: 'Google Search Console (verified site search data)', layer: 'historical', status: sourceStatus(seoLatest, 3), last_sync: seoLatest, cadence: 'Weekly snapshot', note: 'GSC reports lag ~2 days for fresh organic traffic.' },
      { key: 'google_ads', label: 'Google Ads (paid demand data)', layer: 'historical', status: 'unavailable', last_sync: null, cadence: 'Pending credentials', note: 'Google Ads API credentials are not yet provisioned; no paid-demand data is imported.' },
    ];

    return Response.json({
      generated_at: new Date().toISOString(),
      feed,
      counters: {
        requests_today: { value: requestsToday, layer: 'live', label: 'Verified customer requests today' },
        qualified_opportunities: { value: qualifiedOpps.length, layer: 'recent', label: 'Qualified public opportunities (open)' },
        awaiting_matching: { value: awaitingMatching, layer: 'live', label: 'Requests awaiting contractor matching' },
        confirmed_bookings: { value: confirmedBookings, layer: 'live', label: 'Confirmed bookings (30-day window)' },
        completed_jobs: { value: completedJobs, layer: 'live', label: 'Completed jobs (30-day window)' },
        verified_territories: { value: territoryCount, layer: 'live', label: 'Active verified contractor territories (cities)' },
      },
      regions,
      trending,
      historical_signals: historicalSignals,
      sources,
      privacy_note: 'Internal platform events are anonymized: city, service level and timestamps only. Public opportunities link to their original public source.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}