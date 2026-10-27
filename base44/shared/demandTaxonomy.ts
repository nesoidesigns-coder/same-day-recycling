// Canadian demand taxonomy: eight core markets, six demand types, and
// deterministic (explainable, no-cost) text classification rules in English
// and French. Applied to every ingested demand signal. Evidence is never
// rewritten - classification only derives structured fields from the source.

export const MARKET_CATEGORIES = [
  'furniture_appliance_removal',
  'moving_downsizing',
  'renovation_construction_debris',
  'property_management_turnover',
  'recycling_specialty_disposal',
  'commercial_office_cleanouts',
  'urgent_same_day',
  'donation_reuse_circular',
] as const;

export const DEMAND_TYPES = [
  'observed_public_request',
  'search_interest',
  'market_indicator',
  'platform_inquiry',
  'qualified_opportunity',
  'confirmed_booking',
] as const;

// Mapping from the existing fine-grained service taxonomy (17 categories used
// by PublicOpportunity / DemandObservation) to the eight core markets.
const SERVICE_TO_MARKETS: Record<string, string[]> = {
  junk_removal: ['furniture_appliance_removal'],
  furniture_removal: ['furniture_appliance_removal'],
  appliance_removal: ['furniture_appliance_removal'],
  mattress_disposal: ['furniture_appliance_removal'],
  hot_tub_removal: ['furniture_appliance_removal'],
  electronics: ['recycling_specialty_disposal'],
  recycling: ['recycling_specialty_disposal'],
  waste_disposal: ['recycling_specialty_disposal'],
  scrap_metal: ['recycling_specialty_disposal'],
  yard_waste_removal: ['recycling_specialty_disposal'],
  estate_cleanout: ['moving_downsizing', 'furniture_appliance_removal'],
  construction_debris: ['renovation_construction_debris'],
  demolition_cleanup: ['renovation_construction_debris'],
  bin_rentals: ['renovation_construction_debris'],
  commercial_waste: ['commercial_office_cleanouts'],
  same_day_pickup: ['urgent_same_day'],
  moving_services: ['moving_downsizing', 'urgent_same_day'],
  other: [],
};

// Natural-language need expressions beyond industry keywords. English + French.
const MARKET_KEYWORDS: Record<string, string[]> = {
  furniture_appliance_removal: [
    'junk removal', 'junk', 'furniture', 'couch', 'sofa', 'mattress', 'appliance', 'fridge', 'freezer',
    'stove', 'washer', 'dryer', 'dishwasher', 'hot tub', 'spa', 'tv', 'television', 'console', 'table',
    'meubles', 'matelas', 'électroménager', 'divan', 'spa', 'frigo', 'cuisinière', 'laveuse', 'sécheuse',
  ],
  moving_downsizing: [
    'moving', 'move out', 'move-in', 'moving out', 'downsizing', 'downsize', 'estate', 'relocating',
    'relocation', 'condo sale', 'closing date', 'possession', 'déménagement', 'déménager', 'succession', 'relocalisation',
  ],
  renovation_construction_debris: [
    'renovation', 'reno', 'construction', 'demolition', 'demo', 'drywall', 'debris', 'bin rental',
    'dumpster', 'renovation waste', 'contractor waste', 'rénovation', 'construction', 'démolition', 'gravats', 'conteneur',
  ],
  property_management_turnover: [
    'tenant', 'landlord', 'property manager', 'property management', 'strata', 'rental unit', 'eviction',
    'turnover', 'move-out inspection', 'abandoned', 'left behind', 'locataire', 'propriétaire', 'condo en location', 'eviction', 'laissé',
  ],
  recycling_specialty_disposal: [
    'recycle', 'recycling', 'electronics', 'e-waste', 'ewaste', 'scrap metal', 'metal pickup', 'battery',
    'paint', 'tire', 'propane tank', 'yard waste', 'green waste', 'branches', 'recyclage', 'recycler', 'ferraille', 'électronique', 'résidus verts',
  ],
  commercial_office_cleanouts: [
    'office', 'commercial', 'business', 'store closure', 'restaurant', 'warehouse', 'retail', 'shop fit-out',
    'bureau', 'commercial', 'commerce', 'entrepôt', 'fermeture',
  ],
  urgent_same_day: [
    'same day', 'same-day', 'today', 'tonight', 'asap', 'as soon as possible', 'right now', 'emergency',
    'urgent', 'tomorrow morning', 'le jour même', 'aujourd’hui', 'aujourd\'hui', 'urgemment', 'urgent', 'dès que possible',
  ],
  donation_reuse_circular: [
    'donate', 'donation', 'giveaway', 'free curb', 'curb alert', 'still usable', 'goodwill', 'habitat',
    'thrift', 'second hand', 'circular', 'reuse', 'don', 'donner', 'donner gratuitement', 'réutilisation', 'occasion',
  ],
};

// Urgency detection (kept separate from the urgent_same_day market so the
// market tag and the urgency attribute never drift apart).
const URGENCY_WORDS: Record<string, string[]> = {
  immediate: ['same day', 'same-day', 'today', 'tonight', 'asap', 'right now', 'emergency', 'aujourd’hui', 'aujourd\'hui', 'en urgence', 'immédiat'],
  soon: ['tomorrow', 'this week', 'by friday', 'this weekend', 'next few days', 'demain', 'cette semaine', 'fin de semaine', 'dès que possible'],
};

const INTENT_HIGH = ['need', 'looking for', 'how much', 'quote', 'cost', 'price', 'hire', 'book', 'service', 'removal company', 'besoin', 'cherchons', 'cherche', 'combien', 'devis', 'prix'];
const INTENT_MEDIUM = ['help', 'clean out', 'clear out', 'get rid', 'haul away', 'pickup', 'take away', 'aidez', ' débarrasser', 'enlever', 'ramasser'];

const SERVICE_WORDS = [
  'junk removal', 'furniture pickup', 'appliance removal', 'mattress disposal', 'haul away', 'scrap metal',
  'hot tub removal', 'estate cleanout', 'garage cleanout', 'construction debris', 'bin rental', 'recycling',
  'donate', 'curb alert', 'moving', 'tenants', 'office cleanout', 'same day',
  'enlèvement', 'enlevement', 'collecte', 'débarras', 'recyclage',
];

const norm = (t: string) => ` ${String(t || '').toLowerCase()} `;
const hasAny = (text: string, words: string[]) => words.some((w) => text.includes(w.toLowerCase()));

export function detectMarkets(text: string, serviceCategory = ''): string[] {
  const t = norm(text);
  const found = new Set<string>(SERVICE_TO_MARKETS[serviceCategory] || []);
  for (const [market, words] of Object.entries(MARKET_KEYWORDS)) {
    if (hasAny(t, words)) found.add(market);
  }
  return [...found];
}

export function detectUrgency(text: string): 'immediate' | 'soon' | 'flexible' | 'none' {
  const t = norm(text);
  if (hasAny(t, URGENCY_WORDS.immediate)) return 'immediate';
  if (hasAny(t, URGENCY_WORDS.soon)) return 'soon';
  if (t.length > 30) return 'flexible';
  return 'none';
}

export function detectIntent(text: string, fallback = ''): 'high' | 'medium' | 'low' | 'none' {
  const t = norm(text);
  if (hasAny(t, INTENT_HIGH)) return 'high';
  if (hasAny(t, INTENT_MEDIUM)) return 'medium';
  return (['high', 'medium', 'low', 'none'].includes(fallback) ? fallback : 'none') as 'high' | 'medium' | 'low' | 'none';
}

export function detectLanguage(text: string): 'en' | 'fr' | 'other' {
  const t = norm(text);
  const frHits = (t.match(/é|è|ê|à|ç|\bque\b|\bles\b|\bdes\b|\bj'ai\b|\bje\b|\bpour\b|\bdans\b/g) || []).length;
  return frHits >= 3 ? 'fr' : 'en';
}

export function extractKeywords(text: string, limit = 6): string[] {
  const t = norm(text);
  const words = new Set<string>();
  for (const list of [SERVICE_WORDS, ...Object.values(MARKET_KEYWORDS)]) {
    for (const w of list) if (t.includes(w.toLowerCase())) words.add(w.trim());
  }
  return [...words].slice(0, limit);
}