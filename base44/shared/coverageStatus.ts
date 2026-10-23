// National dispatch model — server side:
//   1. Customer request availability: OPEN NATIONWIDE. Every Canadian
//      municipality can submit a request, always. No city is ever "closed".
//   2. Dispatch fulfillment: per job, not per city. Cities in this list have
//      confirmed same-day dispatch capacity (operator-run or a verified
//      contractor). Requests outside this list are still accepted — the
//      dispatch team sources contractors dynamically in response to demand.
// Mirrors src/lib/coverage.js on the frontend.
export const ACTIVE_CITIES = [
  'Vancouver', 'North Vancouver', 'Burnaby', 'Surrey', 'Richmond', 'Coquitlam', 'Victoria', 'Kamloops', 'Kelowna',
  'Maple Ridge', 'Pitt Meadows', 'Calgary', 'Edmonton', 'Saskatoon', 'Regina', 'Winnipeg',
  'Toronto', 'Ottawa', 'Hamilton', 'Mississauga', 'Montreal', 'Quebec City', 'Moncton',
  'Saint John', 'Halifax', 'Charlottetown', "St. John's", 'Whitehorse', 'Yellowknife', 'Iqaluit',
];

// Normalizes raw user input ("Vancouver, BC", "vancouver", "North Vancouver")
// and checks it against the active list. Matched by inclusion so spoken or
// extracted city values still resolve.
export const ONBOARDING_CITIES = [];

// Test partners (sandbox/dispatch-simulation records) never count as real
// contractor capacity and never receive real job offers.
export const TEST_PARTNER_NAMES = ['test simulation contractor'];

export function isTestPartner(p) {
  const name = String(p?.name || '').trim().toLowerCase();
  const email = String(p?.email || '').trim().toLowerCase();
  return TEST_PARTNER_NAMES.includes(name)
    || name.startsWith('zztest')
    || email.startsWith('zztest')
    || email.endsWith('@example.com');
}

// Exact-match against the registry (after normalizing province suffixes and
// whitespace). Loose substring matching is forbidden: "West Vancouver" must
// NOT resolve to "Vancouver" — only registry cities can be booked directly.
export function isActiveCity(raw) {
  const value = String(raw || '').toLowerCase().trim();
  if (!value) return false;
  const normalized = value
    .replace(/,\s*[a-z.]+.*$/, '')
    .replace(/,?\s*(british columbia|alberta|saskatchewan|manitoba|ontario|quebec|new brunswick|nova scotia|prince edward island|newfoundland( and labrador)?|yukon|northwest territories|nunavut|bc|b\.c\.|ab|sk|mb|on|qc|nb|ns|pe|nl|yt|nt|nu)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return ACTIVE_CITIES.some((c) => c.toLowerCase() === normalized);
}