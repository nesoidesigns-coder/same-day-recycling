// Shared registry + Google Search Console helpers for the SEO Action Engine.
// The engine tracks a small set of high-value pages; every metric it stores
// comes from the verified GSC API or the app's own records — never invented.

export const TRACKED_PAGES = [
  {
    path: '/junk-removal-vancouver',
    label: 'Vancouver city page',
    kind: 'city',
    city: 'Vancouver',
    target_keywords: [
      'same day junk removal vancouver',
      'couch removal vancouver',
      'junk pickup vancouver',
      'furniture removal vancouver',
      'garage cleanout vancouver',
    ],
  },
  {
    path: '/furniture-removal',
    label: 'Furniture removal service page',
    kind: 'service',
    city: '',
    target_keywords: [
      'furniture removal',
      'couch removal',
      'single item furniture removal',
      'sofa pickup',
      'mattress disposal',
    ],
  },
];

// Static heading inventory of the two tracked pages, kept in step with the
// page components. Used by audits so recommendations cannot propose sections
// that already exist.
export const HEADING_INVENTORY = {
  '/junk-removal-vancouver': [
    'Furniture removal in Vancouver — by job, by neighbourhood',
    'Same Day Furniture Removal in Vancouver BC',
    'Furniture Removal for Vancouver Condos, Apartments & Walk-ups',
    'Office Furniture Removal in Downtown Vancouver & Mount Pleasant',
    'Moving-Out & Estate Furniture Cleanouts in Vancouver',
    'Furniture Donation Pickup in Vancouver — Reuse Before Recycling',
    'Sofa, Sectional & Recliner Pickup Across Vancouver Neighbourhoods',
    'Serving Vancouver neighbourhoods',
    'Vancouver furniture removal FAQs',
  ],
  '/furniture-removal': [
    'Furniture removal and recycling, done the responsible way',
    'What we take',
    'How it works',
    'Sofa and couch removal',
    'Mattress and box spring disposal',
    'Furniture removal pricing: what it costs',
    'Where your furniture goes: donation and recycling first',
    'Hot tub and patio furniture removal',
    'Office and commercial furniture removal',
    'Single-item furniture removal',
    'Areas we serve',
    'Furniture Removal & Recycling — questions',
  ],
};

export function ownSiteUrl(sites) {
  return sites.find((s) => s.includes('samedayrecycling.ca')) || sites[0];
}

// GSC reporting lags ~2 days; default window is the trailing 28 days.
export function gscWindow() {
  const fmt = (d) => d.toISOString().slice(0, 10);
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 2);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 27);
  return { startDate: fmt(start), endDate: fmt(end) };
}

export async function gscQuery(token, siteUrl, body) {
  const res = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    }
  );
  if (!res.ok) throw new Error(`Search Analytics request failed (${res.status})`);
  return res.json();
}

export async function resolveSite(token) {
  const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!sitesRes.ok) throw new Error(`Search Console sites request failed (${sitesRes.status})`);
  const data = await sitesRes.json();
  const sites = (data.siteEntry || []).map((s) => s.siteUrl);
  if (!sites.length) throw new Error('No verified properties in this Search Console account');
  return ownSiteUrl(sites);
}

// Verified per-page performance plus the real queries that page appears for.
export async function pageStats(token, siteUrl, path) {
  const window = gscWindow();
  const fullUrl = `https://samedayrecycling.ca${path}`;
  const pages = await gscQuery(token, siteUrl, { ...window, dimensions: ['page'], rowLimit: 250 });
  const row = (pages.rows || []).find((r) => (r.keys[0] || '').endsWith(path));
  const queries = await gscQuery(token, siteUrl, {
    ...window,
    dimensions: ['query'],
    dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'equals', expression: fullUrl }] }],
    rowLimit: 10,
  });
  return {
    window,
    stats: row
      ? {
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          position: Math.round((row.position || 0) * 10) / 10,
          ctr: Math.round((row.ctr || 0) * 1000) / 10,
        }
      : { clicks: 0, impressions: 0, position: 0, ctr: 0 },
    queries: (queries.rows || []).map((r) => ({
      query: r.keys[0],
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      position: Math.round((r.position || 0) * 10) / 10,
    })),
  };
}

// Current live metadata for a tracked page, from wherever the page actually
// reads it (CitySeo for city pages, ServicePageMeta for service pages).
export async function currentMeta(base44, page) {
  if (page.kind === 'city') {
    const { items } = await base44.asServiceRole.entities.CitySeo.filter({ city: page.city }, { limit: 1 });
    const row = items[0];
    return row && (row.seo_title || row.seo_description)
      ? { title: row.seo_title || '', description: row.seo_description || '', source: 'CitySeo record' }
      : { title: '', description: '', source: 'dynamic default (no CitySeo record stored)' };
  }
  const { items } = await base44.asServiceRole.entities.ServicePageMeta.filter({ path: page.path }, { limit: 1 });
  const row = items[0];
  return row
    ? { title: row.title || '', description: row.description || '', source: 'ServicePageMeta record' }
    : { title: '', description: '', source: 'page config default (no ServicePageMeta record)' };
}