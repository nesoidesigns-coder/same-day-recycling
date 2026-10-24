import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { isTestPartner, ACTIVE_CITIES } from '../../shared/coverageStatus.ts';
import { capacityByCity } from '../../shared/territory.ts';

// Public, aggregate-only coverage status endpoint. PII-free: returns city
// names and counts only. This is the single authoritative source for:
//   - Contractor Capacity: cities inside a verified contractor's EXPLICIT
//     service territory (home city + confirmed additional municipalities).
//     One operator covering several cities is one record — cities are never
//     counted by duplicating contractors per municipality, and coverage is
//     never inferred from geographic proximity.
//   - Capacity detail per city: contractor count, truck capacity, and
//     same-day fulfillment capability are measured separately.
//   - Open matching activity: cities with open customer requests awaiting
//     contractor contact (NationalRequest status new/provider_matching).
//     A city already covered by an existing contractor's territory is never
//     classified as needing recruitment.
// Facility directory records are NEVER counted as contractor capacity.

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const srole = base44.asServiceRole;

    // 1. Verified contractor capacity from explicit territories. Simulation
    //    and internal test partners are excluded from capacity.
    const partners = [];
    let cursor;
    do {
      const page = await srole.entities.Partner.filter({ active: true, verified: true }, { limit: 200, ...(cursor ? { cursor } : {}) });
      partners.push(...(page.items || []));
      cursor = page.has_more ? page.next_cursor : null;
    } while (cursor);
    const realPartners = partners.filter((p) => !isTestPartner(p));
    const capacity = capacityByCity(realPartners);
    const verifiedCities = Object.keys(capacity).sort((a, b) => a.localeCompare(b));
    const contractorCounts = Object.fromEntries(verifiedCities.map((c) => [c, capacity[c].contractors.length]));

    // 2. Public matching layer: every registry service-territory city WITHOUT
    //    verified territory coverage is "Requests Open — Contractor Matching"
    //    (the registry, not open requests, is authoritative — so the homepage
    //    can never report zero matching while the registry says otherwise).
    //    Cities covered by an existing contractor's territory are never listed
    //    as needing recruitment, even when that contractor is based elsewhere.
    const matchingByKey = new Map();
    for (const name of ACTIVE_CITIES) {
      const key = name.toLowerCase();
      if (!verifiedCities.some((c) => c.toLowerCase() === key)) matchingByKey.set(key, name);
    }
    const { rows: open } = await srole.entities.NationalRequest.aggregate({
      query: { status: { $in: ['new', 'provider_matching'] }, record_type: { $ne: 'internal_test' } },
      groupBy: 'city',
    });
    for (const r of open || []) {
      const city = String(r.city || '').trim().replace(/\s+/g, ' ');
      const key = city.toLowerCase();
      if (city && !verifiedCities.some((c) => c.toLowerCase() === key) && !matchingByKey.has(key)) matchingByKey.set(key, city);
    }
    const matchingCities = [...matchingByKey.values()].sort((a, b) => a.localeCompare(b));

    return Response.json({
      verified_cities: verifiedCities,
      contractor_counts: contractorCounts,
      // Per-city capacity detail: coverage, truck capacity, same-day
      // capability and current availability are measured separately.
      city_capacity: Object.fromEntries(verifiedCities.map((c) => [c, capacity[c]])),
      totals: {
        contractors: realPartners.length,
        trucks: realPartners.reduce((s, p) => s + Math.max(1, Number(p.truck_capacity) || 1), 0),
        same_day_capable: realPartners.filter((p) => p.same_day_capable).length,
        currently_available: realPartners.filter((p) => (p.availability || 'available') === 'available').length,
      },
      matching_cities: matchingCities,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}