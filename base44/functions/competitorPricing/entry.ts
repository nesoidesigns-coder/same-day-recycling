import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Admin tool: pulls current competitor pricing and service data for major Canadian
// metros (junk removal) from the web (AI + internet), stores it in CompetitorPricing.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      add_context_from_internet: true,
      prompt: `Research CURRENT published pricing and services for junk removal companies serving major Canadian metros (Toronto, Montreal, Ottawa, Calgary, Edmonton). Cover these known competitors: 1-800-GOT-JUNK, JUSTJUNK, Removerz, Joey's Junk Removal, plus up to 3 more major local players you find.\n\nFor EACH company return: name; city/area served; typical price range in CAD for a truck load (e.g. "$250-$800 depending on volume"); minimum charge or minimum load price in CAD if published (junk removal minimums are usually $100-$200); services offered (junk removal, furniture, appliance, demolition, metal, estate cleanouts, etc.); the source URL you based it on; and a short note on their positioning (franchise scale, eco claims, subscription offerings, free estimates, etc.).\n\nAlso return a one-paragraph market summary: typical minimums, typical full-load prices, and where a premium same-day service with upfront pricing fits.\n\nUse real, current figures from their sites or review pages where possible; mark estimates clearly in the note when pricing is not published.`,
      response_json_schema: {
        type: 'object',
        properties: {
          market_summary: { type: 'string' },
          competitors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                city: { type: 'string' },
                price_range: { type: 'string' },
                minimum: { type: 'string' },
                services: { type: 'string' },
                source_url: { type: 'string' },
                note: { type: 'string' },
              },
              required: ['name'],
            },
          },
        },
        required: ['market_summary', 'competitors'],
      },
    });

    const comps = (llm.competitors || []).filter((c) => c && c.name).slice(0, 8);
    const summary = String(llm.market_summary || '').slice(0, 950);
    const records = comps.map((c) => ({
      name: String(c.name).slice(0, 120),
      city: String(c.city || 'Canada').slice(0, 80),
      price_range: String(c.price_range || '').slice(0, 200),
      minimum: String(c.minimum || '').slice(0, 120),
      services: String(c.services || '').slice(0, 500),
      source_url: String(c.source_url || '').slice(0, 500),
      note: String(c.note || '').slice(0, 950),
      market_summary: summary,
    }));

    if (records.length) {
      await base44.entities.CompetitorPricing.upsert(records, { key: 'name' });
    }

    return Response.json({ ok: true, count: records.length, summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}