import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Scheduled by the "Auto SEO" workflow: researches the best local keywords and
// AI-writes optimized meta tags + hero copy for every city landing page, then
// saves them so the pages apply them automatically. Admin-only.
const CITIES = ['Vancouver', 'Toronto', 'Montreal', 'Ottawa', 'Calgary', 'Edmonton', 'Winnipeg', 'Hamilton', 'Mississauga', 'Halifax', 'Quebec City'];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Real search data first, so the AI optimizes against actual queries
    let kwCompact = 'No Search Console data yet - optimize from local search best practices.';
    try {
      const kwRes = await base44.functions.invoke('searchConsoleKeywords', {});
      const keywords = (kwRes?.keywords || (kwRes?.data && kwRes.data.keywords)) || [];
      if (keywords.length) {
        kwCompact = keywords.slice(0, 100).map((k) =>
          `"${k.query}" | page: ${k.page} | clicks ${k.clicks || 0} | impressions ${k.impressions || 0} | position ${k.position || '?'}`
        ).join('\n');
      }
    } catch {}

    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are an SEO copywriter for Same Day Recycling (samedayrecycling.ca), a same-day junk removal and recycling service in Canada. ' +
        'STRATEGY: build topical authority with service-specific local long-tail keywords - item + city queries like "couch removal Vancouver" and "mattress disposal Ottawa" - instead of generic "junk removal" head terms where big franchises dominate. ' +
        'Write optimized page meta and hero copy for each of its city landing pages. Facts: same-day service (book before noon, crew arrives same afternoon), upfront pricing approved on-site before anything is lifted, eco disposal (recycle/donate, receipts), phone (604) 849-1745.\n\n' +
        'For EACH city below return: ' +
        'seo_title (max 60 characters, unique per city, LEADS with one specific removal service plus the city - rotate the lead service across cities: "Couch Removal {City}", "Furniture Removal {City}", "Mattress Disposal {City}", "Appliance Removal {City}", "E-Waste Pickup {City}" - never a bare "Junk Removal {City}" head term), ' +
        'seo_description (max 155 characters, leads with that same specific service, includes the city, mentions same-day pickup and upfront pricing, ends with a reason to click), ' +
        'hero_intro (1-2 sentences of unique, natural-sounding page copy naming a specific service (e.g. couch or appliance removal) and something genuinely local about the city - no fluff, no keyword stuffing), ' +
        'keywords (5-6 comma-separated service-specific long-tail terms for that city, each an item-plus-city phrase like "couch removal {City}", "sofa pickup {City}", "mattress disposal {City}", "appliance removal {City}", "same day furniture removal {City}", "e-waste pickup {City}" - never the bare head term "junk removal {City}").\n\n' +
        'Prefer service terms that appear in the real Google search data below.\n\n' +
        'REAL GOOGLE SEARCH DATA (last 28 days):\n' + kwCompact + '\n\n' +
        'CITIES: ' + CITIES.join(', '),
      response_json_schema: {
        type: 'object',
        properties: {
          cities: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                city: { type: 'string' },
                seo_title: { type: 'string' },
                seo_description: { type: 'string' },
                hero_intro: { type: 'string' },
                keywords: { type: 'string' },
              },
              required: ['city', 'seo_title', 'seo_description', 'hero_intro', 'keywords'],
            },
          },
        },
        required: ['cities'],
      },
    });

    const rows = (ai.cities || [])
      .filter((r) => r.city && r.seo_title && r.seo_description)
      .map((r) => ({
        city: CITIES.find((c) => c.toLowerCase() === String(r.city).toLowerCase()) || r.city,
        seo_title: String(r.seo_title).slice(0, 70),
        seo_description: String(r.seo_description).slice(0, 165),
        hero_intro: String(r.hero_intro || ''),
        keywords: String(r.keywords || ''),
        updated_date: new Date().toISOString().slice(0, 10),
      }));

    if (!rows.length) {
      return Response.json({ ok: false, error: 'AI returned no usable city content' }, { status: 500 });
    }

    await base44.asServiceRole.entities.CitySeo.upsert(rows, { key: 'city' });

    return Response.json({ ok: true, updated: rows.length, cities: rows.map((r) => r.city) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}