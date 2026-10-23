import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { DEFAULT_PRICES, resolveCityPrices } from '../../shared/pricing.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const city = typeof body?.city === 'string' ? body.city.slice(0, 60) : '';
    const readRows = (page) => (Array.isArray(page) ? page : page?.items) || [];

    let prices = { ...DEFAULT_PRICES };
    try {
      let rows = [];
      if (city) {
        rows = readRows(await base44.asServiceRole.entities.PricingSettings.filter({ city }, { limit: 1 }));
      }
      if (!rows[0]) {
        rows = readRows(await base44.asServiceRole.entities.PricingSettings.filter(
          { $or: [{ city: { $exists: false } }, { city: '' }] },
          { limit: 1 }
        ));
      }
      if (rows[0]) prices = resolveCityPrices(rows[0]);
    } catch (e) {
      // fall back to default rates
    }

    return Response.json({ prices });
  } catch (error) {
    return Response.json({ prices: null, error: error.message }, { status: 500 });
  }
}