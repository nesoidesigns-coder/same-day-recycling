import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Unified Intelligence Engine (Recycling OS coordination layer). One run gathers
// verified signals from the five intelligence modules using the EXISTING verified
// sources (market report, Search Console, conversion funnel, coverage status,
// operational entities), asks Rex to cross-analyze them, stores the briefing and
// logs every action to the AI audit trail. Read-only over business data: Rex
// recommends, but consequential actions (spend, publish, agreements) are only
// prepared for owner authorization — never executed here.
const pick = (r) => (r.status === 'fulfilled' ? (r.value?.data ?? r.value) : { unavailable: true });
const round = (n) => Math.round((Number(n) || 0) * 100) / 100;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let payload = {};
    try { payload = await req.json(); } catch {}
    const triggeredBy = payload.triggered_by === 'scheduled' ? 'scheduled' : 'manual';

    // Independent read-only sources in one settled batch.
    const settled = await Promise.allSettled([
      base44.functions.invoke('demandReport', { view: 'command', filters: { engine: 'google' } }), // market module
      base44.functions.invoke('searchAuthority', {}), // acquisition module: GSC 28d
      base44.functions.invoke('conversionFunnel', { days: 30 }), // acquisition module: funnel
      base44.functions.invoke('coverageStatus', {}), // contractor module: verified/matching cities
    ]);
    const market = pick(settled[0]);
    const search = pick(settled[1]);
    const funnel = pick(settled[2]);
    const coverage = pick(settled[3]);

    // Contractor, customer-experience and operations signals come straight from
    // the operational entities (verified record counts, not estimates).
    const [activePartners, newBookings, freshQuotes, awaitingRequests, outstandingPage, lowReviewPage, problemPage, actions30d] = await Promise.all([
      base44.entities.Partner.filter({ active: true }, { limit: 200 }),
      base44.entities.Booking.count({ status: 'new' }),
      base44.entities.QuoteLead.count({ status: 'new' }),
      base44.entities.NationalRequest.count({ dispatch_status: 'awaiting_contractor' }),
      base44.entities.FinancialTx.filter({ status: 'outstanding' }, { limit: 50 }),
      base44.entities.Review.filter({ rating: { $lte: 3 } }, { sort: '-created_date', limit: 10 }),
      base44.entities.AiActionLog.filter({ outcome: { $in: ['failed', 'escalated'] } }, { sort: '-created_date', limit: 10 }),
      base44.entities.AiActionLog.count({ outcome: 'success' }),
    ]);

    const outstandingTx = outstandingPage?.items || outstandingPage || [];
    const lowReviews = lowReviewPage?.items || lowReviewPage || [];
    const problemActions = problemPage?.items || problemPage || [];

    const moduleData = {
      market: {
        latest_period: market?.latest_period ?? null,
        national: market?.overview ? { available: market.overview.available, measure: market.overview.measure, value: market.overview.value, mom_pct: market.overview.mom_pct } : { unavailable: true },
        trend_momentum: ((market?.trends || []).filter((t) => Number.isFinite(t.change_points)).map((t) => ({ keyword: t.keyword, change_points: t.change_points, direction: t.direction }))).slice(0, 8),
        rising_terms: (market?.rising || []).map((r) => ({ keyword: r.keyword, mom_pct: r.mom_pct })).slice(0, 5),
        declining_terms: (market?.declining || []).map((r) => ({ keyword: r.keyword, mom_pct: r.mom_pct })).slice(0, 3),
        regional: (market?.provinces || []).slice(0, 6).map((p) => ({ name: p.name, value: p.value })),
        note: 'Nationwide market search demand from verified provider observations — NOT company traffic or ad campaigns.',
      },
      acquisition: {
        search_console: search?.unavailable ? { unavailable: true } : { connected: search.connected, totals_28d: search.totals, totals_prev: search.totals_previous, top_queries: (search.queries || []).slice(0, 8), click_opportunities: (search.opportunities || []).slice(0, 5) },
        funnel_30d: funnel?.unavailable ? { unavailable: true } : { visits_by_class: funnel.funnel?.visits?.by_class, quote_leads: funnel.funnel?.quote_leads, booking_requests: funnel.funnel?.booking_requests, completed: funnel.funnel?.completed, rates: funnel.rates, top_cities: (funnel.cities || []).slice(0, 5) },
      },
      contractor: {
        coverage: coverage?.unavailable ? { unavailable: true } : { verified_cities: coverage.verified_cities?.length ?? 0, matching_cities: coverage.matching_cities?.length ?? 0, unavailable_cities: coverage.unavailable_cities?.length ?? coverage.unavailable_cities },
        active_partners: ((activePartners?.items || activePartners || []).map((p) => ({ name: p.name, city: p.city, province: p.province_code, dispatch_mode: p.dispatch_mode, verified: p.verified, tax_status: p.tax_registered }))).slice(0, 25),
        requests_awaiting_contractor: awaitingRequests,
      },
      customer_experience: {
        fresh_quotes_uncontacted: freshQuotes,
        new_bookings_awaiting_contact: newBookings,
        low_ratings: (lowReviews || []).map((r) => ({ rating: r.rating, city: r.city, text: String(r.text || '').slice(0, 200) })),
        note: 'Reviews below 4 stars need human review; no public response is automated.',
      },
      operations: {
        outstanding_transactions: { count: (outstandingTx || []).length, total: round((outstandingTx || []).reduce((n, t) => n + Number(t.amount || 0), 0)) },
        rex_actions_failed_or_escalated: (problemActions || []).map((a) => ({ action: a.action, summary: a.summary, outcome: a.outcome })),
        rex_actions_success_total: actions30d,
      },
    };

    const compact = JSON.stringify(moduleData);
    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are Rex, the coordinating intelligence of Recycling OS for Same Day Recycling (samedayrecycling.ca). ' +
        'Below are VERIFIED signals from five intelligence modules. Cross-analyze them and produce an owner briefing.\n\n' +
        'Rules:\n' +
        '- Every recommendation must cite the module signal it is based on (e.g. "market: rising term X", "operations: 2 outstanding transactions").\n' +
        '- Keep nationwide market demand STRICTLY separate from company performance; never mix them.\n' +
        '- Recommend contractor recruitment only where market demand exists and contractor coverage is missing; never recommend advertising a city as confirmed without a verified provider.\n' +
        '- Mark needs_authorization=true for anything consequential: spending money, publishing content or claims, changing agreements, contacting customers at scale.\n' +
        '- Forecasts are PREDICTIONS: label each with confidence (low/medium/high) and the data period used. Never present a forecast as a confirmed booking or guaranteed revenue. If historical data is thin, say so and use low confidence.\n' +
        '- Never invent numbers, and say plainly when a module is unavailable.\n' +
        '- Prioritize by business impact for a Canadian same-day removal marketplace.\n\n' +
        'SIGNALS:\n' + compact,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          recommendations: { type: 'array', items: { type: 'object', properties: {
            module: { type: 'string', enum: ['market', 'acquisition', 'contractor', 'customer_experience', 'operations'] },
            action: { type: 'string' }, priority: { type: 'string', enum: ['highest', 'high', 'medium', 'low'] },
            rationale: { type: 'string' }, needs_authorization: { type: 'boolean' } },
            required: ['module', 'action', 'priority', 'rationale', 'needs_authorization'] } },
          forecasts: { type: 'array', items: { type: 'object', properties: {
            label: { type: 'string' }, prediction: { type: 'string' },
            confidence: { type: 'string', enum: ['low', 'medium', 'high'] }, data_period: { type: 'string' } },
            required: ['label', 'prediction', 'confidence', 'data_period'] } },
        },
        required: ['summary', 'recommendations', 'forecasts'],
      },
    });

    const today = new Date().toISOString().slice(0, 10);
    const briefing = {
      run_date: today,
      triggered_by: triggeredBy,
      summary: String(ai.summary || '').slice(0, 3000),
      modules: moduleData,
      recommendations: (ai.recommendations || []).slice(0, 12),
      forecasts: (ai.forecasts || []).slice(0, 6),
    };
    await base44.entities.IntelligenceBriefing.create(briefing);
    await base44.entities.AiActionLog.create({
      actor: 'rex',
      action: 'unified_intelligence',
      summary: `Ran the unified intelligence engine (5 modules). ${briefing.recommendations.length} recommendations, ${briefing.forecasts.length} forecasts.`,
      outcome: 'success',
      target_type: 'other',
    });

    return Response.json({ ok: true, briefing });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}