import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';

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
      const out = { facebook: 0, search: 0, direct: 0, other: 0, total: 0 };
      (rows || []).forEach((row) => {
        const src = String(row.source || 'other');
        if (src in out) out[src] += row.count || 0;
        out.total += row.count || 0;
      });
      return out;
    };

    const dayAgo = new Date(now - 86400000).toISOString();
    const [weekRows, monthRows, bookingsWeek, cityRows, todayRows, pathRows] = await Promise.all([
      base44.asServiceRole.entities.Visit.aggregate({ query: { created_date: { $gte: weekAgo } }, groupBy: 'source' }),
      base44.asServiceRole.entities.Visit.aggregate({ query: { created_date: { $gte: monthAgo } }, groupBy: 'source' }),
      base44.asServiceRole.entities.Booking.count({ created_date: { $gte: weekAgo }, status: { $ne: 'cancelled' } }),
      base44.asServiceRole.entities.Booking.aggregate({ query: { created_date: { $gte: monthAgo }, status: { $ne: 'cancelled' } }, groupBy: 'city', sort: '-count', limit: 5 }),
      base44.asServiceRole.entities.Visit.aggregate({ query: { created_date: { $gte: dayAgo } }, groupBy: 'source' }),
      base44.asServiceRole.entities.Visit.aggregate({ query: { created_date: { $gte: dayAgo } }, groupBy: 'path', sort: '-count', limit: 5 }),
    ]);

    const cityRow = (cityRows?.rows || []).find((r) => String(r.city || '').trim());
    return Response.json({
      visits_24h: bySource(todayRows?.rows),
      top_paths_24h: (pathRows?.rows || []).map((r) => ({ path: r.path || '/', count: r.count || 0 })),
      visits_7d: bySource(weekRows?.rows),
      visits_30d: bySource(monthRows?.rows),
      bookings_7d: bookingsWeek,
      top_city: cityRow ? cityRow.city : '',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}