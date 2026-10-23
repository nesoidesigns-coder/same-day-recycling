// Shared Search Authority / SEO autopilot core: the canonical indexable page
// set, Google URL Inspection bucket mapping, sitemap fetching and server-HTML
// page parsing. Used by searchAuthority and seoAutoPilot so they can never
// disagree about what "indexable" or "blocked" means.

export const SITE_BASE = 'https://samedayrecycling.ca';

export const CITY_SLUGS = [
  'vancouver', 'north-vancouver', 'burnaby', 'surrey', 'richmond', 'coquitlam',
  'victoria', 'calgary', 'edmonton', 'saskatoon', 'regina', 'winnipeg',
  'toronto', 'ottawa', 'hamilton', 'mississauga', 'montreal', 'quebec-city',
  'moncton', 'saint-john', 'halifax', 'st-johns', 'kamloops', 'kelowna',
  'maple-ridge', 'pitt-meadows', 'charlottetown', 'whitehorse', 'yellowknife', 'iqaluit',
];

export const CORE_PAGES = [
  '/', '/pricing', '/furniture-removal', '/appliance-removal', '/electronics-recycling',
  '/commercial-recycling', '/same-day-pickup', '/services', '/service-finder',
  '/real-estate', '/about', '/contact', '/subscriptions', '/free-metal-pickup',
  '/recycling-centers', '/recycling', '/recycling-assistant', '/blog',
  '/realtors', '/contractors', '/realtor-partners', '/property-managers',
  '/software', '/white-label', '/gallery', '/coverage', '/review', '/contractor-onboarding',
];

export const REGION_CODES = ['BC', 'AB', 'SK', 'MB', 'ON', 'QC', 'NB', 'NS', 'PE', 'NL', 'YT', 'NT', 'NU'];

export const expectedCanonicalPaths = () => [
  ...CORE_PAGES,
  ...CITY_SLUGS.map((s) => `/junk-removal-${s}`),
  ...REGION_CODES.map((c) => `/region/${c}`),
];

export const norm = (u) => String(u).replace(/\/$/, '');
export const pathOf = (u) => String(u).replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '') || '/';

// --- Real Google evidence → honest buckets ------------------------------------
// Maps the URL Inspection API response to distinct statuses. Only explicit
// Google fields produce a bucket; a page Google reports as unknown stays
// "unknown_to_google" — never inferred to be blocked.
export const bucketFor = (idx) => {
  const verdict = String(idx.verdict || '').toUpperCase();
  const coverage = String(idx.coverageState || '').toLowerCase();
  const indexing = String(idx.indexingState || '').toUpperCase();
  const robots = String(idx.robotsTxtState || '').toUpperCase();
  if (verdict === 'PASS') return 'indexed';
  if (coverage.includes('blocked by robots.txt') || robots === 'BLOCKED_BY_ROBOTS') return 'blocked_by_robots';
  if (indexing === 'BLOCKED_BY_META_NOINDEX' || coverage.includes('noindex')) return 'noindex';
  if (coverage.includes('duplicate without user-selected canonical')) return 'canonical_conflict';
  if (coverage.includes('alternate page with proper canonical')) return 'alternate_canonical';
  if (coverage.includes('discovered')) return 'discovered_not_indexed';
  if (coverage.includes('crawled')) return 'crawled_not_indexed';
  if (coverage.includes('unknown to google')) return 'unknown_to_google';
  if (coverage.includes('redirect')) return 'redirected';
  if (coverage.includes('fetch') || coverage.includes('server error') || coverage.includes('not found')) return 'fetch_error';
  return 'unknown_to_google';
};

export const PRIORITY = {
  blocked_by_robots: 1, noindex: 1, canonical_conflict: 1, fetch_error: 1,
  crawled_not_indexed: 2, discovered_not_indexed: 2,
  unknown_to_google: 3, alternate_canonical: 3, redirected: 3, inspection_unavailable: 3,
};

export const BUCKET_LABEL = {
  blocked_by_robots: 'Blocked by robots.txt',
  noindex: 'Excluded by noindex',
  canonical_conflict: 'Canonical conflict',
  fetch_error: 'Google could not fetch the page',
  crawled_not_indexed: 'Crawled, not indexed',
  discovered_not_indexed: 'Discovered, not indexed',
  unknown_to_google: 'Unknown to Google',
  alternate_canonical: 'Duplicate (canonical resolves)',
  redirected: 'Redirected',
  inspection_unavailable: 'Inspection unavailable',
};

export const FIXES = {
  blocked_by_robots: 'Remove the robots.txt rule blocking this URL, then request indexing in Search Console.',
  noindex: 'Remove the noindex directive from this page, then request indexing in Search Console.',
  canonical_conflict: 'Add a self-referencing canonical to this page and deduplicate it against the URL Google picked instead.',
  fetch_error: 'Confirm the page returns HTTP 200 (check server logs), then request indexing again.',
  crawled_not_indexed: 'Google crawled but chose not to index: deepen unique content, add internal links from indexed pages, then request indexing.',
  discovered_not_indexed: 'Google discovered but has not crawled this page: link to it from indexed pages, then request indexing.',
  unknown_to_google: 'Google has not seen this URL: confirm it is in the sitemap and linked internally, then request indexing.',
  alternate_canonical: 'No action unless the wrong URL is being indexed — Google consolidated this duplicate to its canonical.',
  redirected: 'Update internal links and the sitemap to point at the final destination URL.',
  inspection_unavailable: 'Re-run the inspection; if it keeps failing, verify the property in Search Console.',
};

// --- Live sitemap fetch (follows sitemap index, one level) ---------------------
export async function fetchSitemap(base) {
  const fetchLocs = async (url) => {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(String(res.status));
    return await res.text();
  };
  try {
    const mainXml = await fetchLocs(base + '/sitemap.xml');
    const locs = [...mainXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    let all = locs;
    if (/<sitemapindex/i.test(mainXml)) {
      const children = locs.filter((u) => u.endsWith('.xml')).slice(0, 6);
      const childResults = await Promise.allSettled(children.map(fetchLocs));
      all = locs.filter((u) => !u.endsWith('.xml'));
      for (const cr of childResults) {
        if (cr.status === 'fulfilled') {
          all.push(...[...cr.value.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
        }
      }
    }
    return { pages: [...new Set(all)].filter((u) => u.startsWith('http')), error: false };
  } catch {
    return { pages: [], error: true };
  }
}

// --- Google URL Inspection (real API, real fields only) ------------------------
export async function inspectUrl(accessToken, siteUrl, u) {
  try {
    const res = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inspectionUrl: u, siteUrl, languageCode: 'en' }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      return { url: u, bucket: 'inspection_unavailable', verdict: '', coverage_state: '', reason: `Inspection request failed (HTTP ${res.status})` };
    }
    const insp = await res.json();
    const idx = (insp.inspectionResult || {}).indexStatusResult || {};
    return {
      url: u,
      bucket: bucketFor(idx),
      verdict: idx.verdict || '',
      coverage_state: idx.coverageState || '',
      indexing_state: idx.indexingState || '',
      robots_txt_state: idx.robotsTxtState || '',
      page_fetch_state: idx.pageFetchState || '',
      last_crawl: idx.lastCrawlTime || '',
      canonical_user: idx.userCanonical || '',
      canonical_google: idx.googleCanonical || '',
      crawled_as: idx.crawledAs || '',
      in_sitemap: idx.sitemap === true,
      inspected_at: new Date().toISOString(),
    };
  } catch (e) {
    return { url: u, bucket: 'inspection_unavailable', verdict: '', coverage_state: '', reason: e.message };
  }
}

// --- Server-HTML page parse (meta / canonical / content evidence) --------------
export function parsePage(u, status, html) {
  const pick = (re) => { const m = html.match(re); return m ? m[1].trim() : ''; };
  const title = pick(/<title[^>]*>([^<]*)<\/title>/i);
  const description = pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
    || pick(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const canonical = pick(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i)
    || pick(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i);
  const metaRobots = pick(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i);
  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map((m) => m[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()).filter(Boolean);
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = body ? body.split(' ').length : 0;
  const internalLinks = (html.match(/href="(\/[^"]*"|https?:\/\/samedayrecycling\.ca[^"]*")/gi) || []).length;
  const internalHrefs = [...new Set(
    (html.match(/href="(\/[^"]*"|https?:\/\/samedayrecycling\.ca[^"]*")/gi) || [])
      .map((h) => h.replace(/^href="/i, '').replace(/"$/, ''))
  )];
  return {
    url: u,
    http_status: status,
    title,
    title_length: title.length,
    description,
    description_length: description.length,
    canonical,
    canonical_self: canonical ? norm(canonical) === norm(u) : null,
    meta_robots: metaRobots,
    h1: h1s.slice(0, 2),
    words,
    internal_links: internalLinks,
    internal_hrefs: internalHrefs.slice(0, 30),
    // Server HTML can be an SPA shell — content checks are only asserted
    // when the fetched document itself carries substantial text.
    content_basis: words >= 200 ? 'server_html' : 'shell_or_unverifiable',
  };
}