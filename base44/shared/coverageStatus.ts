// Server-side source of truth for which cities have confirmed, bookable
// service. Mirrors src/lib/coverage.js on the frontend — update both when a
// territory goes live. Confirmed bookings may only ever be created for these.
export const ACTIVE_CITIES = ['Vancouver', 'Burnaby', 'Surrey', 'Richmond', 'Coquitlam'];

// Normalizes raw user input ("Vancouver, BC", "vancouver", "North Vancouver")
// and checks it against the active list. Matched by inclusion so spoken or
// extracted city values still resolve, but "North Vancouver" never matches
// plain "Vancouver" wrongly — exact short names first, then inclusion.
export function isActiveCity(raw) {
  const value = String(raw || '').toLowerCase().trim();
  if (!value) return false;
  const normalized = value.replace(/,\s*(bc|b\.c\.).*$/, '').trim();
  const lower = ACTIVE_CITIES.map((c) => c.toLowerCase());
  if (lower.includes(normalized)) return true;
  return lower.some((c) => normalized === c || normalized.startsWith(c + ' ') || normalized.includes(c));
}