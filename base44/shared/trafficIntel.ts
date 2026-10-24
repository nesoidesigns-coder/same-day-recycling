// Traffic intelligence core — the single reconciled reporting layer behind
// every traffic dashboard and the AI Business Master analysis.
//
// Reporting rules enforced here:
//   - ONE business time zone: America/Vancouver. "Today" = the current
//     Pacific calendar day; "24h" = a rolling 24-hour window ending now;
//     7/30-day windows are Pacific calendar days. The two are never mixed.
//   - Page views vs visits are distinct: page_views = recorded page-load
//     events; visits = distinct human browser sessions (sid). Multiple page
//     views in one session are never counted as separate visits.
//   - owner + bot traffic is tracked and preserved but never counted as
//     genuine traffic or in any conversion denominator.
//   - Historical records are never deleted, overwritten or silently
//     reclassified. Records without a session key are labeled legacy;
//     unclassified records stay unclassified; gaps are disclosed.
import { hasIntentPath, visitClass, channelOf, CHANNEL_LABELS, METRIC_DEFINITIONS } from './analytics.ts';

export const TZ = 'America/Vancouver';
export const TZ_NOTE = 'All business dashboards use one reporting time zone: America/Vancouver (Pacific). "Today" = the current Pacific calendar day. "Rolling 24 hours" = a 24-hour window ending now. 7-day and 30-day windows are Pacific calendar days. Calendar-day totals and rolling-window totals are reported separately and never mixed.';

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : null);
const confidence = (n: number) => (n >= 100 ? 'high' : n >= 30 ? 'medium' : n >= 10 ? 'low' : 'very_low');
const money = (rows: any[], fn: (r: any) => any) => Math.round(rows.reduce((a: number, r: any) => a + (Number(fn(r)) || 0), 0));

function vanOffsetMs(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    .formatToParts(at)
    .reduce((a: Record<string, string>, p) => { a[p.type] = p.value; return a; }, {} as Record<string, string>);
  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour) % 24, Number(parts.minute), Number(parts.second)) - at.getTime();
}

// UTC instant of Vancouver midnight for a YYYY-MM-DD (two-pass, DST-safe).
export function vanDayStart(ymd: string): Date {
  const [y, m, d] = String(ymd).split('-').map(Number);
  const midnightUtc = Date.UTC(y, m - 1, d);
  let t = midnightUtc - vanOffsetMs(new Date(midnightUtc + 12 * 3600000));
  t = midnightUtc - vanOffsetMs(new Date(t));
  return new Date(t);
}

export function vanTodayYmd(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ });
}

export function addDaysYmd(ymd: string, n: number): string {
  const [y, m, d] = String(ymd).split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export const CONFIRMED_STATUSES = ['confirmed', 'contacted', 'scheduled', 'completed'];

// Paginated loader — one pass over an entity, capped, with a truncation flag.
async function loadAll(base44: any, entity: string, max: number, query: Record<string, unknown> = {}) {
  const rows: any[] = [];
  let cursor: string | undefined;
  for (let i = 0; i < 60 && rows.length < max; i++) {
    const page = await base44.asServiceRole.entities[entity].filter(query, cursor ? { sort: '-created_date', limit: 500, cursor } : { sort: '-created_date', limit: 500 });
    rows.push(...(page?.items || page || []));
    cursor = page?.next_cursor;
    if (!page?.has_more || !cursor) break;
  }
  return { rows: rows.slice(0, max), truncated: rows.length >= max };
}

export function loadVisits(base44: any, max = 20000) { return loadAll(base44, 'Visit', max); }
export function loadLeads(base44: any, max = 5000) { return loadAll(base44, 'QuoteLead', max); }
export function loadBookings(base44: any, max = 5000) { return loadAll(base44, 'Booking', max); }

function computeWindow(def: any, visits: any[], leads: any[], bookings: any[], visitBySid: Map<string, any>) {
  const inWin = (r: any) => { const t = new Date(r.created_date).getTime(); return t >= def.startMs && t < def.endMs; };

  const classes = { customer: 0, contractor: 0, owner: 0, bot: 0, unclassified: 0 };
  const channels: Record<string, number> = {};
  const sources: Record<string, number> = {};
  const pages: Record<string, number> = {};
  const countries = { CA: 0, other: 0 };
  let legacyHuman = 0;
  let intent = 0;
  const sessionCounts = new Map<string, number>();
  const ownerPaths: Record<string, number> = {};
  const ownerSessions = new Set<string>();

  const v = visits.filter(inWin);
  for (const r of v) {
    const cls = visitClass(r);
    classes[cls] += 1;
    if (cls === 'owner') {
      const p = String(r.path || '/');
      ownerPaths[p] = (ownerPaths[p] || 0) + 1;
      if (r.sid) ownerSessions.add(r.sid);
      continue;
    }
    if (cls !== 'customer' && cls !== 'contractor') continue; // bot + unclassified: tracked, never counted
    const ch = channelOf(r);
    channels[ch] = (channels[ch] || 0) + 1;
    const s = String(r.source || 'direct');
    sources[s] = (sources[s] || 0) + 1;
    const p = String(r.path || '/');
    pages[p] = (pages[p] || 0) + 1;
    countries[r.country === 'other' ? 'other' : 'CA'] += 1;
    if (hasIntentPath(r.path)) intent += 1;
    if (!r.sid) legacyHuman += 1;
    else sessionCounts.set(r.sid, (sessionCounts.get(r.sid) || 0) + 1);
  }

  const sessions = sessionCounts.size;
  const returning = [...sessionCounts.values()].filter((n) => n > 1).length;
  const human = classes.customer + classes.contractor;

  // ---- Booking funnel (correctly matched event records) ----
  const lv = leads.filter(inWin);
  const bAll = bookings.filter(inWin);
  const testBookings = bAll.filter((b) => b.record_type === 'internal_test');
  const bv = bAll.filter((b) => b.record_type !== 'internal_test');
  const cancelled = bv.filter((b) => b.status === 'cancelled');
  const active = bv.filter((b) => b.status !== 'cancelled');
  const confirmed = active.filter((b) => CONFIRMED_STATUSES.includes(b.status));
  const completed = active.filter((b) => b.status === 'completed');
  const approved = active.filter((b) => (Number(b.approved_quote_amount) || 0) > 0);
  const platformPaid = active.filter((b) => b.payment_status === 'paid');
  const externalPaid = active.filter((b) => b.payment_status === 'paid_externally');
  const extVerified = externalPaid.filter((b) => b.external_payment_verified);
  const extPending = externalPaid.filter((b) => !b.external_payment_verified);
  const jobValue = (b: any) => Number(b.final_invoice) || Number(b.job_value) || 0;

  const stages = [
    { key: 'visitor_sessions', label: 'Visitor sessions', count: sessions, note: 'Distinct human browser sessions; page views are counted separately' },
    { key: 'service_exploration', label: 'Service exploration', count: intent, note: 'Page views of service, pricing, quote or tracking pages' },
    { key: 'quote_request', label: 'Quote requests', count: lv.length, note: 'Captured quote-request records' },
    { key: 'quote_approved', label: 'Quotes approved', count: approved.length, note: 'Bookings with a customer-approved price on record' },
    { key: 'booking_confirmed', label: 'Bookings confirmed', count: confirmed.length, note: 'Confirmed, contacted, scheduled or completed' },
    { key: 'job_completed', label: 'Jobs completed', count: completed.length, note: 'Completed jobs; cancellations excluded' },
    { key: 'payment_verified', label: 'Payments verified', count: platformPaid.length + extVerified.length, note: 'Platform-captured payments plus owner-verified external payments' },
  ];
  const funnelRates = [];
  for (let i = 1; i < stages.length; i++) {
    funnelRates.push({ from: stages[i - 1].key, to: stages[i].key, pct: pct(stages[i].count, stages[i - 1].count), confidence: confidence(stages[i - 1].count) });
  }

  const citiesMap: Record<string, any> = {};
  for (const b of bv) {
    const c = String(b.city || 'Unknown');
    citiesMap[c] = citiesMap[c] || { city: c, province_code: b.province_code || '', requests: 0, confirmed: 0, completed: 0, value: 0 };
    citiesMap[c].requests += 1;
    if (CONFIRMED_STATUSES.includes(b.status)) citiesMap[c].confirmed += 1;
    if (b.status === 'completed') { citiesMap[c].completed += 1; citiesMap[c].value += jobValue(b); }
  }
  const cities = Object.values(citiesMap).sort((a: any, b: any) => b.requests - a.requests).slice(0, 10);

  // Attribution of converted sessions to their acquisition channel.
  const bookingsByChannel: Record<string, number> = {};
  let linkedBookings = 0;
  for (const b of active) {
    const v2 = b.sid ? visitBySid.get(b.sid) : null;
    const key = v2 ? channelOf(v2) : 'unlinked';
    bookingsByChannel[key] = (bookingsByChannel[key] || 0) + 1;
    if (v2) linkedBookings += 1;
  }

  return {
    label: def.label,
    rolling: Boolean(def.rolling),
    start: new Date(def.startMs).toISOString(),
    end: new Date(def.endMs).toISOString(),
    classes,
    page_views: { total_recorded: v.length, human, owner: classes.owner, bot: classes.bot, unclassified: classes.unclassified },
    visits: sessions,
    legacy_pageviews: legacyHuman,
    sessions,
    new_visitors: sessions - returning,
    returning_visitors: returning,
    intent_visits: intent,
    channels: Object.entries(channels).map(([key, count]) => ({ key, label: CHANNEL_LABELS[key] || key, count })).sort((a: any, b: any) => b.count - a.count),
    sources,
    top_pages: Object.entries(pages).sort((a: any, b: any) => b[1] - a[1]).slice(0, 10).map(([path, count]) => ({ path, count })),
    countries,
    quote_requests: lv.length,
    quote_leads_booked: lv.filter((l) => l.status === 'booked').length,
    bookings: { requests: active.length, cancelled_excluded: cancelled.length, tests_excluded: testBookings.length, confirmed: confirmed.length, completed: completed.length },
    funnel: { stages, rates: funnelRates },
    revenue: {
      platform_paid_value: money(platformPaid, jobValue),
      external_verified_value: money(extVerified, jobValue),
      external_pending_value: money(extPending, jobValue),
      external_pending_count: extPending.length,
      commissions_earned: money(completed, (b: any) => b.commission_earned),
      completed_job_value: money(completed, jobValue),
      verified_revenue: money(platformPaid, jobValue) + money(extVerified, jobValue),
      note: 'Externally settled jobs count as revenue only after owner reconciliation; pending external payments are listed separately, never zeroed.',
    },
    cities,
    bookings_by_channel: Object.entries(bookingsByChannel).sort((a: any, b: any) => b[1] - a[1]).map(([key, count]) => ({ key, label: CHANNEL_LABELS[key] || 'Session unlinked (no visit record)', count })),
    linked_bookings: linkedBookings,
    owner: { pageviews: classes.owner, sessions: ownerSessions.size, top_paths: Object.entries(ownerPaths).sort((a: any, b: any) => b[1] - a[1]).slice(0, 8).map(([path, count]) => ({ path, count })) },
    bots: { pageviews: classes.bot },
    confidence: { sessions: confidence(sessions), bookings: confidence(active.length), completed: confidence(completed.length) },
  };
}

export function buildTrafficReport(visits: any[], leads: any[], bookings: any[], now = Date.now()) {
  const today = vanTodayYmd();
  const dayEndMs = vanDayStart(addDaysYmd(today, 1)).getTime();
  const defs = [
    { key: 'today', label: 'Today (Pacific calendar day)', startMs: vanDayStart(today).getTime(), endMs: dayEndMs, rolling: false },
    { key: '24h', label: 'Rolling 24 hours', startMs: now - 86400000, endMs: now, rolling: true },
    { key: '7d', label: 'Last 7 days (Pacific calendar)', startMs: vanDayStart(addDaysYmd(today, -6)).getTime(), endMs: dayEndMs, rolling: false },
    { key: '30d', label: 'Last 30 days (Pacific calendar)', startMs: vanDayStart(addDaysYmd(today, -29)).getTime(), endMs: dayEndMs, rolling: false },
    { key: 'all', label: 'All recorded data', startMs: 0, endMs: now + 86400000, rolling: false },
  ];

  // Newest-first session map for conversion attribution.
  const visitBySid = new Map<string, any>();
  for (const v of visits) {
    if (v.sid && ['customer', 'contractor'].includes(visitClass(v))) visitBySid.set(v.sid, v);
  }

  const windows: Record<string, any> = {};
  for (const def of defs) windows[def.key] = computeWindow(def, visits, leads, bookings, visitBySid);

  // ---- Daily series (Pacific calendar days, human traffic, last 30 days) ----
  const vanDate = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ });
  const dayBuckets = new Map<string, { pageviews: number; sids: Set<string>; legacy: number }>();
  for (const v of visits) {
    const cls = visitClass(v);
    if (cls !== 'customer' && cls !== 'contractor') continue;
    const key = vanDate(v.created_date);
    const b = dayBuckets.get(key) || { pageviews: 0, sids: new Set<string>(), legacy: 0 };
    b.pageviews += 1;
    if (v.sid) b.sids.add(v.sid); else b.legacy += 1;
    dayBuckets.set(key, b);
  }
  const daily: any[] = [];
  for (let i = 29; i >= 0; i--) {
    const key = addDaysYmd(today, -i);
    const b = dayBuckets.get(key);
    daily.push({ date: key, pageviews: b?.pageviews || 0, sessions: b?.sids.size || 0, legacy: b?.legacy || 0 });
  }

  // ---- All-time totals & data quality (never rewritten) ----
  const classesAll = { customer: 0, contractor: 0, owner: 0, bot: 0, unclassified: 0 };
  let legacyAll = 0;
  let unattributedAll = 0;
  for (const v of visits) {
    const cls = visitClass(v);
    classesAll[cls] += 1;
    if (cls !== 'customer' && cls !== 'contractor') continue;
    if (!v.sid) legacyAll += 1;
    const ch = channelOf(v);
    if (ch === 'direct' || ch === 'unknown') unattributedAll += 1;
  }

  // Backward-compatible reconciliation fields (session-linked conversions).
  const confirmedSidSet = new Set<string>([
    ...leads.filter((l) => l.sid).map((l) => l.sid),
    ...bookings.filter((b) => b.sid).map((b) => b.sid),
  ]);
  const confirmedDaily = new Map<string, number>();
  for (const v of visits) {
    if (!v.sid || !confirmedSidSet.has(v.sid)) continue;
    const key = vanDate(v.created_date);
    confirmedDaily.set(key, (confirmedDaily.get(key) || 0) + 1);
  }

  const bySourceCompat = (w: any) => {
    const out: Record<string, number> = { facebook: 0, search: 0, direct: 0, other: 0, ai_search: 0, google_business: 0, total: 0 };
    for (const [k, n] of Object.entries(w.sources)) { if (k in out) out[k] = n; out.total += Number(n); }
    return out;
  };
  const w24 = windows['24h'], w7 = windows['7d'], w30 = windows['30d'];

  return {
    tz: TZ,
    tz_note: TZ_NOTE,
    generated_at: new Date(now).toISOString(),
    windows,
    daily,
    definitions: METRIC_DEFINITIONS,
    data_quality: {
      legacy_records_all_time: legacyAll,
      unattributed_records_all_time: unattributedAll,
      unclassified_records_all_time: classesAll.unclassified,
      classification_change_note: 'No historical record has been deleted, overwritten or reclassified. Gaps are labeled (legacy, unclassified, unattributed) rather than filled; classification of a record changes only if the owner edits it explicitly.',
      attribution_note: 'Channel attribution uses only recorded evidence: UTM campaign tags captured at the landing URL, and the HTTP referrer. Traffic with neither stays Direct / unattributed and is never re-labelled by inference. Google Analytics and Search Console remain independent verification sources in their own dashboards.',
      definitions_note: 'visits = distinct human browser sessions (sid). Page views = recorded page-load events. Multiple page views in one session are never counted as separate visits.',
    },
    // Backward-compatible fields for dashboards built on the previous shape.
    compat: {
      visits_24h: bySourceCompat(w24),
      visits_7d: bySourceCompat(w7),
      visits_30d: bySourceCompat(w30),
      bookings_7d: w7.bookings.requests,
      top_city: (w30.cities[0] as any)?.city || '',
      top_paths_24h: w24.top_pages,
      traffic_classes: { '24h': w24.classes, '7d': w7.classes, '30d': w30.classes },
      reconciliation: {
        totals: classesAll,
        confirmed_sessions: confirmedSidSet.size,
        confirmed_visits: visits.filter((v) => v.sid && confirmedSidSet.has(v.sid)).length,
        daily: daily.slice(-14).map((d) => ({ date: d.date.slice(5), visits: d.pageviews, confirmed: confirmedDaily.get(d.date) || 0 })),
      },
    },
  };
}