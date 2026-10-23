import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Rex Intelligence: answers the owner's natural-language questions using real
// platform data (conversion funnel, Search Console, market opportunity).
// Findings must cite the data; Rex recommends actions but never publishes,
// spends, or changes settings — this function is read-only plus an audit log.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let payload = {};
    try { payload = await req.json(); } catch {}
    const question = String(payload.question || '').trim().slice(0, 500);
    if (!question) return Response.json({ error: 'Ask a question first.' }, { status: 400 });

    const settled = await Promise.allSettled([
      base44.functions.invoke('conversionFunnel', { days: 30 }),
      base44.functions.invoke('searchAuthority', {}),
      base44.functions.invoke('marketOpportunity', {}),
    ]);
    const val = (i) => (settled[i].status === 'fulfilled' ? (settled[i].value?.data ?? settled[i].value) : { unavailable: true });

    const funnel = val(0);
    const search = val(1);
    const market = val(2);

    const compact = JSON.stringify({
      funnel_30d: {
        visits_by_class: funnel?.funnel?.visits?.by_class,
        quote_leads: funnel?.funnel?.quote_leads,
        booking_requests: funnel?.funnel?.booking_requests,
        confirmed: funnel?.funnel?.confirmed,
        completed: funnel?.funnel?.completed,
        paid: funnel?.funnel?.paid,
        rates: funnel?.rates,
        money: funnel?.money,
        top_cities: funnel?.cities,
      },
      search_console: {
        connected: search?.connected,
        totals_28d: search?.totals,
        previous_28d: search?.totals_previous,
        top_queries: (search?.queries || []).slice(0, 10),
        top_pages: (search?.pages || []).slice(0, 10),
        index: search?.index,
        opportunities: (search?.opportunities || []).slice(0, 5),
      },
      market: {
        cities: (market?.cities || []).slice(0, 12),
        search_connected: market?.search_connected,
      },
    });

    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are Rex, the intelligence analyst inside Recycling OS for Same Day Recycling (samedayrecycling.ca). ' +
        'The owner asks: "' + question + '"\n\n' +
        'Answer ONLY from the data below. Rules:\n' +
        '- Every finding must name its source (e.g. "Search Console, last 28 days", "booking funnel, 30 days", "market engine").\n' +
        '- If a data source is unavailable, say so plainly instead of guessing.\n' +
        '- Recommend concrete next actions ranked by business impact; mark the single highest-impact action.\n' +
        '- Never invent numbers, reviews, competitor stats or guarantees. Do not offer to publish, spend, or change settings.\n\n' +
        'DATA (30-day funnel, 28-day Search Console, market opportunity engine):\n' + compact,
      response_json_schema: {
        type: 'object',
        properties: {
          answer: { type: 'string' },
          findings: {
            type: 'array',
            items: { type: 'object', properties: { claim: { type: 'string' }, source: { type: 'string' } }, required: ['claim', 'source'] },
          },
          actions: {
            type: 'array',
            items: { type: 'object', properties: { action: { type: 'string' }, priority: { type: 'string', enum: ['highest', 'high', 'medium', 'low'] }, rationale: { type: 'string' } }, required: ['action', 'priority', 'rationale'] },
          },
        },
        required: ['answer', 'findings', 'actions'],
      },
    });

    await base44.entities.AiActionLog.create({
      actor: 'rex',
      action: 'rex_intelligence',
      summary: `Answered owner question: "${question.slice(0, 200)}"`,
      outcome: 'success',
      target_type: 'other',
    });

    return Response.json({
      ok: true,
      answer: ai.answer || '',
      findings: ai.findings || [],
      actions: ai.actions || [],
      data_windows: { funnel: '30 days', search: search?.connected ? `${search.startDate} → ${search.endDate}` : 'not connected' },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}