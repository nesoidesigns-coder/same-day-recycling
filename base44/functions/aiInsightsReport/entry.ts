import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const [statsRes, leadCount, kwRes] = await Promise.allSettled([
      base44.functions.invoke('visitStats', {}),
      base44.asServiceRole.entities.RealtorLead.count({ created_date: { $gte: new Date(Date.now() - 7 * 86400000).toISOString() } }),
      base44.functions.invoke('searchConsoleKeywords', {}),
    ]);

    const statsRaw = statsRes.status === 'fulfilled' ? statsRes.value : null;
    const stats = statsRaw && statsRaw.visits_7d ? statsRaw : (statsRaw && statsRaw.data) || null;
    const leads7d = leadCount.status === 'fulfilled' ? leadCount.value : 0;
    const kwRaw = kwRes.status === 'fulfilled' ? kwRes.value : null;
    const keywords = (kwRaw && (kwRaw.keywords || (kwRaw.data && kwRaw.data.keywords))) || [];

    const compactKw = keywords.slice(0, 15).map((k) =>
      '"${k.query}" (position ' + (k.position || '?') + ', ' + (k.impressions || 0) + ' impressions, ' + (k.clicks || 0) + ' clicks)'
    ).join('; ');

    const traffic = stats && stats.visits_7d
      ? 'Total visits: ' + (stats.visits_7d.total || 0) +
        ' (Facebook ' + (stats.visits_7d.facebook || 0) +
        ', search ' + (stats.visits_7d.search || 0) +
        ', direct ' + (stats.visits_7d.direct || 0) +
        ', other ' + (stats.visits_7d.other || 0) + ')' +
        '. Bookings last 7 days: ' + (stats.bookings_7d || 0) + '.'
      : 'Traffic stats unavailable this week.';

    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are the growth analyst for Same Day Recycling (samedayrecycling.ca), a same-day junk removal and recycling service in Canada, serving major Canadian cities.\n\n' +
        'Last 7 days of real data:\n' + traffic + '\nNew realtor leads: ' + leads7d + '\n' +
        'Top Google search queries: ' + (compactKw || 'no search data yet') + '\n\n' +
        'Briefly scan the live web for anything new that affects local junk removal demand (seasonal trends, competitor moves, city disposal changes), ' +
        'then combine it with the data above. Write for a busy business owner: a 2-3 sentence summary of the week, ONE standout takeaway, exactly 3 concrete actions to grow bookings next week (each under 25 words), and one marketing move worth trying this month.',
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          top_takeaway: { type: 'string' },
          actions: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 3 },
          marketing_move: { type: 'string' },
        },
        required: ['summary', 'top_takeaway', 'actions', 'marketing_move'],
      },
    });

    return Response.json({
      ok: true,
      visits_total: stats && stats.visits_7d ? stats.visits_7d.total : null,
      bookings_7d: stats ? stats.bookings_7d : null,
      leads_7d: leads7d,
      top_keyword: keywords.length ? keywords[0].query : '',
      summary: ai.summary || '',
      top_takeaway: ai.top_takeaway || '',
      actions: ai.actions || [],
      marketing_move: ai.marketing_move || '',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}