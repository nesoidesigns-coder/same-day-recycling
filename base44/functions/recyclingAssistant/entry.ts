import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  CATEGORY_LABELS,
  matchCategories,
  providerMatchesQuery,
  providerMatchesLocation,
  extractLocationHint,
} from '../../shared/recyclingTaxonomy.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body.messages) ? body.messages.slice(-8).filter((m) => m && m.content) : [];
    const last = messages.length ? messages[messages.length - 1].content : (body.message || '');
    if (!last || !last.trim()) return Response.json({ error: 'A message is required' }, { status: 400 });

    // Location: the location box wins, then a city named in the message (matched against
    // the directory's own city values), then a postal code / province pulled from the message.
    const msgLoc = extractLocationHint(last);
    let loc = String(body.location || '').trim() || msgLoc;

    // Matching listings from our own nationwide directory (real records only, no fabrication),
    // matched by material type (11-category taxonomy + free text) and by city/postal/province.
    let local = [];
    try {
      const page = await base44.entities.Provider.filter({}, { sort: '-created_date', limit: 500 });
      const all = page.items || page;
      if (!loc) {
        const lower = last.toLowerCase();
        const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const cityHit = [...new Set(all.map((p) => String(p.city || '').trim()).filter(Boolean))]
          .find((c) => new RegExp(`\\b${esc(c.toLowerCase())}\\b`).test(lower));
        if (cityHit) loc = cityHit;
      }
      const queryMatches = all.filter((p) => providerMatchesQuery(p, last));
      const located = queryMatches.filter((p) => providerMatchesLocation(p, loc));
      // Fall back to province-wide / query-only matches when nothing matches the exact location.
      local = (located.length ? located : queryMatches).slice(0, 6);
    } catch {
      local = [];
    }

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      prompt: [
        'You are the Same Day Recycling Assistant for samedayrecycling.ca, helping Canadians recycle correctly.',
        'User location (may be empty): ' + (loc || 'not specified') + '.',
        'Material categories detected in the request: ' + JSON.stringify(matchCategories(last).map((k) => CATEGORY_LABELS[k] || k)) + '.',
        'Listings from our own nationwide directory that match the request (may be empty): ' + JSON.stringify(local.map((p) => ({
          name: p.name,
          type: p.provider_type,
          city: p.city,
          province: p.province,
          address: p.address,
          phone: p.phone,
          website: p.website,
          hours: p.hours,
          service: p.service_type,
          verification: p.verification,
          accepted: (p.accepted_categories || []).map((k) => CATEGORY_LABELS[k] || k),
          materials: p.materials_note,
          fees: p.fees,
        }))) + '.',
        'Strict rules:',
        '- When directory listings match, recommend them FIRST by name with their city, and mention they are in our directory on samedayrecycling.ca (link /provider/<id> paths under https://samedayrecycling.ca).',
        '- Prioritize official municipal and provincial recycling sources for rules, and cite them as URLs.',
        '- Recycling rules vary by municipality. If you cannot confirm rules for the user\'s specific location, say so clearly in the uncertainty field and direct them to their municipality or a facility in our directory.',
        '- Never claim a specific material is recyclable without a source. When unsure, say what to check.',
        '- If the user describes a photo of an item, treat it only as a possible category hint, never as proof of composition or recyclability.',
        '- Be concise: under 180 words in the answer field. Recommend drop-off or pickup options where they exist.',
        '- Do not invent facilities, addresses, fees, or phone numbers.',
      ].join('\n'),
      response_json_schema: {
        type: 'object',
        properties: {
          answer: { type: 'string' },
          sources: { type: 'array', items: { type: 'string' } },
          uncertainty: { type: 'string' },
        },
        required: ['answer'],
      },
    });

    return Response.json({
      reply: llm.answer || '',
      sources: Array.isArray(llm.sources) ? llm.sources : [],
      uncertainty: llm.uncertainty || '',
      local_providers: local,
      matched_location: loc || '',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}