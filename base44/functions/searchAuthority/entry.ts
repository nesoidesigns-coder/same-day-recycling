import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Search Authority report: 100% real Google Search Console data through the
// authorized google_search_console connector. When GSC is unreachable or has
// no verified property for this app, the report returns { connected: false }
// and the dashboard shows "Not connected" — figures are never estimated.
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

    // --- Index coverage: sitemap URLs vs 90-day GSC page impressions ----------
    // Evidence-based proxy: a sitemap URL with zero Search Console impressions
    // in 90 days is "not indexed or not ranking" — never an invented status.
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

    const longPageSet = {};
    for (const r of longPages) longPageSet[r.keys[0]] = { clicks: r.clicks || 0, impressions: r.impressions || 0 };

    const norm = (u) => String(u).replace(/\/$/, '');
    const indexed = [];
    const noImpressions = [];
    for (const u of sitemapPages) {
      const stats = longPageSet[u] || longPageSet[norm(u)] || longPageSet[norm(u) + '/'];
      if (stats && stats.impressions > 0) indexed.push({ page: u, clicks: stats.clicks, impressions: stats.impressions });
      else noImpressions.push(u);
    }

    // --- Opportunity monitor: ranked by business value, effort, confidence ----
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
        with_impressions: indexed.length,
        no_impressions: noImpressions.length,
        no_impressions_sample: noImpressions.slice(0, 12),
      },
      opportunities: opportunities.slice(0, 20),
    });
  } catch (error) {
    return Response.json({ connected: false, reason: error.message });
  }
}