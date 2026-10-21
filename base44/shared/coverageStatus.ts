// Server-side source of truth for which cities have confirmed, bookable
// service. Mirrors src/lib/coverage.js on the frontend — update both when a
// territory changes. Confirmed bookings may only ever be created for these.
//
// Same-day pickup is available across ALL cities and territories in the
// network — every listed market is active with confirmed capacity. Customer
// inquiries are likewise open to every Canadian municipality, always.
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