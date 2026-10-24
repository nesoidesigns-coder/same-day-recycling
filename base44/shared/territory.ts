// Contractor territory intelligence — the single shared definition of which
// cities a contractor covers, used by coverage status, dispatch matching,
// growth intelligence and city pages so every layer reports the same facts.
//
// Coverage is EXPLICIT: the contractor's home city plus the additional
// municipalities they actually confirmed they serve. It is never inferred
// from geographic proximity — a neighbouring municipality is NOT covered
// until the contractor confirms it.
//
// One operator covering many municipalities stays ONE partner record; their
// territory list maps them onto every city they serve.

export const normCity = (v) => String(v || '')
  .toLowerCase()
  .trim()
  .replace(/,\s*[a-z.]+.*$/, '')
  .replace(/,?\s*(british columbia|alberta|saskatchewan|manitoba|ontario|quebec|new brunswick|nova scotia|prince edward island|newfoundland( and labrador)?|yukon|northwest territories|nunavut|bc|b\.c\.|ab|sk|mb|on|qc|nb|ns|pe|nl|yt|nt|nu)$/i, '')
  .replace(/\s+/g, ' ')
  .trim();

// The full city list of one contractor: home city first, then each
// additional confirmed municipality, deduplicated by normalized name.
export function partnerCities(p) {
  const out = [];
  const seen = new Set();
  const add = (c) => {
    const display = String(c || '').trim().replace(/\s+/g, ' ');
    const key = normCity(display);
    if (key && !seen.has(key)) { seen.add(key); out.push(display); }
  };
  add(p?.city);
  for (const c of p?.service_cities || []) add(c);
  return out;
}

// Exact service-area match only. Never proximity, never substring.
export function partnerCoversCity(p, city) {
  const target = normCity(city);
  if (!target) return false;
  return partnerCities(p).some((c) => normCity(c) === target);
}

// Availability is measured separately from coverage: a contractor can cover
// a city while paused, limited or unavailable.
export const isAvailable = (p) => p?.active !== false && (p?.availability || 'available') !== 'unavailable';

// Per-city capacity from verified explicit territories:
//   contractors = distinct partner records serving the city (one operator
//                 covering 5 cities counts once per city, never duplicated)
//   trucks      = summed truck capacity (measured separately)
//   same_day    = contractors who explicitly confirmed same-day capability
//   available   = contractors currently available for dispatch
export function capacityByCity(partners) {
  const map = {};
  for (const p of partners) {
    for (const c of partnerCities(p)) {
      const row = map[c] || (map[c] = { contractors: [], trucks: 0, same_day: 0, available: 0 });
      row.contractors.push(p.name);
      row.trucks += Math.max(1, Number(p.truck_capacity) || 1);
      if (p.same_day_capable) row.same_day += 1;
      if (isAvailable(p)) row.available += 1;
    }
  }
  return map;
}

// Duplicate detection: the same operator is identified by email, phone or
// business number — never by company name (names vary across municipalities
// and registrations). Used wherever partner records are created so one
// operator covering multiple cities keeps a single record.
const identityOf = (p) => ({
  email: String(p?.email || '').trim().toLowerCase(),
  phone: String(p?.phone || '').replace(/\D/g, ''),
  biz: String(p?.business_number || '').trim().toLowerCase(),
});

export function partnerMatchesIdentity(a, b) {
  const x = identityOf(a), y = identityOf(b);
  return (x.email && x.email === y.email)
    || (x.phone.length >= 7 && x.phone === y.phone)
    || (x.biz && x.biz === y.biz);
}

export function findExistingPartner(partners, candidate, excludeId = null) {
  return partners.find((p) => p.id !== excludeId && partnerMatchesIdentity(p, candidate)) || null;
}