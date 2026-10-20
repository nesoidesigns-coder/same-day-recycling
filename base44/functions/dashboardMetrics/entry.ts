import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const VAN_FMT = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Vancouver', year: 'numeric', month: '2-digit', day: '2-digit' });
const vanDate = (iso) => (iso ? VAN_FMT.format(new Date(iso)) : '');
const addDays = (ymd, n) => {
  const t = new Date(ymd + 'T00:00:00Z');
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};
const isYmd = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const pct = (num, den) => (den > 0 ? Math.round((num / den) * 1000) / 10 : null);
const deltaPct = (cur, prev) => (cur !== null && cur !== undefined && prev !== null && prev !== undefined && prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null);

const ACTIVE = ['confirmed', 'scheduled'];
const TERMINAL_DONE = ['completed'];
const TERMINAL_CLOSED = ['completed', 'cancelled'];

const sumJobValue = (arr) => arr.reduce((s, b) => s + (Number(b.job_value) || 0), 0);

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const today = VAN_FMT.format(new Date());
    let start = isYmd(body.start) ? body.start : addDays(today, -29);
    let end = isYmd(body.end) ? body.end : today;
    if (start > end) { const t = start; start = end; end = t; }

    const spanDays = Math.round((Date.parse(end + 'T00:00:00Z') - Date.parse(start + 'T00:00:00Z')) / 86400000) + 1;
    const prevEnd = addDays(start, -1);
    const prevStart = addDays(prevEnd, -(spanDays - 1));

    const [bookingsPage, quotesPage, reviews, targetsRaw] = await Promise.all([
      base44.entities.Booking.list({ sort: '-created_date', limit: 1000 }),
      base44.entities.QuoteLead.list({ sort: '-created_date', limit: 1000 }),
      base44.entities.Review.filter({ approved: true }),
      base44.entities.MetricTargets.filter({}),
    ]);
    const bookings = bookingsPage.items || [];
    const quotes = quotesPage.items || [];
    const targets = {};
    for (const t of targetsRaw) {
      if (t && t.metric) targets[t.metric] = { target: Number(t.target) || 0, warning: Number(t.warning) || 0, label: t.label || '', unit: t.unit || '%' };
    }

    const inWindow = (arr, s, e) => arr.filter((r) => { const d = vanDate(r.created_date); return d >= s && d <= e; });
    const curB = inWindow(bookings, start, end);
    const prevB = inWindow(bookings, prevStart, prevEnd);
    const curQ = inWindow(quotes, start, end);
    const prevQ = inWindow(quotes, prevStart, prevEnd);

    // ---- Business performance ----
    const completed = curB.filter((b) => TERMINAL_DONE.includes(b.status));
    const prevCompleted = prevB.filter((b) => TERMINAL_DONE.includes(b.status));
    const revenue = sumJobValue(completed);
    const prevRevenue = sumJobValue(prevCompleted);
    const revTarget = targets.revenue_target || { target: 20000, warning: 12000, label: 'Revenue target', unit: '$' };

    const eligibleQ = curQ.filter((q) => q.status !== 'lost');
    const bookedQ = eligibleQ.filter((q) => q.status === 'booked');
    const conversion = pct(bookedQ.length, eligibleQ.length);
    const prevEligibleQ = prevQ.filter((q) => q.status !== 'lost');
    const prevBookedQ = prevEligibleQ.filter((q) => q.status === 'booked');
    const prevConversion = pct(prevBookedQ.length, prevEligibleQ.length);
    const convCfg = targets.quote_conversion || { target: 30, warning: 15, label: 'Conversion target', unit: '%' };

    const emailCounts = {};
    for (const b of curB) {
      const e = (b.email || '').trim().toLowerCase();
      if (e) emailCounts[e] = (emailCounts[e] || 0) + 1;
    }
    const withEmail = Object.keys(emailCounts).length;
    const repeatCustomers = Object.values(emailCounts).filter((c) => c > 1).length;
    const repeatRate = pct(repeatCustomers, withEmail);
    const prevEmailCounts = {};
    for (const b of prevB) {
      const e = (b.email || '').trim().toLowerCase();
      if (e) prevEmailCounts[e] = (prevEmailCounts[e] || 0) + 1;
    }
    const prevRepeat = pct(Object.values(prevEmailCounts).filter((c) => c > 1).length, Object.keys(prevEmailCounts).length);

    const avgValue = completed.length > 0 ? Math.round((revenue / completed.length) * 100) / 100 : null;
    const prevAvgValue = prevCompleted.length > 0 ? Math.round((prevRevenue / prevCompleted.length) * 100) / 100 : null;

    // ---- Operations ----
    const scheduledToday = bookings.filter((b) => b.preferred_date === today && ACTIVE.includes(b.status));
    const completedToday = bookings.filter((b) => b.preferred_date === today && TERMINAL_DONE.includes(b.status));
    const attention = bookings.filter((b) => b.status === 'new' || (ACTIVE.includes(b.status) && (b.assignment_status || 'unassigned') === 'unassigned'));

    const closed = curB.filter((b) => TERMINAL_CLOSED.includes(b.status));
    const completion = pct(completed.length, closed.length);
    const prevClosed = prevB.filter((b) => TERMINAL_CLOSED.includes(b.status));
    const prevCompletion = pct(prevCompleted.length, prevClosed.length);
    const complCfg = targets.completion_rate || { target: 90, warning: 75, label: 'Completion target', unit: '%' };
    const repeatCfg = targets.repeat_rate || { target: 20, warning: 10, label: 'Repeat target', unit: '%' };

    // ---- Customer experience ----
    const rating = reviews.length > 0 ? Math.round((reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length) * 10) / 10 : null;
    const csatCfg = targets.csat || { target: 4.5, warning: 4, label: 'Rating target', unit: '★' };

    return Response.json({
      last_updated: new Date().toISOString(),
      period: { start, end, span_days: spanDays, prev_start: prevStart, prev_end: prevEnd, label: `${start} to ${end}` },
      today,
      business: {
        revenue: { value: revenue, prev: prevRevenue, delta: deltaPct(revenue, prevRevenue), currency: 'CAD', target: revTarget.target, verified: true },
        conversion: { value: conversion, prev: prevConversion, delta: deltaPct(conversion, prevConversion), unit: '%', target: convCfg.target, warning: convCfg.warning, verified: true, eligible: eligibleQ.length, booked: bookedQ.length },
        bookings_total: { value: curB.length, prev: prevB.length, delta: deltaPct(curB.length, prevB.length), verified: true },
        confirmed_bookings: { value: curB.filter((b) => ACTIVE.includes(b.status)).length, verified: true },
        avg_value: { value: avgValue, prev: prevAvgValue, delta: deltaPct(avgValue, prevAvgValue), currency: 'CAD', verified: true },
        quotes_outstanding: { value: quotes.filter((q) => q.status === 'new').length, total_quotes: quotes.length, verified: true },
        repeat_rate: { value: repeatRate, prev: prevRepeat, delta: deltaPct(repeatRate, prevRepeat), unit: '%', target: repeatCfg.target, warning: repeatCfg.warning, verified: true },
      },
      operations: {
        scheduled_today: { value: scheduledToday.length, verified: true },
        completed_today: { value: completedToday.length, verified: true },
        completion: { value: completion, prev: prevCompletion, delta: deltaPct(completion, prevCompletion), unit: '%', target: complCfg.target, warning: complCfg.warning, verified: true, completed: completed.length, closed: closed.length },
        attention: { value: attention.length, verified: true },
        capacity: { value: null, reason: 'No truck capacity or route records exist yet' },
        on_time: { value: null, reason: 'No arrival-time records exist yet' },
        request_to_confirm: { value: null, reason: 'Status-change timestamps are not tracked yet' },
      },
      environmental: {
        recycled_kg: { value: null, reason: 'No documented material weights per job yet' },
        reused_kg: { value: null, reason: 'No documented reuse or donation weights yet' },
        recycling_rate: { value: null, target: null, reason: 'Needs documented recycled and total material weights' },
        monthly_performance: { value: null, target: null, reason: 'No environmental target data recorded yet' },
      },
      experience: {
        rating: { value: rating, count: reviews.length, unit: '★', target: csatCfg.target, warning: csatCfg.warning, verified: true },
        reviews_count: { value: reviews.length, verified: true },
        complaints: { value: null, reason: 'No complaint records exist yet' },
        abandonment: { value: null, reason: 'Quote and booking funnel step events are not tracked yet' },
        response_time: { value: null, reason: 'First-response timestamps are not tracked yet' },
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}