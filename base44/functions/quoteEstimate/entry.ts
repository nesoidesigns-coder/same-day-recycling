import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';
import { computeQuote, itemsToEighths, DEFAULT_PRICES } from '../../shared/pricing.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const items = Array.isArray(body?.items) ? body.items.slice(0, 50) : null;
    const description = typeof body?.description === 'string' ? body.description.slice(0, 1000) : '';

    const city = typeof body?.city === 'string' ? body.city.slice(0, 60) : '';
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
      if (rows[0]) prices = { ...DEFAULT_PRICES, ...rows[0] };
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
    } else if (description) {
      const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: 'A customer describes junk they need removed: "' + description + '". Estimate how much space this load takes in a standard junk-removal truck, measured in EIGHTHS of a full truck (0 to 8). Rough guide: one sofa = 1.2, loveseat = 0.8, mattress or box spring = 0.8, dining table = 0.7, dresser = 0.7, fridge = 1.0, washer = 0.8, dryer, stove or dishwasher = 0.5-0.7, treadmill = 0.8, TV = 0.3, one bag or box of junk = 0.15, a small renovation debris pile (drywall, lumber, flooring) = 2-4, a full garage = 8. List the recognized items with quantities. Be conservative, do not overestimate.',
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
      return Response.json({ error: 'Provide items or a description.' }, { status: 400 });
    }

    const quote = computeQuote(eighths, prices);
    return Response.json({ ...quote, eighths, city, items: estimateItems });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}