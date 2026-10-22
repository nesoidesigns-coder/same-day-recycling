// National service cities — derived from the coverage source of truth
// (src/lib/coverage.js) so statuses, provinces and ordering can never drift.
// Active cities are listed first; every customer-facing dropdown uses these,
// with non-active cities labelled so nobody books into an unlaunched market.
import { COVERAGE, cityByName } from "@/lib/coverage";

// Per-city metadata: map location, marketing copy, slugs for deep links.
const CITY_META = {
  Vancouver: { slug: "vancouver", lat: 49.2827, lng: -123.1207, radius: 16000 },
  "North Vancouver": { slug: "north-vancouver", lat: 49.3113, lng: -123.0696, radius: 12000 },
  Burnaby: { slug: "burnaby", lat: 49.2488, lng: -122.9805, radius: 12000 },
  Surrey: { slug: "surrey", lat: 49.1913, lng: -122.849, radius: 14000 },
  Richmond: { slug: "richmond", lat: 49.1668, lng: -123.1336, radius: 12000 },
  Coquitlam: { slug: "coquitlam", lat: 49.2838, lng: -122.7932, radius: 12000 },
  Victoria: { slug: "victoria", lat: 48.4284, lng: -123.3656, radius: 10000 },
  Calgary: { slug: "calgary", lat: 51.0447, lng: -114.0719, radius: 14000 },
  Edmonton: { slug: "edmonton", lat: 53.5461, lng: -113.4938, radius: 14000 },
  Saskatoon: { slug: "saskatoon", lat: 52.1332, lng: -106.67, radius: 10000 },
  Regina: { slug: "regina", lat: 50.4452, lng: -104.6189, radius: 10000 },
  Winnipeg: { slug: "winnipeg", lat: 49.8951, lng: -97.1384, radius: 12000 },
  Toronto: { slug: "toronto", lat: 43.6532, lng: -79.3832, radius: 16000 },
  Ottawa: { slug: "ottawa", lat: 45.4215, lng: -75.6972, radius: 12000 },
  Hamilton: { slug: "hamilton", lat: 43.2557, lng: -79.8711, radius: 10000 },
  Mississauga: { slug: "mississauga", lat: 43.589, lng: -79.6441, radius: 10000 },
  Montreal: { slug: "montreal", lat: 45.5019, lng: -73.5674, radius: 14000 },
  "Quebec City": { slug: "quebec-city", lat: 46.8139, lng: -71.208, radius: 10000 },
  Moncton: { slug: "moncton", lat: 46.0878, lng: -64.7782, radius: 8000 },
  "Saint John": { slug: "saint-john", lat: 45.2733, lng: -66.0633, radius: 8000 },
  Halifax: { slug: "halifax", lat: 44.6488, lng: -63.5752, radius: 10000 },
  "St. John's": { slug: "st-johns", lat: 47.5615, lng: -52.7126, radius: 8000 },
  Kamloops: { slug: "kamloops", lat: 50.6745, lng: -120.3273, radius: 8000 },
  Kelowna: { slug: "kelowna", lat: 49.888, lng: -119.496, radius: 8000 },
  "Maple Ridge": { slug: "maple-ridge", lat: 49.2194, lng: -122.601, radius: 8000 },
  "Pitt Meadows": { slug: "pitt-meadows", lat: 49.4595, lng: -122.7266, radius: 6000 },
  Charlottetown: { slug: "charlottetown", lat: 46.2382, lng: -63.1311, radius: 6000 },
  Whitehorse: { slug: "whitehorse", lat: 60.7218, lng: -135.055, radius: 6000 },
  Yellowknife: { slug: "yellowknife", lat: 62.454, lng: -114.3718, radius: 6000 },
  Iqaluit: { slug: "iqaluit", lat: 63.749, lng: -68.5195, radius: 6000 },
};

const ORDER = { active: 0, partner_onboarding: 1, coming_soon: 2 };

export const CITIES = COVERAGE
  .slice()
  .sort((a, b) => (ORDER[a.status] - ORDER[b.status]) || a.name.localeCompare(b.name))
  .map((c) => ({
    ...CITY_META[c.name],
    blurb: `Junk removal requests in ${c.name} for furniture, appliances, mattresses, cleanouts and renovation debris. Your pickup date, scope and price are confirmed only after a qualified contractor accepts your job.`,
    seo_title: `Junk Removal in ${c.name}, ${c.province} | Same Day Recycling`,
    seo_description: `Request junk removal in ${c.name}, ${c.province}. Requests are open; same-day pickup depends on a qualified contractor accepting your specific job and arrival window.`,
    name: c.name,
    province: c.province,
    status: c.status,
  }));

export const cityFromSlug = (slug) => CITIES.find((c) => c.slug === slug) || null;
export const cityMeta = (name) => cityByName(name);

// Label used in customer-facing dropdowns. Every listed city accepts service
// requests (nationwide intake), so labels stay plain; direct-booking
// availability is gated live by useCoverageStatus() and enforced server-side.
export const cityLabel = (c) => c.name;