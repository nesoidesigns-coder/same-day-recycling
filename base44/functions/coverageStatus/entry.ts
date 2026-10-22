import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { isTestPartner } from '../../shared/coverageStatus.ts';

// Public, aggregate-only coverage status endpoint. PII-free: returns city
// names and counts only. This is the single authoritative source for:
//   - Contractor Capacity: cities with an active verified partner record
//   - Open matching activity: cities with open customer requests awaiting
//     contractor contact (NationalRequest status new/provider_matching)
// Facility directory records are NEVER counted as contractor capacity.


export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const srole = base44.asServiceRole;

    // 1. Verified contractor capacity: active partner records. Simulation
    //    and internal test partners are excluded from capacity.
    const partners = [];
    let cursor;
    do {
      const page = await srole.entities.Partner.filter({ active: true, verified: true }, { limit: 200, ...(cursor ? { cursor } : {}) });
      partners.push(...(page.items || []));
      cursor = page.has_more ? page.next_cursor : null;
    } while (cursor);
    const realPartners = partners.filter((p) => !isTestPartner(p));
    const cityNames = new Map();
    const contractorCounts = {};
    for (const p of realPartners) {
      const city = String(p.city || '').trim().replace(/\s+/g, ' ');
      if (!city) continue;
      const key = city.toLowerCase();
      if (!cityNames.has(key)) cityNames.set(key, city);
      const name = cityNames.get(key);
      contractorCounts[name] = (contractorCounts[name] || 0) + 1;
    }
    const verifiedCities = [...cityNames.values()].sort((a, b) => a.localeCompare(b));

    // 2. Open requests awaiting contractor matching, grouped by city.
    //    Cities that already have verified capacity are not re-listed.
    const { rows: open } = await srole.entities.NationalRequest.aggregate({
      query: { status: { $in: ['new', 'provider_matching'] } },
      groupBy: 'city',
    });
    const matchingByKey = new Map();
    for (const r of open || []) {
      const city = String(r.city || '').trim().replace(/\s+/g, ' ');
      const key = city.toLowerCase();
      if (city && !cityNames.has(key)) matchingByKey.set(key, city);
    }
    const matchingCities = [...matchingByKey.values()].sort((a, b) => a.localeCompare(b));

    return Response.json({
      verified_cities: verifiedCities,
      contractor_counts: contractorCounts,
      matching_cities: matchingCities,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}