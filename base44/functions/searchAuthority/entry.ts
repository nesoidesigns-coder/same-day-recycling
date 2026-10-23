import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import {
  BUCKET_LABEL, FIXES, PRIORITY, bucketFor, expectedCanonicalPaths,
  fetchSitemap, inspectUrl, norm, parsePage, pathOf,
} from '../../shared/seoCore.ts';

// Search Authority report: 100% real Google Search Console data through the
// authorized google_search_console connector. Indexing verdicts come ONLY from
// the URL Inspection API's own response fields (coverageState, indexingState,
// robotsTxtState, verdict) — a page Google reports as unknown is shown as
// "Unknown to Google", never guessed to be blocked. When GSC is unreachable the
// report returns { connected: false } and the dashboard shows "Not connected".

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
    const sm = await fetchSitemap(sitemapBase);
    const sitemapPages = sm.pages;
    const sitemapError = sm.error;

    // Sitemap audit: every canonical, indexable service and location page must
    // be present. Extra entries are listed for review, never auto-removed.
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