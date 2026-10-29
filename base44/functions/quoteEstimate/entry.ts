import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';
import { computeQuote, itemsToEighths, DEFAULT_PRICES, resolveCityPrices } from '../../shared/pricing.ts';
import { checkRateLimit, rateLimitedResponse } from '../../shared/rateLimit.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const limited = await checkRateLimit(base44, req, 'quoteEstimate', 30);
    if (!limited.allowed) return rateLimitedResponse();
    const body = await req.json();
    const items = Array.isArray(body?.items) ? body.items.slice(0, 50) : null;
    const description = typeof body?.description === 'string' ? body.description.slice(0, 1000) : '';
    const image_urls = Array.isArray(body?.image_urls)
      ? body.image_urls.filter((u) => typeof u === 'string' && /^https:\/\//i.test(u)).slice(0, 4)
      : [];

    const city = typeof body?.city === 'string' ? body.city.slice(0, 60) : '';
    const sid = typeof body?.sid === 'string' ? body.sid.trim().slice(0, 40) : '';
    const readRows = (page) => (Array.isArray(page) ? page : page?.items) || [];
    let prices = DEFAULT_PRICES;
    try {
      let rows = [];
      if (city) rows = readRows(await base44.asServiceRole.entities.PricingSettings.filter({ city }, { limit: 1 }));
      if (!rows[0]) {
        rows = readRows(await base44.asServiceRole.entities.PricingSettings.filter(
          { $or: [{ city: { $exists: false } }, { city: '' }] },
          { limit: 1 }
        ));
      }
      if (rows[0]) prices = resolveCityPrices(rows[0]);
    } catch (e) {
      // fall back to placeholder rates
    }

    const loadEighths = typeof body?.load_eighths === 'number' && body.load_eighths >= 0
      ? Math.max(0, Math.min(8, body.load_eighths))
      : null;

    let eighths = 0;
    let estimateItems = [];

    if (loadEighths !== null) {
      eighths = loadEighths;
    } else if (items && items.length > 0) {
      estimateItems = items.map((i) => ({
        name: String(i.name || '').slice(0, 60),
        quantity: Math.max(0, Math.min(50, Number(i.quantity) || 1)),
      }));
      eighths = itemsToEighths(estimateItems);
    } else if (description || image_urls.length) {
      const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
        ...(image_urls.length ? { file_urls: image_urls } : {}),
        prompt: (image_urls.length
          ? 'A customer sends photo(s) of junk they need removed' + (description ? ' and describes it: "' + description + '"' : '')
          : 'A customer describes junk they need removed: "' + description + '"') +
          '. Use the customer photo(s) to identify the items and their volume. Estimate how much space this load takes in a standard junk-removal truck, measured in EIGHTHS of a full truck (0 to 8). Rough guide: one sofa = 1.2, loveseat = 0.8, mattress or box spring = 0.8, dining table = 0.7, dresser = 0.7, fridge = 1.0, washer = 0.8, dryer, stove or dishwasher = 0.5-0.7, treadmill = 0.8, TV = 0.3, one bag or box of junk = 0.15, a small renovation debris pile (drywall, lumber, flooring) = 2-4, a full garage = 8. List the recognized items with quantities. Be conservative, do not overestimate.',
        response_json_schema: {
          type: 'object',
          properties: {
            truck_eighths: { type: 'number' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: { name: { type: 'string' }, quantity: { type: 'number' } },
                required: ['name', 'quantity'],
              },
            },
          },
          required: ['truck_eighths', 'items'],
        },
      });
      eighths = Math.max(0, Math.min(8, Number(llm?.truck_eighths) || 0));
      estimateItems = (llm?.items || []).slice(0, 30).map((i) => ({
        name: String(i.name || '').slice(0, 60),
        quantity: Number(i.quantity) || 1,
      }));
    } else {
      return Response.json({ error: 'Provide items, a description, or photos.' }, { status: 400 });
    }

    // Curbside discount: only applies when the customer explicitly opts in.
    const curbside = body?.curbside === true;
    const travelKm = Number(body?.travel_km);
    const travel_km = Number.isFinite(travelKm) ? Math.max(0, Math.min(500, travelKm)) : 0;
    const quote = computeQuote(eighths, prices, { curbside, travel_km });

    try {
      const itemsSummary = estimateItems.length ? estimateItems.map(i => i.quantity + 'x ' + i.name).join(', ') : description.slice(0, 200) || 'Load estimated by photo';
      await base44.asServiceRole.entities.ServiceQuery.create({
        query_text: 'ESTIMATE — ' + itemsSummary + ' | ' + (city || 'Unknown city') + ' | Price: $' + quote.low + '–$' + quote.high + ' (' + quote.label + ') | Eighths: ' + eighths,
        source: 'receptionist', platform: 'Site chat', city: city || '', service: 'junk_removal',
        intent: 'estimate_generated | sid=' + sid + ' | price_low=' + quote.low + ' | price_high=' + quote.high + ' | eighths=' + eighths,
        status: 'new', captured_date: new Date().toISOString().slice(0, 10),
      });
    } catch (e) { console.error('Estimate persist failed:', e.message); }

    return Response.json({ ...quote, eighths, city, items: estimateItems, curbside, travel_km, sid });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
