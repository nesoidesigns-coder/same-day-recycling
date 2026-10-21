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
    const { items: partners } = await srole.entities.Partner.filter({ active: true }, { limit: 200 });
    const realPartners = (partners || [])
      .filter((p) => !isTestPartner(p));
    const verifiedCities = [...new Set(realPartners
      .map((p) => String(p.city || '').trim())
      .filter(Boolean))];
    // Per-city contractor counts for the coverage map (aggregate only, no names or contact data).
    const contractorCounts = {};
    for (const p of realPartners) {
      const city = String(p.city || '').trim();
      if (city) contractorCounts[city] = (contractorCounts[city] || 0) + 1;
    }

    // 2. Open requests awaiting contractor matching, grouped by city.
    //    Cities that already have verified capacity are not re-listed.
    const { items: open } = await srole.entities.NationalRequest.filter(
      { status: { $in: ['new', 'provider_matching'] } },
      { limit: 500, fields: ['city'] }
    );
    const matchingCities = [];
    for (const r of open || []) {
      const city = String(r.city || '').trim();
      if (city && !verifiedCities.some((v) => v.toLowerCase() === city.toLowerCase()) && !matchingCities.includes(city)) {
        matchingCities.push(city);
      }
    }

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