import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Search Authority report: 100% real Google Search Console data through the
// authorized google_search_console connector. Indexing verdicts come ONLY from
// the URL Inspection API's own response fields (coverageState, indexingState,
// robotsTxtState, verdict) — a page Google reports as unknown is shown as
// "Unknown to Google", never guessed to be blocked. When GSC is unreachable the
// report returns { connected: false } and the dashboard shows "Not connected".

// --- Canonical indexable page set (sitemap audit) -----------------------------
const CITY_SLUGS = [
  'vancouver', 'north-vancouver', 'burnaby', 'surrey', 'richmond', 'coquitlam',
  'victoria', 'calgary', 'edmonton', 'saskatoon', 'regina', 'winnipeg',
  'toronto', 'ottawa', 'hamilton', 'mississauga', 'montreal', 'quebec-city',
  'moncton', 'saint-john', 'halifax', 'st-johns', 'kamloops', 'kelowna',
  'maple-ridge', 'pitt-meadows', 'charlottetown', 'whitehorse', 'yellowknife', 'iqaluit',
];
const CORE_PAGES = [
  '/', '/pricing', '/furniture-removal', '/appliance-removal', '/electronics-recycling',
  '/commercial-recycling', '/same-day-pickup', '/services', '/service-finder',
  '/real-estate', '/about', '/contact', '/subscriptions', '/free-metal-pickup',
  '/recycling-centers', '/recycling', '/recycling-assistant', '/blog',
  '/realtors', '/contractors', '/realtor-partners', '/property-managers',
  '/software', '/white-label', '/gallery', '/coverage', '/review', '/contractor-onboarding',
];
const REGION_CODES = ['BC', 'AB', 'SK', 'MB', 'ON', 'QC', 'NB', 'NS', 'PE', 'NL', 'YT', 'NT', 'NU'];

const expectedCanonicalPaths = () => [
  ...CORE_PAGES,
  ...CITY_SLUGS.map((s) => `/junk-removal-${s}`),
  ...REGION_CODES.map((c) => `/region/${c}`),
];

// --- Real Google evidence → honest buckets ------------------------------------
// Maps the URL Inspection API response to distinct statuses. Only explicit
// Google fields produce a bucket; anything unrecognized stays "unknown".
const bucketFor = (idx) => {
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

const inspectUrl = async (accessToken, siteUrl, u) => {
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
};

const PRIORITY = {
  blocked_by_robots: 1, noindex: 1, canonical_conflict: 1, fetch_error: 1,
  crawled_not_indexed: 2, discovered_not_indexed: 2,
  unknown_to_google: 3, alternate_canonical: 3, redirected: 3, inspection_unavailable: 3,
};
const BUCKET_LABEL = {
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
const FIXES = {
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

// --- Server-HTML page checks (measurable, labeled) -----------------------------
const parsePage = (u, status, html) => {
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
  return {
    url: u,
    http_status: status,
    title,
    title_length: title.length,
    description,
    description_length: description.length,
    canonical,
    canonical_self: canonical ? String(canonical).replace(/\/$/, '') === String(u).replace(/\/$/, '') : null,
    meta_robots: metaRobots,
    h1: h1s.slice(0, 2),
    words,
    internal_links: internalLinks,
    // Server HTML can be an SPA shell — content checks are only asserted
    // when the fetched document itself carries substantial text.
    content_basis: words >= 200 ? 'server_html' : 'shell_or_unverifiable',
  };
};

const norm = (u) => String(u).replace(/\/$/, '');

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let payload = {};
    try { payload = await req.json(); } catch {}

    // --- Resolve the property -------------------------------------------------
    let accessToken;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('google_search_console');
      accessToken = conn.accessToken;
    } catch {
      return Response.json({ connected: false, reason: 'Search Console account not authorized.' });
    }

    const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!sitesRes.ok) {
      return Response.json({ connected: false, reason: `Google Search Console request failed (${sitesRes.status}).` });
    }
    const sitesData = await sitesRes.json();
    const sites = (sitesData.siteEntry || []).map((s) => s.siteUrl);
    if (!sites.length) {
      return Response.json({ connected: false, reason: 'No verified properties in this Search Console account.' });
    }
    const ownSite = sites.find((s) => s.includes('samedayrecycling.ca')) || sites[0];
    const target = (payload.siteUrl && sites.includes(payload.siteUrl)) ? payload.siteUrl : ownSite;

    // --- Single-URL re-inspection (Recovery Centre "Verify" control) ----------
    if (payload.action === 'inspect') {
      const u = String(payload.url || '');
      if (!u) return Response.json({ error: 'url is required.' }, { status: 400 });
      return Response.json(await inspectUrl(accessToken, target, u));
    }

    // --- Windows (GSC reporting lags ~2 days) ---------------------------------
    const fmt = (d) => d.toISOString().slice(0, 10);
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - 2);
    const start = new Date(end); start.setUTCDate(start.getUTCDate() - 27);
    const prevEnd = new Date(start); prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);
    const prevStart = new Date(prevEnd); prevStart.setUTCDate(prevStart.getUTCDate() - 27);
    const longStart = new Date(end); longStart.setUTCDate(longStart.getUTCDate() - 89);

    const query = async (startDate, endDate, dimensions, rowLimit) => {
      const res = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(target)}/searchAnalytics/query`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ startDate, endDate, dimensions, rowLimit }),
          signal: AbortSignal.timeout(15000),
        }
      );
      if (!res.ok) throw new Error(`Search Analytics request failed (${res.status})`);
      const data = await res.json();
      return data.rows || [];
    };

    // --- Change tracking: per-URL GSC measurement ------------------------------
    if (payload.action === 'measure') {
      const measureUrl = String(payload.page_url || '');
      if (!measureUrl) return Response.json({ error: 'page_url is required.' }, { status: 400 });
      const mEnd = new Date(); mEnd.setUTCDate(mEnd.getUTCDate() - 2);
      const mStart = new Date(mEnd); mStart.setUTCDate(mStart.getUTCDate() - 27);
      const mPrevEnd = new Date(mStart); mPrevEnd.setUTCDate(mPrevEnd.getUTCDate() - 1);
      const mPrevStart = new Date(mPrevEnd); mPrevStart.setUTCDate(mPrevStart.getUTCDate() - 27);
      const [curRows, prevRows] = await Promise.all([
        query(fmt(mStart), fmt(mEnd), ['page'], 250),
        query(fmt(mPrevStart), fmt(mPrevEnd), ['page'], 250),
      ]);
      const findPage = (rows) => {
        const r = rows.find((x) => x.keys[0] === measureUrl)
          || rows.find((x) => norm(x.keys[0]) === norm(measureUrl))
          || rows.find((x) => norm(x.keys[0]) + '/' === norm(measureUrl));
        return r
          ? { clicks: r.clicks || 0, impressions: r.impressions || 0, position: Math.round((r.position || 0) * 10) / 10 }
          : { clicks: 0, impressions: 0, position: 0 };
      };
      return Response.json({
        page: measureUrl,
        window: { start: fmt(mStart), end: fmt(mEnd) },
        current: findPage(curRows),
        previous: findPage(prevRows),
      });
    }

    const [totalsCur, totalsPrev, byQuery, byPage, byCountry, longPages] = await Promise.all([
      query(fmt(start), fmt(end), [], 1),
      query(fmt(prevStart), fmt(prevEnd), [], 1),
      query(fmt(start), fmt(end), ['query'], 100),
      query(fmt(start), fmt(end), ['page'], 250),
      query(fmt(start), fmt(end), ['country'], 25),
      query(fmt(longStart), fmt(end), ['page'], 250),
    ]);

    const row = (r) => r && r[0]
      ? { clicks: r[0].clicks || 0, impressions: r[0].impressions || 0, ctr: Math.round((r[0].ctr || 0) * 1000) / 10, position: Math.round((r[0].position || 0) * 10) / 10 }
      : { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    const fmtRow = (r) => ({
      key: r.keys[0],
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: Math.round((r.ctr || 0) * 1000) / 10,
      position: Math.round((r.position || 0) * 10) / 10,
    });

    const totals = row(totalsCur);
    const totalsPrevRow = row(totalsPrev);
    const pages = byPage.map(fmtRow).sort((a, b) => b.impressions - a.impressions);
    const queries = byQuery.map((r) => ({ ...fmtRow(r), page: '' })).sort((a, b) => b.clicks - a.clicks);
    const countries = byCountry.map(fmtRow).sort((a, b) => b.impressions - a.impressions);

    // --- Sitemap: fetch live XML and audit against the canonical page set ------
    const sitemapBase = 'https://' + String(target).replace(/^(sc-domain:|https?:\/\/)/, '').replace(/\/$/, '');
    let sitemapPages = [];
    let sitemapError = false;
    try {
      const fetchLocs = async (url) => {
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) throw new Error(String(res.status));
        return await res.text();
      };
      const mainXml = await fetchLocs(sitemapBase + '/sitemap.xml');
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
      sitemapPages = [...new Set(all)].filter((u) => u.startsWith('http'));
    } catch {
      sitemapError = true;
    }

    // Sitemap audit: every canonical, indexable service and location page must
    // be present. Extra entries are listed for review, never auto-removed.
    const pathOf = (u) => String(u).replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '') || '/';
    const expectedPaths = new Set(expectedCanonicalPaths());
    const sitemapPaths = new Set(sitemapPages.map(pathOf));
    const sitemapMissing = [...expectedPaths].filter((p) => !sitemapPaths.has(p));
    const sitemapUnexpected = [...sitemapPaths].filter((p) => !expectedPaths.has(p) && !p.startsWith('/blog/'));

    const longPageSet = {};
    for (const r of longPages) longPageSet[r.keys[0]] = { clicks: r.clicks || 0, impressions: r.impressions || 0 };

    const indexed = [];
    const noImpressions = [];
    for (const u of sitemapPages) {
      const stats = longPageSet[u] || longPageSet[norm(u)] || longPageSet[norm(u) + '/'];
      if (stats && stats.impressions > 0) indexed.push({ page: u, clicks: stats.clicks, impressions: stats.impressions });
      else noImpressions.push(u);
    }

    // --- Google's submitted-vs-indexed sitemap counts --------------------------
    let sitemapSubmittedIndexed = null;
    try {
      const smRes = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(target)}/sitemaps`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000),
      });
      if (smRes.ok) {
        const smData = await smRes.json();
        let submitted = 0, indexedCnt = 0;
        for (const sm of smData.sitemap || []) {
          for (const c of sm.contents || []) {
            if (c.type === 'web') { submitted += c.submitted || 0; indexedCnt += c.indexed || 0; }
          }
        }
        sitemapSubmittedIndexed = { submitted, indexed: indexedCnt };
      }
    } catch { /* sitemap status is best-effort */ }

    // --- URL Inspection on sitemap URLs with no 90-day impressions -------------
    const inspectList = noImpressions.slice(0, 20);
    const inspectionSample = [];
    for (let i = 0; i < inspectList.length; i += 4) {
      const chunk = inspectList.slice(i, i + 4);
      const settled = await Promise.allSettled(chunk.map((u) => inspectUrl(accessToken, target, u)));
      for (const r of settled) if (r.status === 'fulfilled') inspectionSample.push(r.value);
    }
    const inspectionBuckets = {};
    for (const s of inspectionSample) inspectionBuckets[s.bucket] = (inspectionBuckets[s.bucket] || 0) + 1;

    // --- Page quality checks on key published pages ----------------------------
    const checkTargets = sitemapPages.filter((u) => {
      const p = pathOf(u);
      return p === '/' || /^\/junk-removal-/.test(p)
        || /^\/(pricing|furniture-removal|appliance-removal|electronics-recycling|commercial-recycling|same-day-pickup|free-metal-pickup|services|coverage)$/.test(p);
    }).slice(0, 16);

    const pageChecks = [];
    for (let i = 0; i < checkTargets.length; i += 4) {
      const chunk = checkTargets.slice(i, i + 4);
      const settled = await Promise.allSettled(chunk.map(async (u) => {
        try {
          const res = await fetch(u, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SDR-IndexChecker/1.0; +https://samedayrecycling.ca)' },
            signal: AbortSignal.timeout(12000),
          });
          return parsePage(u, res.status, res.ok ? await res.text() : '');
        } catch (e) {
          return { url: u, http_status: 0, title: '', title_length: 0, description: '', description_length: 0, canonical: '', canonical_self: null, meta_robots: '', h1: [], words: 0, internal_links: 0, content_basis: 'shell_or_unverifiable', fetch_error: e.message };
        }
      }));
      for (const r of settled) if (r.status === 'fulfilled') pageChecks.push(r.value);
    }
    // Uniqueness across checked pages
    const titleSeen = {};
    const descSeen = {};
    for (const c of pageChecks) {
      if (c.title) titleSeen[c.title.toLowerCase()] = (titleSeen[c.title.toLowerCase()] || 0) + 1;
      if (c.description) descSeen[c.description.toLowerCase()] = (descSeen[c.description.toLowerCase()] || 0) + 1;
    }
    for (const c of pageChecks) {
      c.unique_title = c.title ? (titleSeen[c.title.toLowerCase()] === 1) : null;
      c.unique_description = c.description ? (descSeen[c.description.toLowerCase()] === 1) : null;
    }

    // --- Recovery Centre: prioritized issues from real evidence only -----------
    const gscLink = (u) => `https://search.google.com/search-console/inspect?url=${encodeURIComponent(u)}&id=${encodeURIComponent(target)}`;
    const recovery = [];
    for (const s of inspectionSample) {
      if (s.bucket === 'indexed') continue;
      recovery.push({
        type: 'google_inspection',
        url: s.url,
        priority: PRIORITY[s.bucket] || 3,
        issue: BUCKET_LABEL[s.bucket] || s.bucket,
        bucket: s.bucket,
        evidence: s.coverage_state || s.reason || 'Inspection returned no coverage detail',
        evidence_kind: 'google',
        fix: FIXES[s.bucket] || 'Inspect the URL in Search Console and follow Google\'s reported reason.',
        detail: s,
        gsc_url: gscLink(s.url),
      });
    }
    for (const c of pageChecks) {
      const add = (issue, priority, evidence, fix) => recovery.push({
        type: 'page_check', url: c.url, priority, issue, bucket: 'page_check',
        evidence, evidence_kind: 'page_fetch', fix, detail: c, gsc_url: gscLink(c.url),
      });
      if (c.http_status && c.http_status !== 200) {
        add(`Page returns HTTP ${c.http_status}`, 1, `Fetched ${c.url}: HTTP ${c.http_status}`, 'Fix the server response so the page returns 200.');
      }
      if (c.meta_robots && /noindex/i.test(c.meta_robots)) {
        add('Page carries a noindex meta tag', 1, `meta robots = "${c.meta_robots}"`, 'Remove the noindex meta tag from this page.');
      }
      if (c.title && c.title_length < 10) add('Title is too short to describe the page', 2, `Title: "${c.title}" (${c.title_length} chars)`, 'Write a descriptive 55-60 character title.');
      if (c.title_length > 0 && c.unique_title === false) add('Duplicate title across pages', 2, `Title "${c.title}" appears on multiple checked pages`, 'Rewrite this page\'s title so it is unique.');
      if (c.title_length === 0 && c.http_status === 200) add('No title tag found', 2, 'Server HTML had no <title> element', 'Add a unique, descriptive title tag.');
      if (c.http_status === 200 && c.description_length === 0) add('No meta description found', 2, 'Server HTML had no meta description', 'Add a 140-158 character meta description with a call to action.');
      if (c.description && c.unique_description === false) add('Duplicate meta description across pages', 2, 'This description matches another checked page', 'Rewrite this page\'s description so it is unique.');
      if (c.canonical_self === false) add('Canonical does not match this URL', 1, `Canonical tag points to ${c.canonical}`, 'Set a self-referencing canonical to this page\'s URL.');
      if (c.content_basis === 'server_html' && c.words < 250) add('Thin location-specific content', 3, `Only ${c.words} words of text in the served HTML`, 'Add city-specific service content (coverage, pricing, local rules).');
      if (c.content_basis === 'server_html' && c.internal_links < 5) add('Few internal links on the page', 3, `${c.internal_links} internal links found in the served HTML`, 'Link this page from related services and city pages so crawlers can reach it.');
    }
    for (const p of sitemapMissing) {
      recovery.push({
        type: 'sitemap_audit',
        url: sitemapBase + (p === '/' ? '/' : p),
        priority: 2,
        issue: 'Canonical page missing from the sitemap',
        bucket: 'sitemap_missing',
        evidence: `Live sitemap does not list ${p}`,
        evidence_kind: 'page_fetch',
        fix: 'Add the page to the sitemap and re-submit it in Search Console.',
        detail: { path: p },
        gsc_url: gscLink(sitemapBase + p),
      });
    }
    recovery.sort((a, b) => a.priority - b.priority);

    // --- Opportunity monitor (recommendations, clearly separated from evidence)
    const siteCtr = totals.impressions > 0 ? totals.ctr : 0;
    const opportunities = [];
    for (const p of pages) {
      if (p.impressions >= 50 && p.ctr < siteCtr) {
        opportunities.push({
          page: p.page, type: 'low_ctr',
          evidence: `${p.impressions.toLocaleString('en-CA')} impressions at ${p.ctr}% CTR (site average ${siteCtr}%)`,
          action: 'Improve the page title and meta description to win the click',
          value: p.impressions >= 500 ? 'high' : p.impressions >= 100 ? 'medium' : 'low',
          effort: 'low', confidence: p.position <= 12 ? 'high' : 'medium',
        });
      }
      if (p.position >= 4 && p.position <= 15 && p.impressions >= 30) {
        opportunities.push({
          page: p.page, type: 'rank_quick_win',
          evidence: `Ranked #${p.position} with ${p.impressions.toLocaleString('en-CA')} impressions`,
          action: 'Strengthen this page against the ranking query (content depth, internal links)',
          value: p.impressions >= 500 ? 'high' : p.impressions >= 100 ? 'medium' : 'low',
          effort: 'medium', confidence: 'high',
        });
      }
    }
    for (const u of noImpressions.slice(0, 20)) {
      opportunities.push({
        page: u, type: 'no_impressions',
        evidence: 'In the sitemap but zero Search Console impressions in 90 days',
        action: 'Check indexing (Search Console URL inspection), then add internal links and unique content',
        value: 'medium', effort: 'medium', confidence: 'medium',
      });
    }
    const valueRank = { high: 3, medium: 2, low: 1 };
    opportunities.sort((a, b) => (valueRank[b.value] - valueRank[a.value]) || (b.evidence.length - a.evidence.length));

    const blockers = (inspectionBuckets.blocked_by_robots || 0) + (inspectionBuckets.noindex || 0)
      + (inspectionBuckets.canonical_conflict || 0) + (inspectionBuckets.fetch_error || 0);

    return Response.json({
      connected: true,
      siteUrl: target,
      startDate: fmt(start), endDate: fmt(end),
      prevStartDate: fmt(prevStart), prevEndDate: fmt(prevEnd),
      totals, totals_previous: totalsPrevRow,
      queries: queries.slice(0, 25),
      pages: pages.slice(0, 25),
      countries,
      index: {
        sitemap_pages: sitemapPages.length,
        sitemap_error: sitemapError,
        sitemap_submitted_indexed: sitemapSubmittedIndexed,
        sitemap_missing: sitemapMissing,
        sitemap_unexpected: sitemapUnexpected,
        with_impressions: indexed.length,
        no_impressions: noImpressions.length,
        no_impressions_sample: noImpressions.slice(0, 12),
        inspection_sample: inspectionSample,
        inspection_buckets: inspectionBuckets,
        genuine_blockers: blockers,
        page_checks: pageChecks,
        recovery,
      },
      opportunities: opportunities.slice(0, 20),
    });
  } catch (error) {
    return Response.json({ connected: false, reason: error.message });
  }
}