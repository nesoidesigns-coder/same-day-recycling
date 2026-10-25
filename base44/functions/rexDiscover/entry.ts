import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  CATEGORY_LABELS,
  matchCategories,
  providerMatchesQuery,
  providerMatchesLocation,
  extractLocationHint,
} from '../../shared/recyclingTaxonomy.ts';

// Rex Discover: anonymous consumer research. Answers are grounded in the
// Recycling OS knowledge bases (city rules, competitor pricing, own published
// pricing, provider directory) plus web context. Research is NEVER captured as
// a lead and nobody is contacted automatically.

const FREE_ALT_RULES = [
  'free_alternatives must list real municipal, donation or DIY options (e.g. municipal drop-off depots, Habitat for Humanity ReStore, thrift stores, city bulk pickup) when they would work for the customer.',
  'Never list a free alternative you cannot verify for the customer area - say in the alternative label what to check instead.',
];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body.messages) ? body.messages.slice(-8).filter((m) => m && m.content) : [];
    const last = messages.length ? messages[messages.length - 1].content : (body.message || '');
    if ((!last || !last.trim()) && body.mode !== 'price_compare') {
      return Response.json({ error: 'A question is required' }, { status: 400 });
    }

    const msgLoc = extractLocationHint(last);
    const loc = String(body.location || '').trim() || msgLoc;

    // --- Knowledge bases (deliberate public research lookups; these are
    // published/aggregate marketing data, safe to expose anonymously). ---
    const lower = last.toLowerCase();
    const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // --- Structured price-comparison mode: verified published rates only,
    // no invented averages, no LLM needed. ---
    if (body.mode === 'price_compare') {
      const cityIn = String(body.city || loc || '').trim();
      let ownRows = [];
      try {
        const page = await base44.asServiceRole.entities.PricingSettings.filter({});
        ownRows = page.items || page;
      } catch { ownRows = []; }
      let compRows = [];
      try {
        const page = await base44.asServiceRole.entities.CompetitorPricing.filter({});
        compRows = (page.items || page).filter((c) => c.is_sample !== true && c.is_sample !== 'true');
      } catch { compRows = []; }
      const seen = new Set();
      const cityList = compRows
        .map((c) => String(c.city || '').trim())
        .filter((c) => {
          const k = c.toLowerCase();
          if (!c || seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      const hitCity = cityIn
        ? cityList.find((c) => new RegExp(`\\b${esc(c.toLowerCase())}\\b`).test(cityIn.toLowerCase())) || ''
        : '';
      const own = (hitCity && ownRows.find((p) => String(p.city || '').toLowerCase() === hitCity.toLowerCase()))
        || ownRows.find((p) => !p.city) || null;
      const competitors = hitCity
        ? compRows.filter((c) => new RegExp(`\\b${esc(String(c.city || '').toLowerCase())}\\b`).test(hitCity.toLowerCase())).slice(0, 6)
        : [];
      const parseNum = (s) => {
        const m = String(s || '').replace(/,/g, '').match(/\$?\s?(\d+(?:\.\d+)?)/);
        return m ? parseFloat(m[1]) : null;
      };
      const mins = competitors.map((c) => parseNum(c.minimum)).filter((n) => n != null);
      const lows = competitors.map((c) => parseNum(String(c.price_range || '').split(/[-\u2013\u2014]/)[0])).filter((n) => n != null);
      const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);
      return Response.json({
        mode: 'price_compare',
        city: hitCity,
        cities: cityList,
        own_pricing: own ? {
          city: own.city || '',
          tiers: {
            minimum_pickup: own.minimum_pickup,
            one_eighth_truck: own.eighth_truck,
            quarter_truck: own.quarter_truck,
            half_truck: own.half_truck,
            three_quarter_truck: own.three_quarter_truck,
            full_truck: own.full_truck,
          },
        } : null,
        competitors: competitors.map((c) => ({
          name: c.name, city: c.city, price_range: c.price_range, minimum: c.minimum,
          services: c.services, source_url: c.source_url,
        })),
        market_summary: competitors.find((c) => c.market_summary)?.market_summary || '',
        local_averages: {
          minimum_avg: avg(mins),
          range_low_avg: avg(lows),
          provider_count: mins.length,
          basis: 'average of advertised minimums on file, from verified provider records only',
        },
      });
    }

    // Own published pricing for the customer's city (or the platform default).
    let ownPricing = null;
    try {
      const page = await base44.asServiceRole.entities.PricingSettings.filter({});
      const all = page.items || page;
      const cityHit = loc && all.find((p) => new RegExp(`\\b${esc(String(p.city || '').toLowerCase())}\\b`).test(loc.toLowerCase()));
      ownPricing = cityHit || all.find((p) => !p.city);
    } catch { ownPricing = null; }

    // Verified competitor intelligence for the customer's city.
    let competitors = [];
    try {
      const page = await base44.asServiceRole.entities.CompetitorPricing.filter({});
      const all = (page.items || page).filter((c) => c.is_sample !== true && c.is_sample !== 'true');
      if (loc) {
        const locLower = loc.toLowerCase();
        competitors = all.filter((c) => new RegExp(`\\b${esc(String(c.city || '').toLowerCase())}\\b`).test(locLower));
      }
      if (!competitors.length && loc) {
        const cityHit = [...new Set(all.map((c) => String(c.city || '').trim()).filter(Boolean))]
          .find((c) => new RegExp(`\\b${esc(c.toLowerCase())}\\b`).test(lower));
        if (cityHit) competitors = all.filter((c) => String(c.city || '').toLowerCase() === cityHit.toLowerCase());
      }
      competitors = competitors.slice(0, 5);
    } catch { competitors = []; }

    // Municipal recycling rules + donation programs for the city.
    let cityRules = null;
    try {
      const page = await base44.asServiceRole.entities.CityRules.filter({});
      const all = page.items || page;
      const rulesHit = (loc && all.find((r) => new RegExp(`\\b${esc(String(r.city || '').toLowerCase())}\\b`).test(loc.toLowerCase())))
        || [...new Set(all.map((r) => String(r.city || '').trim()).filter(Boolean))]
          .find((c) => new RegExp(`\\b${esc(c.toLowerCase())}\\b`).test(lower));
      if (rulesHit) cityRules = all.find((r) => String(r.city || '').toLowerCase() === String(rulesHit.city || rulesHit).toLowerCase()) || null;
    } catch { cityRules = null; }

    // Matching directory providers (same engine the recycling assistant uses).
    let local = [];
    try {
      const page = await base44.entities.Provider.filter({}, { sort: '-created_date', limit: 500 });
      const all = page.items || page;
      const queryMatches = all.filter((p) => providerMatchesQuery(p, last));
      const located = queryMatches.filter((p) => providerMatchesLocation(p, loc));
      local = (located.length ? located : queryMatches).slice(0, 5);
    } catch { local = []; }

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      prompt: [
        'You are Rex Discover, the research helper on samedayrecycling.ca (Same Day Recycling, Canada).',
        'A customer is RESEARCHING - not necessarily buying. Help them figure out their situation with practical, location-aware information.',
        'Customer location (may be empty): ' + (loc || 'not specified') + '.',
        'Detected material categories: ' + JSON.stringify(matchCategories(last).map((k) => CATEGORY_LABELS[k] || k)) + '.',
        'Our own PUBLISHED pricing for their city (verified, current): ' + JSON.stringify(ownPricing ? {
          city: ownPricing.city,
          minimum_pickup: ownPricing.minimum_pickup,
          rates: {
            minimum_pickup: ownPricing.minimum_pickup,
            one_eighth_truck: ownPricing.eighth_truck,
            quarter_truck: ownPricing.quarter_truck,
            half_truck: ownPricing.half_truck,
            three_quarter_truck: ownPricing.three_quarter_truck,
            full_truck: ownPricing.full_truck,
          },
        } : null) + '.',
        'Competitor intelligence on file for this city (publicly advertised prices, verified from source pages - may be empty): ' + JSON.stringify(competitors.map((c) => ({
          name: c.name, city: c.city, price_range: c.price_range, minimum: c.minimum,
          services: c.services, source_url: c.source_url, market_summary: c.market_summary,
        }))) + '.',
        'Municipal rules and donation programs on file (may be empty): ' + JSON.stringify(cityRules ? {
          city: cityRules.city, province: cityRules.province,
          rules: cityRules.rules || [], donation_programs: cityRules.donation_programs || [],
          source_note: cityRules.source_note || '',
        } : null) + '.',
        'Directory listings from our own nationwide provider directory (may be empty): ' + JSON.stringify(local.map((p) => ({
          name: p.name, type: p.provider_type, city: p.city, province: p.province,
          website: p.website, fees: p.fees, accepted: (p.accepted_categories || []).map((k) => CATEGORY_LABELS[k] || k),
        }))) + '.',
        'Voice - this is what makes Rex feel human:',
        '- Talk like a warm, knowledgeable neighbour, not a manual or a helpdesk. Plain words, short sentences, first person ("I\'d", "here\'s what I\'d do").',
        '- Open by briefly acknowledging their actual situation in a human way ("that\'s a heavy old couch to deal with", "moving is stressful enough") - one sentence, genuine, never saccharine.',
        '- Where it helps, add a small practical human touch: a tip, a heads-up about a common snag, or a reassuring "you\'ve got options here".',
        '- Never robotic, never listy-for-the-sake-of-it, and never salesy. Empathy first, facts second.',
        'Strict rules:',
        '- Answer what the customer actually asked. Stay under 200 words in the answer field, written as flowing friendly prose (not bullet dumps).',
        '- Distinguish clearly: verified facts (published prices on file, municipal rules on file, directory listings) vs estimates vs what is not available. If you are not sure, say so in the uncertainty field.',
        '- If competitor data on file covers their city and they ask about comparisons or prices, use ONLY those records, cite each source_url, and present them objectively - do not declare Same Day Recycling the best choice; state our actual published rates alongside and let the customer decide.',
        '- Never invent competitor prices, availability, ratings or minimum charges. If nothing is on file for their city, say that openly.',
        FREE_ALT_RULES.join(' '),
        '- Decide the customer outcome route: "learn" (explains/education), "compare" (options and prices), "plan" (multi-step project like a move, cleanout or downsizing), or "request" (clear, expressed intent to have items picked up). Ordinary research must NEVER be routed to "request" unless the customer clearly asked for pickup or a quote.',
        '- Do not pressure toward booking. A "request" action is offered only alongside the answer, never instead of it.',
        '- Reply in the language the customer writes in (Canadian French when they write in French), including all fields.',
        '- Bilingual and anonymous by design: no accounts, no contact capture. Never ask for their email or phone.',
      ].join('\n'),
      response_json_schema: {
        type: 'object',
        properties: {
          answer: { type: 'string' },
          outcome: { type: 'string', enum: ['learn', 'compare', 'plan', 'request'] },
          actions: {
            type: 'array',
            maxItems: 3,
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['learn', 'compare', 'plan', 'request'] },
                label: { type: 'string' },
              },
              required: ['type', 'label'],
            },
          },
          free_alternatives: {
            type: 'array',
            maxItems: 3,
            items: {
              type: 'object',
              properties: { label: { type: 'string' }, detail: { type: 'string' } },
              required: ['label', 'detail'],
            },
          },
          uncertainty: { type: 'string' },
          sources: { type: 'array', items: { type: 'string' } },
        },
        required: ['answer', 'outcome'],
      },
    });

    return Response.json({
      reply: llm.answer || '',
      outcome: llm.outcome || 'learn',
      actions: Array.isArray(llm.actions) ? llm.actions.slice(0, 3) : [],
      free_alternatives: Array.isArray(llm.free_alternatives) ? llm.free_alternatives.slice(0, 3) : [],
      uncertainty: llm.uncertainty || '',
      sources: Array.isArray(llm.sources) ? llm.sources : [],
      competitor_context: competitors.map((c) => ({
        name: c.name, city: c.city, price_range: c.price_range, minimum: c.minimum,
        source_url: c.source_url,
      })),
      own_pricing: ownPricing ? {
        city: ownPricing.city || '',
        minimum_pickup: ownPricing.minimum_pickup,
        full_truck: ownPricing.full_truck,
      } : null,
      matched_location: loc || '',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}