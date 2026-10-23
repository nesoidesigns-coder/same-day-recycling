import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';

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

    const [visitsCurAgg, visitsPrevAgg, leadsPage, bookingsPage] = await Promise.all([
      base44.entities.Visit.aggregate({ query: { created_date: { $gte: startIso } }, groupBy: 'traffic_class' }),
      base44.entities.Visit.aggregate({ query: { created_date: { $gte: prevStartIso, $lt: startIso } }, groupBy: 'traffic_class' }),
      base44.entities.QuoteLead.filter({ created_date: { $gte: prevStartIso } }, { limit: 500 }),
      base44.entities.Booking.filter({ record_type: 'service', created_date: { $gte: prevStartIso } }, { limit: 500 }),
    ]);

    const items = (p) => (Array.isArray(p) ? p : p?.items) || [];
    const split = (rows) => {
      const cur = rows.filter((r) => new Date(r.created_date).getTime() >= startMs);
      const prev = rows.filter((r) => new Date(r.created_date).getTime() < startMs);
      return { cur, prev };
    };

    const { cur: leadsCur, prev: leadsPrev } = split(items(leadsPage));
    const { cur: bookings, prev: bookingsPrev } = split(items(bookingsPage));

    // Traffic classification: owner activity, customers, contractors and bots
    // are tracked separately — conversions are measured on real traffic only.
    const byClass = (rows) => {
      const out = { customer: 0, contractor: 0, owner: 0, bot: 0, unclassified: 0 };
      for (const row of rows || []) {
        const cls = String(row.traffic_class || 'unclassified');
        if (cls in out) out[cls] += row.count || 0;
      }
      return out;
    };
    const realTraffic = (c) => c.customer + c.contractor + c.unclassified;
    const classesCur = byClass(visitsCurAgg?.rows);
    const classesPrev = byClass(visitsPrevAgg?.rows);
    const visitsCur = realTraffic(classesCur);
    const visitsPrev = realTraffic(classesPrev);

    const countWhere = (rows, fn) => rows.filter(fn).length;
    const sum = (rows, fn) => rows.reduce((a, r) => a + (Number(fn(r)) || 0), 0);
    const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : null);
    const CONFIRMED = ['confirmed', 'contacted', 'scheduled', 'completed'];

    const confirmed = bookings.filter((b) => CONFIRMED.includes(b.status));
    const completed = bookings.filter((b) => b.status === 'completed');
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

    return Response.json({
      days,
      generated_at: new Date().toISOString(),
      funnel: {
        visits: { current: visitsCur, previous: visitsPrev, by_class: classesCur },
        quote_leads: {
          current: leadsCur.length,
          previous: leadsPrev.length,
          booked: countWhere(leadsCur, (l) => l.status === 'booked'),
        },
        booking_requests: { current: bookings.length, previous: bookingsPrev.length },
        confirmed: { current: confirmed.length },
        completed: { current: completed.length },
        paid: { platform: paidPlatform.length, external: paidExternal.length, external_unverified: externalUnverified.length },
      },
      rates: {
        visit_to_lead_pct: pct(leadsCur.length, visitsCur),
        lead_to_booking_pct: pct(bookings.length, leadsCur.length),
        booking_to_confirmed_pct: pct(confirmed.length, bookings.length),
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
      truncated: Boolean(leadsPage?.has_more || bookingsPage?.has_more),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}