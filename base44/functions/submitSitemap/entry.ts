import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const SITEMAP_URL = 'https://samedayrecycling.ca/sitemap.xml';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
    const auth = { Authorization: `Bearer ${accessToken}` };

    const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: auth, signal: AbortSignal.timeout(10000),
    });
    if (!sitesRes.ok) return Response.json({ error: `sites list failed: ${sitesRes.status}` }, { status: 502 });
    const sites = await sitesRes.json();
    const props = (sites.siteEntry || [])
      .filter((s) => s.siteUrl.includes('samedayrecycling'))
      .map((s) => s.siteUrl);

    const results = [];
    for (const prop of props) {
      const enc = encodeURIComponent(prop);
      const res = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${enc}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`,
        { method: 'PUT', headers: auth, signal: AbortSignal.timeout(10000) },
      );
      results.push({ property: prop, status: res.status, ok: res.ok });
    }
    return Response.json({ submitted: SITEMAP_URL, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}