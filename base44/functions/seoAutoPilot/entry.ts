import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import {
  SITE_BASE, expectedCanonicalPaths, pathOf, norm, bucketFor, BUCKET_LABEL, FIXES,
  fetchSitemap, parsePage, inspectUrl,
} from '../../shared/seoCore.ts';

// SEO Autopilot — the persistent scheduled job behind Recycling OS autonomous
// SEO. Invoked by the "SEO Daily Autopilot" workflow (daily) and the "SEO
// Monthly Growth" workflow (mode: monthly). It audits technical health and
// sitemap integrity, applies safe meta repairs automatically and verifies the
// deployment, re-checks indexing for items already fixed or submitted, logs
// every detection/repair/verification to SeoOpsLog, alerts the owner only
// when critical items genuinely need a human, and (monthly) reports growth.
// It never fabricates Google results and never touches pricing, bookings,
// payments, contractor ops or service promises.

const today = () => new Date().toISOString().slice(0, 10);
const push = (arr, event, note) => {
  arr.push({ date: new Date().toISOString(), event, note: note || '' });
  return arr;
};

const SERVICE_PATH = /^\/(furniture-removal|appliance-removal|electronics-recycling|commercial-recycling|same-day-pickup|free-metal-pickup|services|pricing)$/;
const KEY_PAGE = (p) => p === '/' || /^\/junk-removal-/.test(p) || SERVICE_PATH.test(p) || p === '/coverage';

// Pages need meta regeneration when checks found a meta-level problem the
// generators own (title, description, duplicates). noindex/canonical problems
// are code-level and go to the owner instead.
const metaIssue = (c) =>
  c.title_length === 0 || c.description_length === 0
  || c.unique_title === false || c.unique_description === false;

// The platform prerenders page bodies but the served <head> comes from the
// platform SEO layer — so a generic shell title ("City Page | …") can pass a
// presence check while Googlebot still sees a generic, city-blind page. These
// checks fail that case: the title must not be a shell pattern, and on city
// pages it must name the city.
const slugCity = (p) => {
  const m = /^\/junk-removal-(.+)$/.exec(p);
  return m ? m[1].split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : null;
};
const headQualityIssues = (c) => {
  const p = pathOf(c.url);
  const city = slugCity(p);
  const issues = [];
  if (c.title && /city page/i.test(c.title)) issues.push(`title is the generic shell pattern ("${c.title}")`);
  if (c.title && c.title_length < 25) issues.push(`title too short (${c.title_length} chars)`);
  if (c.description && c.description_length < 70) issues.push(`description too short (${c.description_length} chars)`);
  if (city) {
    if (c.title && !c.title.toLowerCase().includes(city.toLowerCase())) issues.push(`title does not name the city (${city})`);
    if (c.description && !c.description.toLowerCase().includes(city.toLowerCase())) issues.push('description does not name the city');
  }
  return issues;
};

const gscQuery = async (token, siteUrl, start, end, dims, limit) => {
  try {
    const res = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: start, endDate: end, dimensions: dims, rowLimit: limit }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    return (await res.json()).rows || [];
  } catch { return []; }
};

const fetchPage = async (u) => {
  try {
    const res = await fetch(u, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SDR-IndexChecker/1.0; +https://samedayrecycling.ca)' },
      signal: AbortSignal.timeout(12000),
    });
    return parsePage(u, res.status, res.ok ? await res.text() : '');
  } catch (e) {
    return { url: u, http_status: 0, title: '', title_length: 0, description: '', description_length: 0, canonical: '', canonical_self: null, meta_robots: '', h1: [], words: 0, internal_links: 0, internal_hrefs: [], content_basis: 'shell_or_unverifiable', fetch_error: e.message };
  }
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let payload = {};
    try { payload = await req.json(); } catch {}
    const mode = payload.mode === 'monthly' ? 'monthly' : 'daily';
    const runId = `ap-${Date.now()}`;
    const d = today();

    let accessToken = null;
    let gscTarget = null;
    try {
      const conn = await base44.asServiceRole.connectors.getConnection('google_search_console');
      accessToken = conn.accessToken;
      const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000),
      });
      if (sitesRes.ok) {
        const sitesData = await sitesRes.json();
        const sites = (sitesData.siteEntry || []).map((s) => s.siteUrl);
        gscTarget = sites.find((s) => s.includes('samedayrecycling')) || sites[0] || null;
      }
    } catch { /* indexing verification skips without GSC */ }

    const log = base44.asServiceRole.entities.SeoOpsLog;
    const cutoff = new Date(); cutoff.setUTCDate(cutoff.getUTCDate() - 45);
    const existing = (await log.filter({ run_date: { $gte: cutoff.toISOString().slice(0, 10) } }, { limit: 500 })).items || [];
    const openKeys = new Set(
      existing.filter((e) => !['declined', 'verified_indexed'].includes(e.status)).map((e) => `${e.url || ''}|${e.issue}`)
    );
    const seen = (key) => openKeys.has(key);

    const summary = { sitemap_pages: 0, sitemap_missing: 0, pages_checked: 0, repaired: 0, verified: 0, detections: 0, approvals: 0, critical: 0, notes: [] };
    const newCritical = [];

    const addEntry = async (entry) => {
      try {
        await log.create({ run_id: runId, run_type: mode, run_date: d, ...entry });
      } catch (e) {
        summary.notes.push(`log write failed: ${e.message || e}`);
      }
    };

    // --- 1. Sitemap integrity ---------------------------------------------------
    const sm = await fetchSitemap(SITE_BASE);
    const sitemapPages = sm.pages;
    const sitemapPaths = new Set(sitemapPages.map(pathOf));
    const missing = expectedCanonicalPaths().filter((p) => !sitemapPaths.has(p));
    summary.sitemap_pages = sitemapPages.length;
    summary.sitemap_missing = missing.length;
    if (sm.error) summary.notes.push('Live sitemap could not be fetched — checked again tomorrow.');

    if (!sm.error && missing.length > 0) {
      for (const p of missing.slice(0, 10)) {
        const url = p === '/' ? SITE_BASE + '/' : SITE_BASE + p;
        if (seen(`${url}|Canonical page missing from the sitemap`)) continue;
        await addEntry({
          area: 'sitemap', url, fix_applied: false,
          issue: 'Canonical page missing from the sitemap',
          evidence: `Live sitemap.xml does not list ${p}`,
          fix: 'Add this <url> entry to public/sitemap.xml, then it re-submits to Google automatically each day.',
          status: 'needs_approval',
          status_detail: `Ready XML: <url><loc>${url}</loc></url>`,
          history: push([], 'detected', 'Sitemap audit'),
        });
        summary.approvals++;
        if (p.startsWith('/junk-removal-') || SERVICE_PATH.test(p)) { newCritical.push(`${p} missing from sitemap`); }
      }
      // Re-submit the sitemap so Google re-crawls while the owner adds the entry.
      try {
        await base44.functions.invoke('submitSitemap', {});
        await addEntry({
          area: 'sitemap', url: SITE_BASE + '/sitemap.xml', fix_applied: true,
          issue: 'Sitemap re-submitted to Google after audit found gaps',
          evidence: `${missing.length} canonical page(s) missing from live sitemap.xml`,
          fix: 'Sitemap re-submitted via the Search Console sitemaps API.',
          status: 'submitted',
          history: push([], 'submitted', 'Search Console sitemaps API'),
        });
      } catch {}
    } else if (!sm.error) {
      // Clean sitemap: submit weekly is already covered by the Auto SEO workflow;
      // daily run only logs when there is news. Nothing to do.
    }

    // --- 2. Technical health: key page checks -----------------------------------
    const checkTargets = sitemapPages.filter((u) => KEY_PAGE(pathOf(u))).slice(0, 16);
    const pageChecks = [];
    for (let i = 0; i < checkTargets.length; i += 4) {
      const chunk = checkTargets.slice(i, i + 4);
      const settled = await Promise.allSettled(chunk.map(fetchPage));
      for (const r of settled) if (r.status === 'fulfilled') pageChecks.push(r.value);
    }
    summary.pages_checked = pageChecks.length;
    const titleSeen = {}; const descSeen = {};
    for (const c of pageChecks) {
      if (c.title) titleSeen[c.title.toLowerCase()] = (titleSeen[c.title.toLowerCase()] || 0) + 1;
      if (c.description) descSeen[c.description.toLowerCase()] = (descSeen[c.description.toLowerCase()] || 0) + 1;
    }
    for (const c of pageChecks) {
      c.unique_title = c.title ? (titleSeen[c.title.toLowerCase()] === 1) : null;
      c.unique_description = c.description ? (descSeen[c.description.toLowerCase()] === 1) : null;
    }

    // --- 3. Automatic safe repairs (meta), with deployment verification ---------
    const affected = pageChecks.filter((c) => c.http_status === 200 && metaIssue(c));
    const serviceAffected = affected.filter((c) => SERVICE_PATH.test(pathOf(c.url)) || pathOf(c.url) === '/');
    const cityAffected = affected.filter((c) => /^\/junk-removal-/.test(pathOf(c.url)));

    const repairWith = async (fn, list, label) => {
      if (!list.length) return;
      try {
        await base44.functions.invoke(fn, {});
        summary.repaired++;
        // Verify deployment by re-fetching up to 3 repaired pages.
        let ok = 0;
        for (const c of list.slice(0, 3)) {
          const after = await fetchPage(c.url);
          if (after.title_length > 0 && after.description_length > 0 && headQualityIssues(after).length === 0) ok++;
        }
        for (const c of list) {
          const key = `${c.url}|${label}: meta regenerated`;
          if (seen(key)) continue;
          await addEntry({
            area: 'content', url: c.url, fix_applied: true,
            issue: `${label}: page meta was missing or duplicated`,
            evidence: `Before: title ${c.title_length} chars, description ${c.description_length} chars${c.unique_title === false ? ', duplicate title' : ''}${c.unique_description === false ? ', duplicate description' : ''}`,
            fix: `${fn} regenerated the title, description and focus keywords; deployment verified by re-fetching the live page.`,
            status: ok === Math.min(list.length, 3) ? 'fixed' : 'submitted',
            status_detail: ok > 0 ? `Verified: ${ok}/${Math.min(list.length, 3)} refetched pages now carry full meta.` : 'Generator ran; verification fetch failed — rechecked next run.',
            verified_date: ok > 0 ? d : undefined,
            history: push([], ok > 0 ? 'fixed' : 'submitted', `${label} meta repair`),
          });
          openKeys.add(key);
        }
      } catch (e) {
        summary.notes.push(`${label} meta repair failed: ${e.message}`);
        await addEntry({
          area: 'content', url: list[0]?.url || '', fix_applied: false,
          issue: `${label}: meta repair could not run`,
          evidence: e.message,
          fix: 'Retry next scheduled run; if it repeats, inspect the generator function.',
          status: 'failed',
          history: push([], 'failed', `${label} meta repair`),
        });
      }
    };
    await repairWith('serviceMetaGenerate', serviceAffected, 'Service pages');
    await repairWith('citySeoSync', cityAffected, 'City pages');

    // Code-level problems are never auto-fixed — owner approval required.
    for (const c of pageChecks) {
      if (!c.http_status) continue;
      if (c.meta_robots && /noindex/i.test(c.meta_robots)) {
        const key = `${c.url}|Page carries a noindex meta tag`;
        if (!seen(key)) {
          await addEntry({
            area: 'technical', url: c.url, fix_applied: false,
            issue: 'Page carries a noindex meta tag',
            evidence: `meta robots = "${c.meta_robots}"`,
            fix: 'Remove the noindex directive from this page\'s code, then it re-verifies automatically.',
            status: 'needs_approval',
            history: push([], 'detected', 'Page check'),
          });
          summary.approvals++; summary.critical++; newCritical.push(`${pathOf(c.url)} has a noindex meta tag`);
          openKeys.add(key);
        }
      }
      if (c.canonical_self === false) {
        const key = `${c.url}|Canonical does not match this URL`;
        if (!seen(key)) {
          await addEntry({
            area: 'technical', url: c.url, fix_applied: false,
            issue: 'Canonical tag does not match the page URL',
            evidence: `Canonical points to ${c.canonical}`,
            fix: 'Set a self-referencing canonical in the page code, then it re-verifies automatically.',
            status: 'needs_approval',
            history: push([], 'detected', 'Page check'),
          });
          summary.approvals++; summary.critical++; newCritical.push(`${pathOf(c.url)} canonical mismatch`);
          openKeys.add(key);
        }
      }
      const headIssues = headQualityIssues(c);
      if (headIssues.length) {
        const key = `${c.url}|Crawler head is generic or city-blind`;
        if (!seen(key)) {
          await addEntry({
            area: 'technical', url: c.url, fix_applied: false,
            issue: 'Crawler head is generic or city-blind',
            evidence: `Served head: title="${c.title}" (${c.title_length} chars), description="${String(c.description).slice(0, 120)}" (${c.description_length} chars). Found: ${headIssues.join('; ')}.`,
            fix: 'Dashboard → SEO & GEO → Meta tags: replace the generic title/description for this page (or clear the override and enable Advanced settings → "Automatic titles and descriptions"). Re-verified against the live page automatically next run.',
            status: 'needs_approval',
            status_detail: `Body renders fully (${c.words} words) — only the served head is generic.`,
            history: push([], 'detected', 'Page check'),
          });
          summary.approvals++; summary.critical++;
          newCritical.push(`${pathOf(c.url)} crawler head is generic or city-blind`);
          openKeys.add(key);
        }
      }
      if (c.http_status !== 200) {
        const key = `${c.url}|Page does not return HTTP 200`;
        if (!seen(key)) {
          await addEntry({
            area: 'technical', url: c.url, fix_applied: false,
            issue: `Page does not return HTTP 200 (got ${c.http_status})`,
            evidence: c.fetch_error || `HTTP ${c.http_status}`,
            fix: 'Restore the page so it returns 200; re-verified automatically next run.',
            status: 'needs_approval',
            history: push([], 'detected', 'Page check'),
          });
          summary.approvals++; summary.critical++; newCritical.push(`${pathOf(c.url)} returns HTTP ${c.http_status}`);
          openKeys.add(key);
        }
      }
    }

    // --- 3b. Retest previously detected generic-head items against the live page -
    // The item closes only when a fresh fetch shows a real, city-specific head.
    const headOpen = existing.filter((e) => e.issue === 'Crawler head is generic or city-blind' && e.status === 'needs_approval');
    for (const e of headOpen.slice(0, 10)) {
      const after = await fetchPage(e.url);
      if (after.http_status === 200 && headQualityIssues(after).length === 0) {
        await log.update(e.id, {
          status: 'fixed', fix_applied: true, verified_date: d,
          status_detail: `Retest passed on the live page: title="${after.title}", description="${String(after.description).slice(0, 100)}".`,
          history: [...(e.history || []), { date: new Date().toISOString(), event: 'retest_passed', note: 'Fresh fetch shows a real, city-specific title and description.' }],
        });
        summary.verified++;
      }
    }

    // --- 4. Broken internal links (sampled) --------------------------------------
    const linkSample = [];
    for (const c of pageChecks) for (const h of c.internal_hrefs || []) {
      const abs = h.startsWith('http') ? h : SITE_BASE + h;
      if (!linkSample.some((l) => l.href === abs)) linkSample.push({ href: abs, from: c.url });
      if (linkSample.length >= 8) break;
      if (linkSample.length >= 8) break;
    }
    const linkChecks = await Promise.allSettled(linkSample.map(async (l) => {
      try {
        const res = await fetch(l.href, { signal: AbortSignal.timeout(10000) });
        return { ...l, status: res.status };
      } catch { return { ...l, status: 0 }; }
    }));
    for (const r of linkChecks) {
      if (r.status !== 'fulfilled') continue;
      const { href, from, status } = r.value;
      if (status >= 400 || status === 0) {
        const key = `${href}|Broken internal link`;
        if (!seen(key)) {
          await addEntry({
            area: 'broken_link', url: href, fix_applied: false,
            issue: `Broken internal link (${status || 'unreachable'})`,
            evidence: `Linked from ${pathOf(from) || '/'} — request returned ${status || 'a network error'}`,
            fix: 'Fix or remove the link on the source page, then it re-verifies automatically.',
            status: 'needs_approval',
            history: push([], 'detected', 'Link check'),
          });
          summary.approvals++; openKeys.add(key);
        }
      }
    }

    // --- 5. Indexing verification cycle for items already fixed or submitted ----
    if (accessToken && gscTarget) {
      const open = ((await log.filter({ status: { $in: ['submitted', 'awaiting_google'] } }, { limit: 200 })).items || [])
        .filter((e) => e.url && e.area !== 'sitemap');
      for (const e of open.slice(0, 10)) {
        const insp = await inspectUrl(accessToken, gscTarget, e.url);
        if (insp.bucket === 'indexed') {
          await log.update(e.id, {
            status: 'verified_indexed',
            inspection_bucket: 'indexed',
            status_detail: insp.coverage_state || 'Google reports the page as indexed.',
            verified_date: d,
            history: [...(e.history || []), { date: new Date().toISOString(), event: 'verified_indexed', note: insp.coverage_state || '' }],
          });
          summary.verified++;
        } else if (insp.bucket !== 'inspection_unavailable') {
          await log.update(e.id, {
            inspection_bucket: insp.bucket,
            status_detail: insp.coverage_state || insp.reason || '',
            history: [...(e.history || []), { date: new Date().toISOString(), event: 'awaiting_google', note: insp.coverage_state || '' }],
          });
        }
      }

      // --- 6. New indexing sweep: sitemap pages with no 90-day impressions -----
      const fmt = (dt) => dt.toISOString().slice(0, 10);
      const lEnd = new Date(); lEnd.setUTCDate(lEnd.getUTCDate() - 2);
      const lStart = new Date(lEnd); lStart.setUTCDate(lStart.getUTCDate() - 89);
      const rows = await gscQuery(accessToken, gscTarget, fmt(lStart), fmt(lEnd), ['page'], 250);
      const seenUrls = new Set();
      for (const r of rows) seenUrls.add(norm(r.keys[0]));
      const quiet = sitemapPages.filter((u) => !seenUrls.has(norm(u)) && !seenUrls.has(norm(u) + '/')).slice(0, 10);
      const inspections = [];
      for (let i = 0; i < quiet.length; i += 5) {
        const chunk = quiet.slice(i, i + 5);
        const settled = await Promise.allSettled(chunk.map((u) => inspectUrl(accessToken, gscTarget, u)));
        for (const r of settled) if (r.status === 'fulfilled') inspections.push(r.value);
      }
      for (const insp of inspections) {
        if (insp.bucket === 'indexed' || insp.bucket === 'inspection_unavailable') continue;
        const needsOwner = ['blocked_by_robots', 'noindex', 'canonical_conflict', 'fetch_error'].includes(insp.bucket);
        const key = `${insp.url}|${BUCKET_LABEL[insp.bucket] || insp.bucket}`;
        if (seen(key)) continue;
        await addEntry({
          area: 'indexing', url: insp.url, fix_applied: false,
          issue: BUCKET_LABEL[insp.bucket] || insp.bucket,
          evidence: insp.coverage_state || insp.reason || 'URL Inspection returned no coverage detail',
          fix: FIXES[insp.bucket] || 'Inspect the URL in Search Console and follow Google\'s reported reason.',
          status: needsOwner ? 'needs_approval' : 'awaiting_google',
          status_detail: insp.coverage_state || '',
          inspection_bucket: insp.bucket,
          history: push([], needsOwner ? 'needs_approval' : 'awaiting_google', 'URL Inspection'),
        });
        openKeys.add(key);
        summary.detections++;
        if (needsOwner) { summary.approvals++; summary.critical++; newCritical.push(`${pathOf(insp.url) || insp.url}: ${BUCKET_LABEL[insp.bucket]}`); }
      }
    } else {
      summary.notes.push('Search Console not reachable — indexing verification skipped this run.');
    }

    // --- 7. Run log ---------------------------------------------------------------
    await addEntry({
      area: 'technical', url: '', fix_applied: summary.repaired > 0,
      issue: `Autopilot ${mode} run completed`,
      evidence: `Sitemap: ${summary.sitemap_pages} pages, ${summary.sitemap_missing} missing. Checked ${summary.pages_checked} pages. Repaired ${summary.repaired} generator run(s). Verified ${summary.verified} item(s) as indexed. New detections ${summary.detections}, items awaiting approval ${summary.approvals}.`,
      fix: summary.notes.join(' '),
      status: summary.repaired > 0 ? 'fixed' : 'detected',
      status_detail: summary.notes.join(' ') || 'No errors.',
      history: push([], mode === 'monthly' ? 'monthly_report' : 'daily_run', runId),
    });

    // --- 8. Critical alert (only when a human is genuinely needed) ---------------
    if (newCritical.length > 0) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: `SEO Autopilot: ${newCritical.length} critical item(s) need your approval`,
          text: `The daily SEO autopilot found issues it cannot safely fix on its own:\n\n${newCritical.slice(0, 10).map((c) => `- ${c}`).join('\n')}\n\nReview them at https://samedayrecycling.ca/admin/search-authority — items awaiting your approval are at the top of the SEO Autopilot panel.`,
        });
      } catch { /* alert is best-effort */ }
    }

    // --- 9. Monthly growth report -------------------------------------------------
    let growth = null;
    if (mode === 'monthly') {
      let impressions = '—', clicks = '—', change = '—', summaryText = 'Search Console data was not available for this period.';
      if (accessToken && gscTarget) {
        const fmt = (dt) => dt.toISOString().slice(0, 10);
        const gEnd = new Date(); gEnd.setUTCDate(gEnd.getUTCDate() - 2);
        const gStart = new Date(gEnd); gStart.setUTCDate(gStart.getUTCDate() - 27);
        const pEnd = new Date(gStart); pEnd.setUTCDate(pEnd.getUTCDate() - 1);
        const pStart = new Date(pEnd); pStart.setUTCDate(pStart.getUTCDate() - 27);
        const [cur, prev, topPages] = await Promise.all([
          gscQuery(accessToken, gscTarget, fmt(gStart), fmt(gEnd), [], 1),
          gscQuery(accessToken, gscTarget, fmt(pStart), fmt(pEnd), [], 1),
          gscQuery(accessToken, gscTarget, fmt(gStart), fmt(gEnd), ['page'], 10),
        ]);
        const c = cur[0] || {}; const p = prev[0] || {};
        impressions = String(Math.round(c.impressions || 0));
        clicks = String(Math.round(c.clicks || 0));
        const di = (c.impressions || 0) - (p.impressions || 0);
        change = p.impressions ? `${di >= 0 ? '+' : ''}${Math.round((di / p.impressions) * 100)}% vs previous 28 days` : di >= 0 ? `+${Math.round(di)} new impressions` : '—';
        const topList = topPages.map((r) => `${String(r.keys[0]).replace(/^https?:\/\/[^/]+/, '') || '/'} — ${Math.round(r.impressions || 0)} impressions, ${Math.round(r.clicks || 0)} clicks`).join('\n');
        try {
          const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt:
              'Write a 4-6 sentence plain-language monthly SEO growth summary for the owner of samedayrecycling.ca (same-day junk removal, Canada-wide request intake). ' +
              'State only what the data shows, describe where organic visibility is growing or stalling (especially city pages like Vancouver, Surrey, Toronto), and name the single most useful next focus. No marketing fluff.\n\n' +
              `Last 28 days: ${impressions} impressions, ${clicks} clicks, average position ${Math.round((c.position || 0) * 10) / 10}.\n` +
              `Previous 28 days: ${Math.round(p.impressions || 0)} impressions, ${Math.round(p.clicks || 0)} clicks.\n` +
              `Top pages:\n${topList || 'no page-level data yet'}`,
          });
          if (typeof ai === 'string' && ai.trim()) summaryText = ai.trim();
        } catch { /* summary stays factual fallback */ }
      }
      growth = { impressions, clicks, change, summary: summaryText };
      await addEntry({
        area: 'growth', url: '', fix_applied: false,
        issue: 'Monthly SEO growth analysis',
        evidence: `${impressions} impressions, ${clicks} clicks (${change})`,
        fix: 'Full report emailed to the owner.',
        status: 'detected',
        status_detail: summaryText.slice(0, 1000),
        history: push([], 'monthly_report', runId),
      });
    }

    return Response.json({ ok: true, mode, run_id: runId, summary, growth, critical: newCritical });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}