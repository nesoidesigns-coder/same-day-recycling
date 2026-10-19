import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let payload = {};
    try { payload = await req.json(); } catch {}
    const topic = String(payload.topic || '').trim().slice(0, 300);
    if (!topic) return Response.json({ error: 'Pass a topic to research' }, { status: 400 });

    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are a research analyst for Same Day Recycling (samedayrecycling.ca), a same-day junk removal and recycling service in British Columbia, Canada, serving Vancouver, Burnaby, Richmond, Surrey, Coquitlam, Kamloops and Kelowna.\n\n' +
        'Research this topic using live web sources and turn it into insightful, actionable knowledge for the business owner:\n\n' +
        '"' + topic + '"\n\n' +
        'Focus on facts specific to British Columbia and Canada where relevant (regulations, bylaws, prices in CAD, local rules). ' +
        'Be concrete, cite which source each insight comes from, and prioritize what the owner can actually act on. No fluff.',
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          key_takeaways: { type: 'array', items: { type: 'string' } },
          opportunities: { type: 'array', items: { type: 'string' } },
          sources: { type: 'array', items: { type: 'string' } },
        },
        required: ['summary', 'key_takeaways', 'opportunities', 'sources'],
      },
    });

    return Response.json({
      ok: true,
      summary: ai.summary || '',
      key_takeaways: ai.key_takeaways || [],
      opportunities: ai.opportunities || [],
      sources: ai.sources || [],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}