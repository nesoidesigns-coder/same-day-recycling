import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';
import { byClass, HUMAN_FILTER, SESSION_FILTER } from '../../shared/analytics.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const now = Date.now();
    const weekAgo = new Date(now - 7 * 86400000).toISOString();
    const monthAgo = new Date(now - 30 * 86400000).toISOString();

    const bySource = (rows, key) => {
      const out = { facebook: 0, search: 0, direct: 0, other: 0, ai_search: 0, total: 0 };
      (rows || []).forEach((row) => {
        const src = String(row.source || 'other');
        if (src in out) out[src] += row.count || 0;
        out.total += row.count || 0;
      });
      return out;
    };

    // Shared classification layer — identical definitions on every dashboard.
    // Historical records with no class are 'unclassified', never auto-counted
    // as customers. Real traffic = customer + contractor only.

    const dayAgo = new Date(now - 86400000).toISOString();
    const REAL = HUMAN_FILTER;
    const [weekRows, monthRows, bookingsWeek, cityRows, todayRows, pathRows, classesDay, classesWeek, classesMonth] = await Promise.all([
      base44.asServiceRole.entities.Visit.aggregate({ query: { created_date: { $gte: weekAgo }, ...REAL }, groupBy: 'source' }),
      base44.asServiceRole.entities.Visit.aggregate({ query: { created_date: { $gte: monthAgo }, ...REAL }, groupBy: 'source' }),
      base44.asServiceRole.entities.Booking.count({ created_date: { $gte: weekAgo }, status: { $ne: 'cancelled' }, record_type: 'service' }),
      base44.asServiceRole.entities.Booking.aggregate({ query: { created_date: { $gte: monthAgo }, status: { $ne: 'cancelled' }, record_type: 'service' }, groupBy: 'city', sort: '-count', limit: 5 }),
      base44.asServiceRole.entities.Visit.aggregate({ query: { created_date: { $gte: dayAgo }, ...REAL }, groupBy: 'source' }),
      base44.asServiceRole.entities.Visit.aggregate({ query: { created_date: { $gte: dayAgo }, ...REAL }, groupBy: 'path', sort: '-count', limit: 5 }),
      base44.asServiceRole.entities.Visit.aggregate({ query: { created_date: { $gte: dayAgo } }, groupBy: 'traffic_class' }),
      base44.asServiceRole.entities.Visit.aggregate({ query: { created_date: { $gte: weekAgo } }, groupBy: 'traffic_class' }),
      base44.asServiceRole.entities.Visit.aggregate({ query: { created_date: { $gte: monthAgo } }, groupBy: 'traffic_class' }),
    ]);

    // ---- Traffic reconciliation ----
    // Totals: every visit, split into classified and unverified (pre-classification) records.
    // Confirmed customers: visits whose anonymous session key (sid) matches a
    // session that produced a quote request or booking. Everything else stays
    // unverified — no guessing.
    const fortnightAgo = new Date(now - 14 * 86400000).toISOString();
    const [classAll, leadSidRows, bookingSidRows] = await Promise.all([
      base44.asServiceRole.entities.Visit.aggregate({ query: {}, groupBy: 'traffic_class' }),
      base44.asServiceRole.entities.QuoteLead.filter(SESSION_FILTER, { limit: 500 }),
      base44.asServiceRole.entities.Booking.filter(SESSION_FILTER, { limit: 500 }),
    ]);
    const confirmedSids = [...new Set([
      ...(leadSidRows.items || leadSidRows || []).map((r) => r.sid).filter(Boolean),
      ...(bookingSidRows.items || bookingSidRows || []).map((r) => r.sid).filter(Boolean),
    ])];
    const confirmedVisits = confirmedSids.length
      ? await base44.asServiceRole.entities.Visit.count({ sid: { $in: confirmedSids } })
      : 0;
    const [dailyGenuine, dailyConfirmed] = await Promise.all([
      base44.asServiceRole.entities.Visit.aggregate({
        query: { created_date: { $gte: fortnightAgo }, traffic_class: { $in: ['customer', 'contractor'] } },
        dateBucket: { field: 'created_date', unit: 'day' },
      }),
      confirmedSids.length
        ? base44.asServiceRole.entities.Visit.aggregate({
            query: { created_date: { $gte: fortnightAgo }, sid: { $in: confirmedSids } },
            dateBucket: { field: 'created_date', unit: 'day' },
          })
        : Promise.resolve({ rows: [] }),
    ]);
    const reconciledAll = byClass(classAll?.rows);
    // Genuine customer activity by day (Vancouver local days), last 14 days,
    // with confirmed-customer sessions broken out.
    const dayKey = (iso) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' });
    const genuineByDay = new Map((dailyGenuine?.rows || []).map((r) => [dayKey(r.created_date), r.count || 0]));
    const confirmedByDay = new Map((dailyConfirmed?.rows || []).map((r) => [dayKey(r.created_date), r.count || 0]));
    const daily = [];
    for (let i = 13; i >= 0; i--) {
      const key = new Date(now - i * 86400000).toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' });
      daily.push({
        date: key.slice(5),
        visits: genuineByDay.get(key) || 0,
        confirmed: confirmedByDay.get(key) || 0,
      });
    }

    const cityRow = (cityRows?.rows || []).find((r) => String(r.city || '').trim());
    return Response.json({
      visits_24h: bySource(todayRows?.rows),
      top_paths_24h: (pathRows?.rows || []).map((r) => ({ path: r.path || '/', count: r.count || 0 })),
      visits_7d: bySource(weekRows?.rows),
      visits_30d: bySource(monthRows?.rows),
      bookings_7d: bookingsWeek,
      top_city: cityRow ? cityRow.city : '',
      traffic_classes: {
        '24h': byClass(classesDay?.rows),
        '7d': byClass(classesWeek?.rows),
        '30d': byClass(classesMonth?.rows),
      },
      reconciliation: {
        totals: reconciledAll,
        confirmed_sessions: confirmedSids.length,
        confirmed_visits: confirmedVisits,
        daily,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}