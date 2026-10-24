// Shared analytics definitions — the single source of truth used by every
// dashboard (visitStats, conversionFunnel, businessIntel, trackVisit).
// One metric + one date range must produce identical totals everywhere.

export type TrafficClass = 'customer' | 'contractor' | 'owner' | 'bot' | 'unclassified';

// Traffic classification, null-safe: historical records with no class are
// 'unclassified' — they are NEVER silently counted as genuine customers.
export function visitClass(row: { traffic_class?: string | null }): TrafficClass {
  const c = row?.traffic_class;
  if (c === 'customer' || c === 'contractor' || c === 'owner' || c === 'bot') return c;
  return 'unclassified';
}

// Human traffic = customers + contractors. Owner testing and bot crawls are
// tracked but never inflate visitor statistics.
export const HUMAN_CLASSES: TrafficClass[] = ['customer', 'contractor'];
export const HUMAN_FILTER = { traffic_class: { $in: HUMAN_CLASSES } };

// MongoDB note: { sid: { $ne: '' } } ALSO matches null sid values — every
// session query must add $exists so historical null-sid records are excluded.
export const SESSION_FILTER = { sid: { $exists: true, $ne: '' } };

export function byClass(rows: Array<{ traffic_class?: string | null; count?: number }> | null | undefined) {
  const out = { customer: 0, contractor: 0, owner: 0, bot: 0, unclassified: 0, total: 0 };
  for (const row of rows || []) {
    const cls = visitClass(row);
    out[cls] += row.count || 0;
    out.total += row.count || 0;
  }
  return out;
}

// Headline visitor totals count human traffic only — owner + bot + unclassified
// are reported separately. This is the definition behind the "N visits" figure.
export function humanVisits(c: { customer: number; contractor: number; unclassified: number }) {
  return c.customer + c.contractor;
}

// ---- Customer-intent detection (behavior-based, never assumed) ----
// A visit alone is NOT customer intent. Intent = meaningful behavior visible
// in the recorded path: viewing a service page, checking availability,
// opening pricing, starting a quote/booking, or tracking a booked job.
const INTENT_PREFIXES = [
  '/junk-removal', '/furniture-removal', '/appliance-removal', '/electronics-recycling',
  '/commercial-recycling', '/same-day-pickup', '/free-metal-pickup',
  '/services', '/service-finder', '/pricing', '/request-service', '/request-status',
  '/track', '/coverage', '/ai-booking',
];

export function hasIntentPath(path: string): boolean {
  const p = String(path || '/').toLowerCase();
  return INTENT_PREFIXES.some((pre) => p === pre || p.startsWith(pre + '/') || p.startsWith(pre + '?'));
}

// Rex chat interactions and payment events are NOT path-recordable; the
// platform event stream and booking/payment records cover those stages.
export const INTENT_NOTE =
  'Intent is derived from recorded page behavior (service pages, availability, pricing, quote/booking, tracking). Rex chat interactions and completed payments are measured from booking and payment records, not from visits.';

// ---- Traffic-source attribution (single classifier for every writer/reader) ----
const AI_HOSTS = ['chatgpt.com', 'chat.openai.com', 'perplexity.ai', 'gemini.google.com', 'copilot.microsoft.com', 'claude.ai', 'you.com', 'poe.com', 'chat.mistral.ai', 'labs.perplexity.ai'];
const SOCIAL_HOSTS: Array<[string[], string]> = [
  [['facebook.com', 'fb.me', 'instagram.com', 'l.facebook', 'l.instagram'], 'facebook'],
  [['twitter.com', 'x.com', 't.co'], 'other'],
  [['linkedin.com', 'lnkd.in'], 'other'],
  [['reddit.com', 'redd.it'], 'other'],
  [['tiktok.com'], 'other'],
  [['youtube.com', 'youtu.be'], 'other'],
  [['pinterest.com', 'pin.it'], 'other'],
];
const SEARCH_HOSTS = ['google.', 'bing.', 'duckduckgo.', 'yahoo.'];
export const GBP_HOSTS = ['business.google.com', 'maps.google', 'google.com/maps', 'goo.gl/maps', 'maps.app.goo.gl'];

// An empty referrer is "direct / unknown" — the browser sent none (direct
// navigation, strict privacy settings, or in-app/iframe browsing). It is never
// re-labeled as search or social without evidence.
export function classifySource(referrer: string): string {
  const r = String(referrer || '').toLowerCase();
  if (!r) return 'direct';
  if (AI_HOSTS.some((h) => r.includes(h))) return 'ai_search';
  for (const [hosts, label] of SOCIAL_HOSTS) if (hosts.some((h) => r.includes(h))) return label;
  if (SEARCH_HOSTS.some((h) => r.includes(h))) return 'search';
  return 'other';
}

export const SOURCE_LABELS: Record<string, string> = {
  direct: 'Direct / unknown',
  search: 'Search (Google/Bing)',
  facebook: 'Facebook & Instagram',
  ai_search: 'AI search referrals',
  google_business: 'Google Business Profile',
  other: 'External referrals',
};

// ---- Small shared helpers ----
export const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : null);
export const sum = (rows: any[], fn: (r: any) => any) => rows.reduce((a, r) => a + (Number(fn(r)) || 0), 0);
export const readRows = (page: any) => (Array.isArray(page) ? page : page?.items) || [];

export const METRIC_DEFINITIONS = {
  pageviews: 'Every recorded page-load event, all traffic classes included.',
  human_visits: 'Customer + contractor page-loads. Excludes owner, bot and unclassified records.',
  customer_intent: 'Human visits showing buying behavior: a service page, availability, pricing, quote/booking start or job tracking.',
  sessions: 'Distinct anonymous browser-session keys (sid) on human traffic. A session with no sid (historical) cannot be counted.',
  returning: 'Sessions with more than one recorded visit in the window.',
  qualified_leads: 'Captured quote requests (QuoteLead records).',
  confirmed_bookings: 'Service bookings accepted and scheduled (confirmed/contacted/scheduled/completed). Counted once, cancellations excluded.',
  completed_payments: 'Platform-processed payments plus externally settled payments the owner has verified.',
  owner_activity: 'Authenticated admin visits — fully tracked, excluded from every customer metric.',
  unclassified: 'Historical or uncertain visits with no classification. Never auto-labelled as customers.',
};