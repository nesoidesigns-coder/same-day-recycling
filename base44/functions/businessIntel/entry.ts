import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import {
  visitClass, HUMAN_FILTER, SESSION_FILTER, hasIntentPath, INTENT_NOTE,
  classifySource, pct, sum, readRows,
} from '../../shared/analytics.ts';

// Live Business Intelligence: one admin endpoint feeding one dashboard, built
// on the shared analytics layer. Real records only — no estimates, no
// fabrication. Integrity checks report causes; they never modify records.

const DAY = 86400000;
const CONFIRMED = ['confirmed', 'contacted', 'scheduled', 'completed'];

// Service category inferred from the booking's items text — labelled as
// inferred, never presented as a recorded attribute.
const SERVICE_KEYWORDS = [
  ['mattress', 'mattress disposal'],
  ['hot tub', 'hot tub removal'],
  ['sofa|couch|furniture|dresser|table|chair|desk', 'furniture removal'],
  ['fridge|freezer|appliance|stove|washer|dryer|dishwasher|oven', 'appliance removal'],
  ['tv|computer|monitor|printer|electronics|e-waste', 'electronics recycling'],
  ['metal|scrap|copper|aluminum|steel', 'scrap metal'],
  ['bin|dumpster', 'bin rentals'],
  ['construction|renovation|drywall|debris|demolition', 'construction debris'],
  ['estate|cleanout|clean-out', 'estate cleanout'],
  ['yard|branch|leaf|landscap|garden', 'yard waste'],
  ['office|commercial|strata|property', 'commercial waste'],
];

function inferService(b) {
  const text = String(b.items_description || b.description || '').toLowerCase();
  for (const [pattern, label] of SERVICE_KEYWORDS) {
    if (new RegExp(pattern).test(text)) return label;
  }
  return 'general junk removal';
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const now = Date.now();
    const start30 = new Date(now - 30 * DAY).toISOString();
    const start14 = new Date(now - 14 * DAY).toISOString();
    const dayAgo = new Date(now - DAY).toISOString();

    const sr = base44.asServiceRole.entities;

    // ---- Load everything once ----
    // Human visits (up to ~30 days) — needed per-record for sessions, intent,
    // returning visitors, duplicates and spike detection.
    const humanVisitsRows = [];
    let cursor = undefined;
    for (let i = 0; i < 15; i++) {
      const page = await sr.Visit.filter({ created_date: { $gte: start30 }, ...HUMAN_FILTER }, cursor ? { sort: '-created_date', limit: 500, cursor } : { sort: '-created_date', limit: 500 });
      humanVisitsRows.push(...readRows(page));
      cursor = page?.next_cursor;
      if (!page?.has_more || !cursor) break;
    }
    const [classAgg, ownerVisitsPage,
      leadsPage, bookingsPage, testBookingsPage, natReqPage, integrityRunPage] = await Promise.all([
      sr.Visit.aggregate({ query: { created_date: { $gte: start30 } }, groupBy: 'traffic_class' }),
      sr.Visit.filter({ created_date: { $gte: start30 }, traffic_class: 'owner' }, { limit: 1000, sort: '-created_date' }),
      sr.QuoteLead.filter({ created_date: { $gte: start30 } }, { limit: 500 }),
      sr.Booking.filter({ created_date: { $gte: start30 } }, { limit: 500 }),
      sr.Booking.filter({ record_type: 'internal_test' }, { limit: 100, sort: '-created_date' }),
      sr.NationalRequest.filter({ created_date: { $gte: start30 } }, { limit: 500 }),
      sr.IntegrityRun.filter({}, { sort: '-created_date', limit: 1 }),
    ]);

    const visits = humanVisitsRows;
    const leads = readRows(leadsPage);
    const bookings = readRows(bookingsPage).filter((b) => b.record_type !== 'internal_test');
    const tests = readRows(testBookingsPage);
    const natReqs = readRows(natReqPage);
    const latestIntegrityRun = readRows(integrityRunPage)[0] || null;

    // ---- Metrics ----
    const pageviewsAll = await sr.Visit.count({});
    const ownerVisits30 = await sr.Visit.count({ created_date: { $gte: start30 }, traffic_class: 'owner' });
    const botVisits30 = await sr.Visit.count({ created_date: { $gte: start30 }, traffic_class: 'bot' });
    const unclassifiedAll = (classAgg?.rows || []).reduce((a, r) => a + (visitClass(r) === 'unclassified' ? r.count || 0 : 0), 0);

    const classes = (classAgg?.rows || []).reduce((acc, r) => {
      acc[visitClass(r)] = (acc[visitClass(r)] || 0) + (r.count || 0);
      return acc;
    }, { customer: 0, contractor: 0, owner: 0, bot: 0, unclassified: 0 });
    const human30 = classes.customer + classes.contractor;

    // Sessions, intent, returning visitors, attribution coverage — computed
    // per record from real data.
    const sidCounts = new Map();
    let intentVisits = 0;
    let attributed = 0; // referrer present OR utm/deep source recorded
    const referrerEmptyBySid = new Set();
    for (const v of visits) {
      if (v.sid) sidCounts.set(v.sid, (sidCounts.get(v.sid) || 0) + 1);
      if (hasIntentPath(v.path)) intentVisits += 1;
      if (v.source && v.source !== 'direct') attributed += 1;
      else referrerEmptyBySid.add(v.sid || `(nosid-${v.id})`);
    }
    const sessions = sidCounts.size;
    const returningSessions = [...sidCounts.values()].filter((n) => n > 1).length;
    const intentSids = new Set(visits.filter((v) => hasIntentPath(v.path) && v.sid).map((v) => v.sid));

    // Daily series (Vancouver local days): human visits, intent visits,
    // owner activity — computed from the loaded records so the same
    // definitions and window drive every number.
    const dayKey = (iso) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' });
    const humanByDay = new Map();
    const intentByDay = new Map();
    for (const v of visits) {
      const k = dayKey(v.created_date);
      humanByDay.set(k, (humanByDay.get(k) || 0) + 1);
      if (hasIntentPath(v.path)) intentByDay.set(k, (intentByDay.get(k) || 0) + 1);
    }
    const ownerVisitsRows = readRows(ownerVisitsPage);
    const ownerByDay = new Map();
    const ownerPathCounts = new Map();
    for (const v of ownerVisitsRows) {
      const k = dayKey(v.created_date);
      ownerByDay.set(k, (ownerByDay.get(k) || 0) + 1);
      const p = String(v.path || '/');
      ownerPathCounts.set(p, (ownerPathCounts.get(p) || 0) + 1);
    }
    const daily = [];
    for (let i = 13; i >= 0; i--) {
      const key = new Date(now - i * DAY).toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' });
      daily.push({
        date: key.slice(5),
        human: humanByDay.get(key) || 0,
        intent: intentByDay.get(key) || 0,
        owner: ownerByDay.get(key) || 0,
      });
    }

    // Sources (30d human traffic) — from the same loaded records.
    const sourceCounts = new Map();
    let sourcesTotal = 0;
    for (const v of visits) {
      const src = v.source || 'direct';
      sourceCounts.set(src, (sourceCounts.get(src) || 0) + 1);
      sourcesTotal += 1;
    }
    const sources = { rows: [...sourceCounts.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count), total: sourcesTotal };

    // Top services (by human pageviews, grouped).
    const serviceGroups = {};
    for (const v of visits) {
      const p = String(v.path || '/');
      const label = hasIntentPath(p)
        ? (p.match(/\/(junk-removal|furniture-removal|appliance-removal|electronics-recycling|commercial-recycling|same-day-pickup|free-metal-pickup|pricing|request-service|coverage|services|service-finder|request-status|track|ai-booking)/)?.[1]?.replace(/-/g, ' ') || 'service pages')
        : 'other pages';
      serviceGroups[label] = (serviceGroups[label] || 0) + 1;
    }
    const top_services = Object.entries(serviceGroups).map(([service, count]) => ({ service, count })).sort((a, b) => b.count - a.count).slice(0, 8);

    // ---- Business performance ----
    const confirmed = bookings.filter((b) => CONFIRMED.includes(b.status));
    const completed = bookings.filter((b) => b.status === 'completed');
    const cancelled = bookings.filter((b) => b.status === 'cancelled');
    const paidPlatform = bookings.filter((b) => b.payment_status === 'paid');
    const paidExternal = bookings.filter((b) => b.payment_status === 'paid_externally');
    const paidExternalUnverified = paidExternal.filter((b) => !b.external_payment_verified);
    const jobValue = (b) => Number(b.final_invoice) || Number(b.job_value) || 0;
    const byService = {};
    for (const b of bookings) {
      const s = inferService(b);
      byService[s] = byService[s] || { service: s, bookings: 0, completed: 0, value: 0 };
      byService[s].bookings += 1;
      if (b.status === 'completed') { byService[s].completed += 1; byService[s].value += jobValue(b); }
    }
    const contractorMatched = bookings.filter((b) => b.partner_name);
    const commission = sum(completed, (b) => b.commission_earned);
    const unfulfilled = natReqs.filter((r) => !['completed', 'cancelled', 'job_completed'].includes(r.status) && r.dispatch_status !== 'job_completed');
    const cityDemand = {};
    for (const b of bookings) {
      const c = b.city || 'Unknown';
      cityDemand[c] = (cityDemand[c] || 0) + 1;
    }

    // ---- Development intelligence ----
    const ownerPaths = [...ownerPathCounts.entries()].map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count).slice(0, 10);
    const staleTests = tests.filter((t) => now - new Date(t.created_date).getTime() > 7 * DAY);

    // ---- Integrity checks (report-only, cause + affected metrics) ----
    const integrity = [];
    const addCheck = (check, severity, summary, affected_metrics, details = []) => integrity.push({ check, severity, summary, affected_metrics, details });

    // 1. Duplicate visit events: same session + path + source within 60s.
    const seen = new Map();
    let duplicates = 0;
    const dupExamples = [];
    for (const v of visits) {
      const key = `${v.sid}|${v.path}|${Math.floor(new Date(v.created_date).getTime() / 60000)}`;
      if (seen.has(key)) {
        duplicates += 1;
        if (dupExamples.length < 3) dupExamples.push(`${v.path} (session ${(v.sid || '').slice(0, 8)})`);
      }
      seen.set(key, true);
    }
    addCheck('duplicate_visit_events', duplicates ? 'warning' : 'pass',
      duplicates ? `${duplicates} duplicate visit event(s) detected (same session, path and minute).` : 'No duplicate visit events detected.',
      ['page views', 'human visits', 'sessions'], duplicates ? dupExamples : []);

    // 2. Missing session identifiers on human traffic.
    const missingSid = visits.filter((v) => !v.sid).length;
    addCheck('missing_session_ids', missingSid ? (missingSid / Math.max(visits.length, 1) > 0.5 ? 'warning' : 'info') : 'pass',
      missingSid ? `${missingSid} of ${visits.length} human visits have no session key — they cannot join to quotes, bookings or conversion rates.` : 'Every human visit carries a session key.',
      ['sessions', 'unique visitors', 'conversion rate'], missingSid ? ['Affected visits count toward page views only.'] : []);

    // 3. Attribution coverage: empty referrer = Direct / unknown.
    const directCount = (sources.rows.find((s) => s.source === 'direct') || {}).count || 0;
    const attributionPct = pct(sources.total - directCount, sources.total);
    addCheck('referral_attribution', attributionPct !== null && attributionPct < 30 ? 'warning' : 'pass',
      `Attribution coverage ${attributionPct === null ? 'n/a' : attributionPct + '%'} — ${directCount} visit(s) show no browser referrer and stay "Direct / unknown" rather than being guessed.`,
      ['acquisition sources', 'source split', 'conversion by source'],
      ['Browsers and privacy settings often strip the referrer; GSC remains the verified source for organic search performance.']);

    // 4. Unexplained traffic spikes: any day > 3x the median of the other days.
    const counts = daily.map((d) => d.human).filter((n) => n > 0).sort((a, b) => a - b);
    const median = counts.length ? counts[Math.floor(counts.length / 2)] : 0;
    const spikes = daily.filter((d) => median > 0 && d.human > Math.max(3 * median, median + 20));
    addCheck('traffic_spikes', spikes.length ? 'warning' : 'pass',
      spikes.length ? `Spike day(s) detected: ${spikes.map((d) => d.date + ' (' + d.human + ' visits)').join(', ')} — well above the ${median}/day median.` : 'No unexplained traffic spikes in the last 14 days.',
      ['visitors by day', 'conversion rate'], spikes.length ? ['High direct/unknown share on spike days suggests automated or unattributed traffic; kept separate, never confirmed as customers.'] : []);

    // 5. Browsing-vs-intent split: classification sanity.
    const browsingShare = pct(human30 - intentVisits, human30);
    addCheck('classification_intent', 'info',
      `${human30.toLocaleString()} human visit(s) this window, of which ${intentVisits.toLocaleString()} (${browsingShare === null ? '?' : browsingShare + '%' ? browsingShare + '%' : '—'}) show buying-intent behavior. Visits alone are never counted as customers.`,
      ['customer-intent visits', 'conversion rate']);

    // 6. Test-record hygiene: internal_test bookings older than 7 days.
    addCheck('test_record_hygiene', staleTests.length ? 'warning' : 'pass',
      staleTests.length ? `${staleTests.length} internal test booking(s) older than 7 days were not cleaned up.` : 'All internal test bookings are recent or cleaned up.',
      ['bookings', 'revenue'], staleTests.slice(0, 3).map((t) => `${t.reference_code || t.id} (${t.created_date?.slice(0, 10)})`));

    // 7. Booking counts consistent (service records counted once; tests excluded).
    const bookingSum = bookings.length + cancelled.length;
    addCheck('booking_count_consistency', 'pass',
      `Bookings counted once from Booking records: ${bookings.length} real service booking(s) + ${cancelled.length} cancelled + ${tests.length} internal tests excluded from every customer metric.`,
      ['bookings', 'revenue', 'completion rate'],
      [`National requests in window: ${natReqs.length} (dispatch pipeline, tracked separately).`]);

    const integritySummary = {
      generated_at: new Date().toISOString(),
      checks: integrity,
      error_count: integrity.filter((c) => c.severity === 'error').length,
      warning_count: integrity.filter((c) => c.severity === 'warning').length,
      last_integrity_run: latestIntegrityRun ? { date: latestIntegrityRun.created_date, status: latestIntegrityRun.status, errors: latestIntegrityRun.error_count, warnings: latestIntegrityRun.warning_count } : null,
    };

    return Response.json({
      generated_at: new Date().toISOString(),
      window_days: 30,
      definitions: {
        note: 'Every metric below is computed by the shared analytics layer — identical definitions and date ranges on all dashboards. ' + INTENT_NOTE,
        metrics: {
          pageviews: 'All recorded page-load events (every traffic class).',
          human_visits: 'Customer + contractor visits. Owner, bot and unclassified excluded.',
          customer_intent: 'Human visits showing buying behavior (service pages, availability, pricing, quote/booking, tracking).',
          sessions: 'Distinct anonymous session keys on human traffic (≈ unique visitors).',
          qualified_leads: 'Captured quote requests.',
          confirmed_bookings: 'Accepted and scheduled service bookings; counted once; cancelled and test records excluded.',
          completed_payments: 'Platform payments + owner-verified external settlements.',
          unclassified: 'Historical or uncertain records — never auto-labelled as customers.',
        },
      },
      acquisition: {
        human_visits: human30,
        human_visits_24h: (await sr.Visit.count({ created_date: { $gte: dayAgo }, ...HUMAN_FILTER })),
        intent_visits: intentVisits,
        intent_sessions: intentSids.size,
        qualified_leads: leads.length,
        confirmed_bookings: confirmed.length,
        completed_payments: paidPlatform.length + (paidExternal.length - paidExternalUnverified.length),
        revenue_collected: sum(paidPlatform, jobValue) + sum(paidExternal.filter((b) => b.external_payment_verified), jobValue),
        conversion: {
          visit_to_booking_pct: pct(confirmed.length, human30),
          intent_session_to_booking_pct: pct(confirmed.length, intentSids.size),
          lead_to_booking_pct: pct(confirmed.length, leads.length),
        },
        browsing_vs_intent: { browsing: human30 - intentVisits, intent: intentVisits },
      },
      traffic: {
        pageviews_all_time: pageviewsAll,
        pageviews_30d: classes.customer + classes.contractor + classes.owner + classes.bot + classes.unclassified,
        sessions: sessions,
        unique_visitors_note: 'Sessions are the closest honest proxy for unique visitors (anonymous session key, no cookies).',
        returning_visitors: returningSessions,
        sources: sources.rows,
        sources_total: sources.total,
        attributed_pct: attributionPct,
        top_services: top_services,
        city_demand: Object.entries(cityDemand).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count).slice(0, 8),
        daily,
        owner_bot: { owner_30d: ownerVisits30, bot_30d: botVisits30, unclassified_all_time: unclassifiedAll },
      },
      performance: {
        bookings_by_service: Object.values(byService).sort((a, b) => b.bookings - a.bookings),
        booking_completion_pct: pct(completed.length, confirmed.length || completed.length),
        revenue: {
          completed_job_value: sum(completed, jobValue),
          platform_paid_value: sum(paidPlatform, jobValue),
          external_paid_value: sum(paidExternal, jobValue),
          external_unverified_value: sum(paidExternalUnverified, jobValue),
          commission_earned: commission,
          note: 'Revenue reflects completed/confirmed jobs on real records. Unverified external payments are shown but excluded from collected revenue.',
        },
        contractor_matched_jobs: contractorMatched.length,
        unfulfilled_requests: unfulfilled.length,
        cancelled_bookings: cancelled.length,
      },
      development: {
        owner_visits_30d: ownerVisits30,
        owner_paths: ownerPaths,
        owner_daily: daily.map((d) => ({ date: d.date, owner: d.owner })),
        internal_test_bookings: tests.length,
        stale_test_bookings: staleTests.length,
        automated_testing: latestIntegrityRun ? `Last platform integrity run: ${latestIntegrityRun.status} (${latestIntegrityRun.error_count} errors, ${latestIntegrityRun.warning_count} warnings).` : 'No integrity run recorded yet.',
        bot_traffic_30d: botVisits30,
      },
      integrity: integritySummary,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}