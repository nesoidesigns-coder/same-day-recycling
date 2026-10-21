// Shared national recycling taxonomy + provider matching for directory-aware assistants.
// Material acceptance is always determined by the individual facility or program —
// categories only route search.
export const CATEGORIES = [
  { key: "household", label: "Household Recycling", keywords: ["household", "bottle", "can", "glass", "plastic", "container", "blue box", "blue bin", "curbside"] },
  { key: "electronics", label: "Electronics & Batteries", keywords: ["electronics", "e-waste", "ewaste", "battery", "batteries", "tv", "computer", "laptop", "phone", "printer", "cable", "monitor"] },
  { key: "furniture", label: "Furniture & Mattresses", keywords: ["furniture", "mattress", "boxspring", "box spring", "couch", "sofa", "bed frame", "desk"] },
  { key: "metal", label: "Scrap Metal & Appliances", keywords: ["scrap metal", "metal", "appliance", "fridge", "stove", "washer", "dryer", "copper", "brass", "aluminum", "steel"] },
  { key: "paper", label: "Cardboard, Paper & Packaging", keywords: ["cardboard", "paper", "boxboard", "carton", "newspaper", "magazine", "shredded", "envelope"] },
  { key: "construction", label: "Construction & Demolition", keywords: ["construction", "demolition", "drywall", "concrete", "lumber", "wood", "renovation", "shingle", "asphalt"] },
  { key: "organics", label: "Organic Waste & Composting", keywords: ["organic", "compost", "food waste", "yard waste", "green waste", "leaf", "garden", "grass"] },
  { key: "hazardous", label: "Hazardous Household Waste", keywords: ["hazardous", "paint", "chemical", "solvent", "propane", "motor oil", "oil", "pesticide", "fluorescent", "antifreeze"] },
  { key: "textiles", label: "Textiles & Reusable Goods", keywords: ["textile", "clothing", "clothes", "shoe", "fabric", "donation", "reuse", "thrift", "reuseable", "reusable"] },
  { key: "commercial", label: "Commercial & Recurring Collection", keywords: ["commercial", "business", "recurring", "industrial", "office", "strata", "property"] },
  { key: "junk", label: "Junk Removal & Bulky-Item Pickup", keywords: ["junk removal", "bulky", "pickup", "haul", "same day", "full service"] },
];

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.key, c.label]),
);

const norm = (s: unknown) => String(s || "").toLowerCase().trim();

// Returns the category keys a free-text query matches.
export function matchCategories(query: string): string[] {
  const q = norm(query);
  if (!q) return [];
  return CATEGORIES.filter(
    (c) => c.keywords.some((k) => q.includes(k)) || q.includes(norm(c.label)),
  ).map((c) => c.key);
}

export function providerMatchesQuery(provider: any, query: string): boolean {
  const q = norm(query);
  if (!q) return true;
  const catKeys = matchCategories(q);
  if (catKeys.length && (provider.accepted_categories || []).some((c: string) => catKeys.includes(c))) return true;
  return (
    norm(provider.name).includes(q) ||
    norm(provider.materials_note).includes(q) ||
    norm(provider.notes).includes(q) ||
    (provider.accepted_categories || []).some((c: string) => norm(CATEGORY_LABELS[c]).includes(q))
  );
}

export function providerMatchesLocation(provider: any, location: string): boolean {
  const loc = norm(location);
  if (!loc) return true;
  const fields = [provider.city, provider.province, provider.service_area, provider.address].map(norm);
  if (fields.some((f) => f.includes(loc))) return true;
  // Postal code: match on FSA (first 3 characters)
  const fsa = loc.replace(/\s+/g, "").slice(0, 3).toUpperCase();
  if (/^[A-Z]\d[A-Z]$/.test(fsa) && norm(provider.postal_code).replace(/\s+/g, "").slice(0, 3) === fsa) return true;
  return false;
}

const PROVINCES: Record<string, string> = {
  "british columbia": "British Columbia", bc: "British Columbia",
  alberta: "Alberta", ab: "Alberta",
  saskatchewan: "Saskatchewan", sk: "Saskatchewan",
  manitoba: "Manitoba", mb: "Manitoba",
  ontario: "Ontario", on: "Ontario",
  quebec: "Quebec", qc: "Quebec",
  "new brunswick": "New Brunswick", nb: "New Brunswick",
  "nova scotia": "Nova Scotia", ns: "Nova Scotia",
  "prince edward island": "Prince Edward Island", pei: "Prince Edward Island", pe: "Prince Edward Island",
  "newfoundland": "Newfoundland and Labrador", nl: "Newfoundland and Labrador",
  yukon: "Yukon", yt: "Yukon",
  "northwest territories": "Northwest Territories", nt: "Northwest Territories",
  nunavut: "Nunavut", nu: "Nunavut",
};

// Extracts a location hint from free text: a postal code, or a province name/abbreviation.
export function extractLocationHint(text: string): string {
  const t = norm(text);
  if (!t) return "";
  const postal = t.replace(/\s+/g, "").match(/([abceghj-nprstvxy]\d[abceghj-nprstv-z])\b/i);
  if (postal) return postal[1].toUpperCase();
  const province = Object.keys(PROVINCES)
    .sort((a, b) => b.length - a.length)
    .find((p) => new RegExp(`\\b${p}\\b`).test(t));
  return province ? PROVINCES[province] : "";
}