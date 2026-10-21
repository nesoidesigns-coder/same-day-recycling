import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let payload = {};
    try { payload = await req.json(); } catch {}
    const keywords = Array.isArray(payload.keywords) ? payload.keywords.slice(0, 150) : [];
    if (!keywords.length) {
      return Response.json({ error: 'Pass keywords from searchConsoleKeywords' }, { status: 400 });
    }

    const compact = keywords.map((k) =>
      `"${k.query}" | page: ${k.page} | clicks ${k.clicks || 0} | impressions ${k.impressions || 0} | avg position ${k.position || '?'}`
    ).join('\n');

    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are an SEO strategist for Same Day Recycling (samedayrecycling.ca), a same-day junk removal service across Canada. ' +
        'Its site has city and location pages, ' +
        'plus pages for subscriptions (property managers), realtor partners, free metal pickup, contractors, about and contact. ' +
        'Below are real Google Search Console queries (last 28 days) with the page they matched, clicks, impressions and average position.\n\n' +
        compact +
        '\n\nProduce concrete, actionable SEO recommendations: which pages to improve, what each page title and meta description should say, ' +
        'which keywords to target in the page copy (including ones with high impressions but low clicks where a better title could win the click), ' +
        'and 2-3 short content ideas per important page. Flag quick wins first (queries ranked 4-15 with decent impressions).',
      response_json_schema: {
        type: 'object',
        properties: {
          quick_wins: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                query: { type: 'string' },
                page: { type: 'string' },
                why: { type: 'string' },
              },
              required: ['query', 'page', 'why'],
            },
          },
          page_recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                page: { type: 'string' },
                focus_keywords: { type: 'array', items: { type: 'string' } },
                title_suggestion: { type: 'string' },
                meta_suggestion: { type: 'string' },
                content_ideas: { type: 'array', items: { type: 'string' } },
              },
              required: ['page', 'focus_keywords', 'title_suggestion', 'meta_suggestion', 'content_ideas'],
            },
          },
          notes: { type: 'string' },
        },
        required: ['quick_wins', 'page_recommendations', 'notes'],
      },
    });

    return Response.json({
      ok: true,
      quick_wins: ai.quick_wins || [],
      page_recommendations: ai.page_recommendations || [],
      notes: ai.notes || '',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}