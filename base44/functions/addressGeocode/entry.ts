import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { checkRateLimit, rateLimitedResponse } from '../../shared/rateLimit.ts';

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

    // Precision: when the customer typed a street number, keep it authoritative.
    // Exact-number matches win; if none exists, street-level candidates for the
    // same street are returned flagged, and off-street noise is dropped.
    const numMatch = query.match(/^\s*(\d{1,6})\b/);
    const typed = numMatch ? numMatch[1] : '';
    const seen = new Set();
    let candidates = raw
      .filter((c) => c.lat !== null && c.lng !== null && c.city && c.province)
      .filter((c) => {
        const key = `${c.label.toLowerCase()}|${c.lat.toFixed(4)},${c.lng.toFixed(4)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    // City precision: a generic street name matches many municipalities, so
    // rank candidates whose municipality the query actually names first.
    const qlc = query.toLowerCase();
    candidates.sort((a, b) => Number(qlc.includes(b.city.toLowerCase())) - Number(qlc.includes(a.city.toLowerCase())));
    if (typed) {
      const GENERIC = new Set(['street', 'st', 'avenue', 'ave', 'road', 'rd', 'drive', 'dr', 'boulevard', 'blvd', 'crescent', 'way', 'court', 'place', 'pl', 'lane', 'ln', 'north', 'south', 'east', 'west', 'nord', 'sud', 'est', 'ouest']);
      const coreWords = query.toLowerCase().replace(/^\s*\d+\b/, '').split(/[\s,]+/).filter((w) => w.length > 2 && !GENERIC.has(w));
      const streetIn = (c) => coreWords.some((w) => c.label.toLowerCase().includes(w));
      let exact = candidates.filter((c) => c.label.startsWith(`${typed} `) && streetIn(c));
      if (!exact.length) {
        // The number appears only on streets the query does not name (or the
        // named street is missing from open data) — try the failover geocoder
        // before trusting a wrong-street or wrong-city match.
        if (via === 'photon') {
          const extra = await nominatimGeocode(query).catch(() => []);
          candidates = [...candidates, ...extra]
            .filter((c) => c.lat !== null && c.lng !== null && c.city && c.province)
            .filter((c) => {
              const key = `${c.label.toLowerCase()}|${c.lat.toFixed(4)},${c.lng.toFixed(4)}`;
              return !seen.has(key) && (seen.add(key), true);
            });
          exact = candidates.filter((c) => c.label.startsWith(`${typed} `) && streetIn(c));
        }
      }
      if (exact.length) {
        const inNamedCity = exact.filter((c) => qlc.includes(c.city.toLowerCase()));
        if (inNamedCity.length && inNamedCity.length < exact.length) candidates = inNamedCity;
        else candidates = exact;
      } else {
        exact = candidates.filter((c) => c.label.startsWith(`${typed} `));
      }
      const namedExact = exact.filter((c) => qlc.includes(c.city.toLowerCase()));
      if (namedExact.length) {
        candidates = namedExact;
      } else {
        // No OSM house number for the query's street: keep street-level
        // matches on the queried street, flagged for confirmation on the map.
        const pool = candidates.filter((c) => qlc.includes(c.city.toLowerCase()));
        const sameStreet = (pool.length ? pool : candidates).filter((c) => coreWords.some((w) => c.label.toLowerCase().includes(w)));
        if (sameStreet.length) {
          // The label must never show a number the customer did not type.
          candidates = sameStreet.map((c) => ({ ...c, label: c.label.replace(/^\d+\s+/, ''), street_level: true }));
        } else if (exact.length) {
          candidates = exact; // nothing on the queried street — manual confirmation
        } else candidates = [];
      }
    }

    return Response.json({ candidates: candidates.slice(0, 5), via });
  } catch (error) {
    return Response.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}