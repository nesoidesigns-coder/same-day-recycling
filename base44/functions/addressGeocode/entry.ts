import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { checkRateLimit, rateLimitedResponse } from '../../shared/rateLimit.ts';
import { matchCanadianAddresses } from '../../shared/addressMatching.ts';

// Canadian address intelligence for the pickup booking flow: typeahead
// suggestions and verified coordinates. Geocoding runs server-side through
// the open OSM geocoders (Photon, with Nominatim as failover) — coordinates
// are always real and never invented. When the open data lacks the exact
// house number, candidates are flagged street_level so the customer confirms
// the precise spot on the map instead of being shown a wrong-number guess.
// Addresses are never logged or stored here; they live only on the
// customer's own booking record.
const PROVINCE_CODES = {
  'british columbia': 'BC', 'colombie-britannique': 'BC',
  alberta: 'AB', ontario: 'ON', quebec: 'QC', 'québec': 'QC',
  manitoba: 'MB', saskatchewan: 'SK',
  'nova scotia': 'NS', 'nouvelle-écosse': 'NS',
  'new brunswick': 'NB', 'nouveau-brunswick': 'NB',
  'prince edward island': 'PE', 'île-du-prince-édouard': 'PE',
  'newfoundland and labrador': 'NL', 'terre-neuve-et-labrador': 'NL',
  yukon: 'YT', 'northwest territories': 'NT', 'territoires du nord-ouest': 'NT',
  nunavut: 'NU',
};

const UA = { 'User-Agent': 'RecyclingOS/1.0 (https://samedayrecycling.ca)' };

function toCandidate(p, lat, lng) {
  const city = p.city || p.district || p.locality || p.county || '';
  const province = PROVINCE_CODES[String(p.state || '').toLowerCase()] || '';
  return {
    label: [p.housenumber, p.street].filter(Boolean).join(' '),
    house_number: p.housenumber || '',
    street: p.street || '',
    city,
    province,
    province_name: p.state || '',
    postal_code: p.postcode || '',
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    street_level: !p.housenumber,
  };
}

async function photonGeocode(query, lang) {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=8&lang=${lang}&bbox=-141,41,-52,84`;
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error('geocoder_unavailable');
  const data = await res.json();
  return (data?.features || [])
    .filter((f) => String(f.properties?.countrycode || '').toUpperCase() === 'CA')
    .filter((f) => f.properties?.street && (f.geometry?.coordinates || []).length === 2)
    .map((f) => {
      const p = f.properties;
      const coords = f.geometry.coordinates;
      return toCandidate(p, Number(coords[1]), Number(coords[0]));
    });
}

// Failover geocoder. Nominatim interpolates street segments, so results are
// street-level points (real coordinates, approximate to the number).
async function nominatimGeocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=ca&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(9000) });
  if (!res.ok) throw new Error('geocoder_unavailable');
  const data = await res.json();
  return (Array.isArray(data) ? data : [])
    .filter((r) => (r.address?.road || r.address?.house_number) && r.lat && r.lon)
    .map((r) => toCandidate(
      {
        housenumber: /^\d+$/.test(String(r.address?.house_number || '')) ? r.address.house_number : '',
        street: r.address?.road || '',
        city: r.address?.city || r.address?.town || r.address?.village || '',
        state: r.address?.state || '',
        postcode: r.address?.postcode || '',
      },
      Number(r.lat),
      Number(r.lon)
    ));
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const limited = await checkRateLimit(base44, req, 'addressGeocode', 40);
    if (!limited.allowed) return rateLimitedResponse();

    const body = await req.json();
    const query = String(body?.query || '').trim().slice(0, 120);
    if (query.length < 4) return Response.json({ candidates: [] });
    const lang = body?.lang === 'fr' ? 'fr' : 'en';

    let raw = [];
    let via = 'photon';
    try {
      raw = await photonGeocode(query, lang);
    } catch {
      via = 'nominatim';
      raw = await nominatimGeocode(query).catch(() => []);
    }
    // Photon can return results but miss the exact house; fall through to
    // Nominatim before giving up on street-level results.
    if (!raw.length && via === 'photon') {
      via = 'nominatim';
      raw = await nominatimGeocode(query).catch(() => []);
    }

    let candidates = matchCanadianAddresses(raw, query);
    if (via === 'photon' && !candidates.some((c) => c.confidence === 'address')) {
      // This endpoint is user-initiated search, never Nominatim autocomplete.
      const extra = await nominatimGeocode(query).catch(() => []);
      candidates = matchCanadianAddresses([...raw, ...extra], query);
      if (extra.length) via = 'photon+nominatim';
    }
    return Response.json({ candidates, via });
  } catch (error) {
    return Response.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}