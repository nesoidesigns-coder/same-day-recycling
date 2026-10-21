import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { checkRateLimit, rateLimitedResponse } from '../../shared/rateLimit.ts';

// Returns local recycling & donation rules for a city, pulled from the web
// (municipal programs, landfill bans, donation pickup partners) and cached in
// the CityRules entity so repeat visits never re-bill the LLM. Cache is
// refreshed when older than 90 days.
const CACHE_DAYS = 90;
const FRESH_MS = CACHE_DAYS * 24 * 60 * 60 * 1000;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const limited = await checkRateLimit(base44, req, 'cityRules', 10);
    if (!limited.allowed) return rateLimitedResponse();

    const body = await req.json().catch(() => ({}));
    const city = String(body?.city || '').trim().slice(0, 60);
    const province = String(body?.province || '').trim().slice(0, 10);
    if (!city) return Response.json({ error: 'City is required.' }, { status: 400 });

    // 1. Cache hit?
    const cached = await base44.asServiceRole.entities.CityRules.filter({ city }, { limit: 1 });
    const hit = (cached.items || [])[0];
    if (hit && hit.generated_date && Date.now() - new Date(hit.generated_date).getTime() < FRESH_MS) {
      return Response.json({
        city, province: hit.province || province,
        rules: hit.rules || [], donation_programs: hit.donation_programs || [],
        source_note: hit.source_note || '', cached: true,
      });
    }

    // 2. Research fresh rules from the web.
    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      add_context_from_internet: true,
      prompt: `Research the local recycling and donation rules for ${city}, ${province}, Canada as of today. Using real municipal and regional sources (city website, regional district, provincial programs), produce:
- rules: 5-6 concise, practical rules a resident must know when disposing of junk, furniture, appliances or electronics — what curbside pickup accepts or refuses, landfill bans (e.g. mattresses, drywall, e-waste), deposit-return or hazardous-drop specifics for THIS city, and who to call. One to two sentences each.
- donation_programs: 2-4 real charity/thrift donation pickup or drop-off programs serving ${city} (e.g. Big Brothers Big Sisters, Diabetes Canada, Habitat for Humanity ReStore, Salvation Army) with one line on what each accepts.
- source_note: one line naming the key sources (e.g. "City of ${city}, Regional District, Diabetes Canada").
If web lookup fails for any item, keep it generic and clearly practical for Canada rather than inventing a fake program or phone number.`,
      response_json_schema: {
        type: 'object',
        properties: {
          rules: {
            type: 'array',
            items: {
              type: 'object',
              properties: { title: { type: 'string' }, detail: { type: 'string' } },
              required: ['title', 'detail'],
            },
          },
          donation_programs: {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string' }, accepts: { type: 'string' } },
              required: ['name', 'accepts'],
            },
          },
          source_note: { type: 'string' },
        },
        required: ['rules', 'donation_programs', 'source_note'],
      },
    });

    const payload = {
      city,
      province: province || hit?.province || '',
      rules: Array.isArray(ai?.rules) ? ai.rules.slice(0, 8) : [],
      donation_programs: Array.isArray(ai?.donation_programs) ? ai.donation_programs.slice(0, 5) : [],
      source_note: String(ai?.source_note || '').slice(0, 500),
      generated_date: new Date().toISOString().slice(0, 10),
    };
    if (!payload.rules.length) return Response.json({ ...payload, cached: false }, { status: 200 });

    if (hit) await base44.asServiceRole.entities.CityRules.update(hit.id, payload);
    else await base44.asServiceRole.entities.CityRules.create(payload);

    return Response.json({ ...payload, cached: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}