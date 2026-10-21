// National dispatch model — server side:
//   1. Customer request availability: OPEN NATIONWIDE. Every Canadian
//      municipality can submit a request, always. No city is ever "closed".
//   2. Dispatch fulfillment: per job, not per city. Cities in this list have
//      confirmed same-day dispatch capacity (operator-run or a verified
//      contractor). Requests outside this list are still accepted — the
//      dispatch team sources contractors dynamically in response to demand.
// Mirrors src/lib/coverage.js on the frontend.
export const ACTIVE_CITIES = [
  'Vancouver', 'Burnaby', 'Surrey', 'Richmond', 'Coquitlam', 'Victoria', 'Kamloops', 'Kelowna',
  'Maple Ridge', 'Pitt Meadows', 'Calgary', 'Edmonton', 'Saskatoon', 'Regina', 'Winnipeg',
  'Toronto', 'Ottawa', 'Hamilton', 'Mississauga', 'Montreal', 'Quebec City', 'Moncton',
  'Saint John', 'Halifax', 'Charlottetown', "St. John's", 'Whitehorse', 'Yellowknife', 'Iqaluit',
];

// Normalizes raw user input ("Vancouver, BC", "vancouver", "North Vancouver")
// and checks it against the active list. Matched by inclusion so spoken or
// extracted city values still resolve.
export const ONBOARDING_CITIES = [];

export function isActiveCity(raw) {
  const value = String(raw || '').toLowerCase().trim();
  if (!value) return false;
  const normalized = value.replace(/,\s*(bc|b\.c\.).*$/, '').trim();
  const lower = ACTIVE_CITIES.map((c) => c.toLowerCase());
  if (lower.includes(normalized)) return true;
  return lower.some((c) => normalized === c || normalized.startsWith(c + ' ') || normalized.includes(c));
}