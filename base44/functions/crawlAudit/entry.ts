import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Crawler-access audit: fetches the site exactly as a non-JS crawler
// (Googlebot without rendering, Bing, AI assistants) receives it, checks
// per-page crawlability signals, stores every run for history, records
// verified improvements between runs, and feeds confirmed metadata gaps
// into the SEO Action Engine as recommendations awaiting admin approval.
// Nothing is estimated: every finding comes from fetched HTML.

const SITE = 'https://samedayrecycling.ca';
const PAGES = [
  '/', '/pricing', '/contact',
  '/furniture-removal', '/junk-removal-vancouver', '/same-day-pickup',
  '/appliance-removal', '/electronics-recycling', '/commercial-recycling', '/blog',
];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let body = {};
    try { body = await req.json(); } catch {}
    const action = String(body.action || 'history');

    if (action === 'history') {
      const runs = (await base44.entities.CrawlAudit.filter({}, { sort: '-created_date', limit: 10 })).items || [];
      return Response.json({ runs, pages_audited: PAGES });
    }

    // ---- action === 'run' ----
    const prevRuns = (await base44.asServiceRole.entities.CrawlAudit.filter({}, { sort: '-created_date', limit: 1 })).items || [];
    const prev = prevRuns[0] || null;

    // robots.txt + sitemap.xml first (2 of the 6 parallel connections).
    const [robots, sitemap] = await Promise.all([
      fetchPlain(`${SITE}/robots.txt`),
      fetchPlain(`${SITE}/sitemap.xml`),
    ]);
    const robotsOk = robots.ok && /user-agent|sitemap/i.test(robots.text || '');
    const sitemapOk = sitemap.ok && /<urlset|<sitemapindex/i.test(sitemap.text || '');
    const sitemapUrls = sitemapOk ? (sitemap.text.match(/<loc>/gi) || []).length : 0;

    // Pages in batches of 4 (worker holds 6 connections; 4 + 2 above stays safe).
    const pages = [];
    for (let i = 0; i < PAGES.length; i += 4) {
      const batch = PAGES.slice(i, i + 4);
      const settled = await Promise.allSettled(batch.map(async (p) => {
        const res = await fetchPlain(`${SITE}${p}`);
        if (!res.ok) return { path: p, ok: false, http_status: res.status || 0, issues: ['unreachable'], word_count: 0 };
        return analyzePage(p, res.text);
      }));
      for (const s of settled) pages.push(s.status === 'fulfilled' ? s.value : { path: 'unknown', ok: false, http_status: 0, issues: ['fetch_error'], word_count: 0 });
    }

    const fetched = pages.filter((p) => p.ok);
    const issueCount = pages.reduce((n, p) => n + (p.issues || []).length, 0);

    // Stale-domain check: the custom domain is what crawlers index, but the
    // platform's published URL may serve a newer prerender. Rendered content
    // depth is compared so a lagging custom domain is caught, not guessed.
    const appOrigin = (req.headers.get('x-base44-app-url') || '').replace(/\/$/, '') || SITE;
    let domainStale = false;
    let platformUrl = SITE;
    if (appOrigin && appOrigin !== SITE) {
      const platHome = await fetchPlain(`${appOrigin}/`);
      const platWords = platHome.ok
        ? platHome.text.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length
        : 0;
      const domainHome = pages.find((p) => p.path === '/');
      if (platWords > 0 && domainHome?.ok && domainHome.word_count * 1.5 < platWords) domainStale = true;
      platformUrl = appOrigin;
    }

    // Verified improvements: an issue present in the previous run, absent now.
    const prevByPath = {};
    for (const p of (prev?.pages || [])) prevByPath[p.path] = p;
    const improvements = [];
    for (const p of pages) {
      const before = prevByPath[p.path];
      if (!before || !before.ok || !p.ok) continue;
      for (const issue of before.issues || []) {
        if (!(p.issues || []).includes(issue)) {
          improvements.push({ path: p.path, issue, note: `Verified resolved on rescan — present in the ${prev.run_date} run, absent now.` });
        }
      }
    }

    // Feed confirmed metadata gaps to the SEO Action Engine. A proposal is only
    // made when real stored copy exists (the page's own stored description) —
    // never drafted text invented for the page.
    let recommendationsCreated = 0;
    const today = new Date().toISOString().slice(0, 10);
    for (const p of pages) {
      if (!(p.issues || []).includes('missing_meta_description')) continue;
      let stored = null;
      try {
        if (p.path === '/junk-removal-vancouver') {
          const { items } = await base44.asServiceRole.entities.CitySeo.filter({ city: 'Vancouver' }, { limit: 1 });
          stored = items[0] || null;
        } else {
          const { items } = await base44.asServiceRole.entities.ServicePageMeta.filter({ path: p.path }, { limit: 1 });
          stored = items[0] || null;
        }
      } catch {}
      const proposedDescription = (stored?.seo_description || stored?.description || '').trim();
      const proposedTitle = (stored?.seo_title || stored?.title || '').trim();
      if (!proposedDescription) continue; // no real copy to propose — recorded as an audit issue only
      const dupes = (await base44.asServiceRole.entities.SeoRecommendation.filter(
        { page_path: p.path, status: 'pending_review' }, { limit: 5 }
      )).items || [];
      if (dupes.length) continue;
      await base44.asServiceRole.entities.SeoRecommendation.create({
        page_path: p.path,
        page_label: p.title ? p.title.slice(0, 120) : p.path,
        target_keyword: p.path === '/junk-removal-vancouver' ? 'junk removal vancouver' : p.path.replace(/^\//, '').replace(/-/g, ' ').trim() || 'same day recycling',
        kind: 'metadata',
        proposed_title: proposedTitle.slice(0, 120),
        proposed_description: proposedDescription.slice(0, 320),
        rationale: 'Crawler-access audit: the served HTML this page returns to non-JS crawlers has no meta description, while the page stores one. Google renders JavaScript, but Bing without rendering and many AI assistants read only the server HTML. Proposed text is the page\'s existing stored description — apply it in Dashboard SEO & GEO Meta tags so it ships in the server HTML.',
        gsc_context: '',
        status: 'pending_review',
        recommended_date: today,
      });
      recommendationsCreated += 1;
    }

    const status = fetched.length === PAGES.length ? 'success' : fetched.length > 0 ? 'partial' : 'failed';
    const run = await base44.entities.CrawlAudit.create({
      run_date: today,
      status,
      base_url: SITE,
      pages,
      issue_count: issueCount,
      robots_ok: robotsOk,
      sitemap_ok: sitemapOk,
      sitemap_urls: sitemapUrls,
      improvements,
      recommendations_created: recommendationsCreated,
      notes: `Audited ${PAGES.length} public pages from the server HTML (no JavaScript executed), plus robots.txt and sitemap.xml.` + (domainStale ? ` STALE DOMAIN: ${SITE} serves materially less rendered content than ${platformUrl} — the custom domain is behind the current deployment; crawlers see the older shell + summary version instead of the full pages.` : ''),
      domain_stale: domainStale,
      platform_url: platformUrl,
      error: status === 'failed' ? 'No page could be fetched.' : '',
    });

    return Response.json({ ok: true, run, improvements, recommendations_created: recommendationsCreated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function analyzePage(path, html) {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]?.trim() || '';
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)["']/i)
    || html.match(/<link[^>]+href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);
  const h1 = (html.match(/<h1[\s>]/gi) || []).length;
  const h2 = (html.match(/<h2[\s>]/gi) || []).length;
  const ld = (html.match(/application\/ld\+json/gi) || []).length;
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').length : 0;
  const internal = (html.match(/href=["'](?:\/[^"']*|https?:\/\/[^"']*samedayrecycling\.ca[^"']*)["']/gi) || []).length;

  const issues = [];
  if (!title) issues.push('missing_title');
  else if (title.length > 65) issues.push('title_too_long');
  if (!descMatch || !descMatch[1] || !descMatch[1].trim()) issues.push('missing_meta_description');
  else if (descMatch[1].length > 165) issues.push('description_too_long');
  if (!canonicalMatch) issues.push('missing_canonical');
  if (h1 === 0) issues.push('no_h1');
  if (words < 200) issues.push('thin_content');
  if (ld === 0) issues.push('no_structured_data');

  return {
    path,
    ok: true,
    http_status: 200,
    title,
    title_length: title.length,
    has_description: Boolean(descMatch && descMatch[1] && descMatch[1].trim()),
    description_length: descMatch ? (descMatch[1] || '').length : 0,
    has_canonical: Boolean(canonicalMatch),
    h1_count: h1,
    h2_count: h2,
    ld_json_blocks: ld,
    word_count: words,
    internal_links: internal,
    issues,
  };
}

async function fetchPlain(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecyclingOS-CrawlAudit/1.0; +https://samedayrecycling.ca)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return { ok: false, status: res.status, text: '' };
    return { ok: true, status: res.status, text: await res.text() };
  } catch (e) {
    return { ok: false, status: 0, text: '', error: e.message };
  }
}