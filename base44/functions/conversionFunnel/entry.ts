import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { HUMAN_FILTER, SESSION_FILTER } from '../../shared/analytics.ts';

// Conversion funnel report: real records only, no estimates or fabricated data.
// Stages: site visits -> quote leads -> booking requests -> confirmed -> completed -> paid.
// Platform-paid money is distinguished from externally settled payments (owner
// reconciliation decides what counts as verified revenue).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const days = [7, 30, 90].includes(Number(body?.days)) ? Number(body.days) : 30;
    const now = Date.now();
    const dayMs = 86400000;
    const startMs = now - days * dayMs;
    const prevStartMs = now - 2 * days * dayMs;
    const startIso = new Date(startMs).toISOString();
    const prevStartIso = new Date(prevStartMs).toISOString();

    const [visitsCurAgg, visitsPrevAgg, leadsPage, bookingsPage, testBookingsPage, visitsJourneyPage] = await Promise.all([
      base44.entities.Visit.aggregate({ query: { created_date: { $gte: startIso } }, groupBy: 'traffic_class' }),
      base44.entities.Visit.aggregate({ query: { created_date: { $gte: prevStartIso, $lt: startIso } }, groupBy: 'traffic_class' }),
      base44.entities.QuoteLead.filter({ created_date: { $gte: prevStartIso } }, { limit: 500 }),
      base44.entities.Booking.filter({ record_type: 'service', created_date: { $gte: prevStartIso } }, { limit: 500 }),
      base44.entities.Booking.filter({ record_type: 'internal_test', created_date: { $gte: prevStartIso } }, { limit: 500 }),
    ]);

    const items = (p) => (Array.isArray(p) ? p : p?.items) || [];

    // Human visits across the full window, paginated — one pass drives both the
    // visitor-session count (the honest conversion denominator, ≈ unique
    // visitors) and the origin-visit map for journey attribution. A single
    // 500-record page would silently drop most of the window (2,400+ human
    // visits vs a 500-record page), undercounting sessions and breaking the
    // source/country attribution for older conversions.
    const humanVisitRows = [];
    let vCursor;
    for (let i = 0; i < 15; i++) {
      const page = await base44.entities.Visit.filter(
        { created_date: { $gte: prevStartIso }, ...HUMAN_FILTER, ...SESSION_FILTER },
        vCursor ? { sort: '-created_date', limit: 500, cursor: vCursor } : { sort: '-created_date', limit: 500 });
      humanVisitRows.push(...items(page));
      vCursor = page?.next_cursor;
      if (!page?.has_more || !vCursor) break;
    }
    const visitBySid = new Map();
    for (const v of humanVisitRows) {
      if (v.sid) visitBySid.set(v.sid, v);
    }
    const sessionsCur = new Set(humanVisitRows.filter((v) => new Date(v.created_date).getTime() >= startMs).map((v) => v.sid)).size;
    const sessionsPrev = new Set(humanVisitRows.filter((v) => new Date(v.created_date).getTime() < startMs).map((v) => v.sid)).size;

    const split = (rows) => {
      const cur = rows.filter((r) => new Date(r.created_date).getTime() >= startMs);
      const prev = rows.filter((r) => new Date(r.created_date).getTime() < startMs);
      return { cur, prev };
    };

    const { cur: leadsCur, prev: leadsPrev } = split(items(leadsPage));
    const { cur: bookings, prev: bookingsPrev } = split(items(bookingsPage));
    const { cur: testsCur, prev: testsPrev } = split(items(testBookingsPage));
    // Test fixtures surfaced so the owner can see what growth reporting excludes.
    const testRecords = testsCur
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 10)
      .map((t) => ({ ref: t.reference_code || t.id, name: t.name, city: t.city, status: t.status }));

    // Traffic classification via the shared analytics layer: owner activity,
    // customers, contractors, bots and unclassified historical records are
    // tracked separately — conversions are measured on human traffic only
    // (unclassified is never auto-counted as customers).
    const byClass = (rows) => {
      const out = { customer: 0, contractor: 0, owner: 0, bot: 0, unclassified: 0 };
      for (const row of rows || []) {
        const cls = row.traffic_class == null || row.traffic_class === '' ? 'unclassified' : String(row.traffic_class);
        if (cls in out) out[cls] += row.count || 0;
      }
      return out;
    };
    const realTraffic = (c) => c.customer + c.contractor;
    const classesCur = byClass(visitsCurAgg?.rows);
    const classesPrev = byClass(visitsPrevAgg?.rows);
    const visitsCur = realTraffic(classesCur);
    const visitsPrev = realTraffic(classesPrev);

    const countWhere = (rows, fn) => rows.filter(fn).length;
    const sum = (rows, fn) => rows.reduce((a, r) => a + (Number(fn(r)) || 0), 0);
    const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : null);
    const CONFIRMED = ['confirmed', 'contacted', 'scheduled', 'completed'];

    // Cancelled requests are tracked but never counted in conversions — the
    // funnel stage and every rate below use active (non-cancelled) requests,
    // matching the confirmed-bookings definition on the BI dashboard.
    const cancelled = bookings.filter((b) => b.status === 'cancelled');
    const activeBookings = bookings.filter((b) => b.status !== 'cancelled');
    const confirmed = activeBookings.filter((b) => CONFIRMED.includes(b.status));
    const completed = activeBookings.filter((b) => b.status === 'completed');
    const paidPlatform = bookings.filter((b) => b.payment_status === 'paid');
    const paidExternal = bookings.filter((b) => b.payment_status === 'paid_externally');
    const externalUnverified = paidExternal.filter((b) => !b.external_payment_verified);

    const jobValue = (b) => Number(b.final_invoice) || Number(b.job_value) || 0;
    const byCity = {};
    for (const b of bookings) {
      const c = b.city || 'Unknown';
      byCity[c] = byCity[c] || { city: c, requests: 0, completed: 0, value: 0 };
      byCity[c].requests += 1;
      if (b.status === 'completed') { byCity[c].completed += 1; byCity[c].value += jobValue(b); }
    }
    const cities = Object.values(byCity).sort((a, b) => b.requests - a.requests).slice(0, 8);

    // Journey linkage: visitBySid is built by the paginated human-visit load
    // above (newest-first, so overwriting leaves the session's entry visit).
    const byOriginKey = (rows, pick) => {
      const out = {};
      for (const row of rows) {
        const v = row.sid ? visitBySid.get(row.sid) : null;
        const k = v ? pick(v) : 'unlinked';
        out[k] = (out[k] || 0) + 1;
      }
      return Object.entries(out).sort((a, b) => b[1] - a[1]);
    };
    const countryLabel = (v) => (v.country === 'CA' ? 'Canada' : v.country === 'other' ? 'Outside Canada' : 'unlinked');
    const linked = (rows) => rows.filter((r) => r.sid && visitBySid.has(r.sid)).length;
    const journeys = {
      bookings_by_source: byOriginKey(activeBookings, (v) => v.source),
      bookings_by_country: byOriginKey(activeBookings, countryLabel),
      quote_leads_by_source: byOriginKey(leadsCur, (v) => v.source),
      linked_bookings: linked(activeBookings),
      linked_quote_leads: linked(leadsCur),
      linked_booking_pct: pct(linked(activeBookings), activeBookings.length),
      linked_lead_pct: pct(linked(leadsCur), leadsCur.length),
    };

    return Response.json({
      days,
      generated_at: new Date().toISOString(),
      funnel: {
        visits: { current: visitsCur, previous: visitsPrev, visitor_sessions: sessionsCur, visitor_sessions_prev: sessionsPrev, by_class: classesCur },
        quote_leads: {
          current: leadsCur.length,
          previous: leadsPrev.length,
          booked: countWhere(leadsCur, (l) => l.status === 'booked'),
        },
        booking_requests: { current: activeBookings.length, previous: bookingsPrev.length, cancelled_excluded: cancelled.length },
        confirmed: { current: confirmed.length },
        completed: { current: completed.length },
        paid: { platform: paidPlatform.length, external: paidExternal.length, external_unverified: externalUnverified.length },
      },
      rates: {
        visit_to_lead_pct: pct(leadsCur.length, sessionsCur),
        lead_to_booking_pct: pct(activeBookings.length, leadsCur.length),
        booking_to_confirmed_pct: pct(confirmed.length, activeBookings.length),
        confirmed_to_completed_pct: pct(completed.length, confirmed.length),
      },
      money: {
        completed_job_value: sum(completed, jobValue),
        platform_paid_value: sum(paidPlatform, jobValue),
        external_paid_value: sum(paidExternal, jobValue),
        external_unverified_value: sum(externalUnverified, jobValue),
        commission_earned: sum(completed, (b) => b.commission_earned),
      },
      cities,
      journeys,
      tests: { current: testsCur.length, previous: testsPrev.length, records: testRecords },
      truncated: Boolean(leadsPage?.has_more || bookingsPage?.has_more),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}