import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Scheduled by the "Auto SEO" workflow: pulls fresh Google Search Console keywords,
// runs the SEO strategist AI, saves the analysis into ResearchResult and returns the
// report for the owner's email. No manual step needed.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const kwRes = await base44.functions.invoke('searchConsoleKeywords', {});
    const kwRaw = kwRes || {};
    const keywords = (kwRaw.keywords || (kwRaw.data && kwRaw.data.keywords)) || [];

    if (!keywords.length) {
      return Response.json({ ok: true, skipped: 'No Search Console keywords yet — site may still be indexing' });
    }

    const compact = keywords.map((k) =>
      `"${k.query}" | page: ${k.page} | clicks ${k.clicks || 0} | impressions ${k.impressions || 0} | avg position ${k.position || '?'}`
    ).join('\n');

    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are an SEO strategist for Same Day Recycling (samedayrecycling.ca), a same-day junk removal service across Canada. ' +
        'STRATEGY: topical authority through service-specific local long-tail keywords - item + city queries like "couch removal Vancouver" - rather than generic "junk removal" head terms. Prioritize long-tail quick wins over head-term advice. ' +
        'Its site has city and location pages, ' +
        'plus pages for subscriptions (property managers), realtor partners, free metal pickup, contractors, about and contact. ' +
        'Below are real Google Search Console queries (last 28 days) with the page they matched, clicks, impressions and average position.\n\n' +
        compact +
        '\n\nProduce concrete, actionable SEO recommendations: which pages to improve, what each page title and meta description should say, ' +
        'which keywords to target in the page copy (including ones with high impressions but low clicks where a better title could win the click), ' +
        'and 2-3 short content ideas per important page. Flag quick wins first (queries ranked 4-15 with decent impressions). ' +
        'Write for a busy owner: plain language, each item one sentence.',
      response_json_schema: {
        type: 'object',
        properties: {
          quick_wins: {
            type: 'array',
            items: { type: 'string' },
          },
          page_actions: {
            type: 'array',
            items: { type: 'string' },
          },
          notes: { type: 'string' },
        },
        required: ['quick_wins', 'page_actions', 'notes'],
      },
    });

    const quickWins = (ai.quick_wins || []).slice(0, 3).map((w) => String(w));
    const actions = (ai.page_actions || []).slice(0, 3).map((a) => String(a));
    const notes = String(ai.notes || '');

    // Save into the central analysis history so it shows on the admin pricing page
    try {
      await base44.asServiceRole.entities.ResearchResult.create({
        topic: `Auto SEO — ${new Date().toISOString().slice(0, 10)}`,
        summary: notes,
        key_takeaways: quickWins,
        opportunities: actions,
        sources: [],
        origin: 'admin_tool',
      });
    } catch {}

    return Response.json({ ok: true, summary: notes, quick_wins: quickWins, actions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}