import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const e = base44.asServiceRole.entities;
    const week = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    const metrics = await Promise.allSettled([
      e.Booking.aggregate({ groupBy: 'status' }),
      e.Booking.count({ created_date: { $gte: week } }),
      e.Booking.aggregate({ query: { status: 'completed' }, sum: 'job_value' }),
      e.RealtorLead.aggregate({ groupBy: 'status' }),
      e.Subscription.aggregate({ groupBy: 'status' }),
      e.Review.count({ approved: false }),
      e.Review.count({ approved: true }),
      e.Visit.count({ created_date: { $gte: week } }),
      e.Visit.aggregate({ query: { created_date: { $gte: week } }, groupBy: 'source' })
    ]);

    const latest = await Promise.allSettled([
      e.Booking.filter({}, { sort: '-created_date', limit: 1, fields: ['name', 'status', 'created_date'] }),
      e.ContentPost.filter({}, { sort: '-created_date', limit: 1, fields: ['title', 'status', 'created_date'] }),
      e.ContentPost.count({ status: 'published' }),
      e.FacebookEngagement.filter({}, { sort: '-created_date', limit: 1, fields: ['post_excerpt', 'posted_date', 'created_date'] }),
      e.FacebookMessageLog.filter({}, { sort: '-created_date', limit: 1, fields: ['sender_name', 'created_date'] }),
      e.Review.filter({}, { sort: '-created_date', limit: 1, fields: ['customer_name', 'created_date'] }),
      e.RecyclingCenter.filter({}, { sort: '-created_date', limit: 1, fields: ['name', 'researched_date', 'created_date'] }),
      e.ResearchResult.filter({}, { sort: '-created_date', limit: 1, fields: ['topic', 'origin', 'created_date'] }),
      e.Subscription.filter({}, { sort: '-created_date', limit: 1, fields: ['company', 'plan', 'created_date'] })
    ]);

    const errors = await Promise.allSettled([
      e.FacebookMessageLog.count({ error: { $ne: '' } }),
      e.FacebookMessageLog.filter({ error: { $ne: '' } }, { sort: '-created_date', limit: 10, fields: ['sender_name', 'message_text', 'error', 'created_date'] })
    ]);

    const val = (i, fallback) => (metrics[i].status === 'fulfilled' ? metrics[i].value : fallback);
    const last = (i, fallback) => {
      const r = latest[i];
      if (r.status !== 'fulfilled') return fallback;
      const v = Array.isArray(r.value) ? r.value[0] : r.value?.items?.[0] ?? r.value?.[0];
      return v || fallback;
    };
    const errVal = (i, fallback) => (errors[i].status === 'fulfilled' ? errors[i].value : fallback);
    const errLast = (i, fallback) => {
      const r = errors[i];
      if (r.status !== 'fulfilled') return fallback;
      const v = Array.isArray(r.value) ? r.value : r.value?.items ?? [];
      return v;
    };

    const byStatus = (agg) => {
      const rows = agg?.rows || [];
      const map = {};
      rows.forEach((r) => { map[r.status || 'unknown'] = r.count; });
      return map;
    };

    const visitRows = val(8, null)?.rows || [];
    const visitsBySource = {};
    visitRows.forEach((r) => { visitsBySource[r.source || 'other'] = r.count; });

    const latestOf = (v) => (v ? v.created_date || v.researched_date || null : null);

    return Response.json({
      generated_at: new Date().toISOString(),
      business: {
        bookings: byStatus(val(0, null)),
        bookings_total: Object.values(byStatus(val(0, null))).reduce((a, b) => a + b, 0),
        bookings_7d: val(1, 0),
        completed_revenue: val(2, null)?.rows?.[0]?.sum_job_value || 0,
        realtor_leads: byStatus(val(3, null)),
        subscriptions: byStatus(val(4, null)),
        reviews_pending: val(5, 0),
        reviews_approved: val(6, 0),
        visits_7d: val(7, 0),
        visits_by_source: visitsBySource
      },
      automations: {
        latest_booking: latestOf(last(0, null)),
        latest_blog_post: latestOf(last(1, null)),
        blog_published_count: latest[2].status === 'fulfilled' ? latest[2].value : 0,
        latest_blog_title: last(1, null)?.title || null,
        latest_fb_post: latestOf(last(3, null)),
        latest_fb_message: latestOf(last(4, null)),
        latest_review: latestOf(last(5, null)),
        latest_recycling_sync: latestOf(last(6, null)),
        latest_research: latestOf(last(7, null)),
        latest_subscription: latestOf(last(8, null))
      },
      errors: {
        total_fb_errors: errVal(0, 0),
        recent: errLast(1, [])
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}