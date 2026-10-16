import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');

    let payload = {};
    try {
      payload = await req.json();
    } catch {
      payload = {};
    }
    const siteUrl = (payload.siteUrl || '').trim();

    // List verified properties
    const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!sitesRes.ok) {
      return Response.json({ error: `Google Search Console sites request failed (${sitesRes.status})` }, { status: 502 });
    }
    const sitesData = await sitesRes.json();
    const sites = (sitesData.sitesEntry || []).map((s) => s.siteEntry.siteUrl);
    if (!sites.length) {
      return Response.json({ error: 'No verified properties in this Search Console account' }, { status: 404 });
    }

    const target = siteUrl && sites.includes(siteUrl) ? siteUrl : sites[0];

    // Default window: last 28 days (GSC reporting lags ~2 days)
    const fmt = (d) => d.toISOString().slice(0, 10);
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - 2);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 27);

    const analyticsRes = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(target)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: fmt(start),
          endDate: fmt(end),
          dimensions: ['query', 'page'],
          rowLimit: 200,
        }),
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!analyticsRes.ok) {
      return Response.json({ error: `Search Analytics request failed (${analyticsRes.status})` }, { status: 502 });
    }
    const analyticsData = await analyticsRes.json();

    return Response.json({
      sites,
      siteUrl: target,
      startDate: fmt(start),
      endDate: fmt(end),
      keywords: (analyticsData.rows || []).map((r) => ({
        query: r.keys[0],
        page: r.keys[1],
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: Math.round((r.ctr || 0) * 1000) / 10,
        position: Math.round((r.position || 0) * 10) / 10,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}