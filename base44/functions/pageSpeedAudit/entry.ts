import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { secrets } from 'base44:runtime';

// PageSpeed audit — runs a real Google PageSpeed Insights test (mobile and
// desktop) and optionally records the measured result on an Improvement in the
// Recycling OS improvement queue. Admin-only. Numbers are never estimated:
// anything Google didn't return is left blank.
const fmt = (r) => r
  ? `PSI ${r.strategy}: performance ${r.performance}, accessibility ${r.accessibility}, SEO ${r.seo}; FCP ${r.fcp}, LCP ${r.lcp}, Speed Index ${r.si}, TBT ${r.tbt}, CLS ${r.cls}`
  : '';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let payload = {};
    try { payload = await req.json(); } catch {}
    const url = String(payload.url || '').startsWith('http') ? payload.url : 'https://samedayrecycling.ca/';
    const improvementId = payload.improvement_id || null;

    const key = secrets.get('PAGESPEED_API_KEY');
    if (!key) return Response.json({ error: 'PAGESPEED_API_KEY is not set. Add it on the Secrets page.' }, { status: 500 });

    const run = async (strategy) => {
      const u = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance&category=accessibility&category=seo&key=${key}`;
      const res = await fetch(u, { signal: AbortSignal.timeout(120000) });
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`PSI ${strategy} returned HTTP ${res.status} ${detail.slice(0, 200)}`);
      }
      const j = await res.json();
      const lh = j.lighthouseResult || {};
      const cats = lh.categories || {};
      const audit = (id) => (lh.audits || {})[id] || {};
      return {
        strategy,
        performance: Math.round((cats.performance?.score || 0) * 100),
        accessibility: Math.round((cats.accessibility?.score || 0) * 100),
        seo: Math.round((cats.seo?.score || 0) * 100),
        fcp: audit('first-contentful-paint').displayValue || '',
        lcp: audit('largest-contentful-paint').displayValue || '',
        si: audit('speed-index').displayValue || '',
        tbt: audit('total-blocking-time').displayValue || '',
        cls: audit('cumulative-layout-shift').displayValue || '',
      };
    };

    // PSI throttles concurrent runs from one key — run the strategies sequentially.
    const results = [];
    for (const s of ['mobile', 'desktop']) {
      try { results.push(await run(s)); }
      catch (e) { results.push({ strategy: s, error: e.message }); }
    }

    const ok = results.filter((r) => r.performance != null);
    if (improvementId && ok.length) {
      const improvement = await base44.asServiceRole.entities.Improvement.get(improvementId);
      if (improvement) {
        const detail = ok.map(fmt).join(' | ');
        const first = ok[0];
        await base44.asServiceRole.entities.Improvement.update(improvementId, {
          after_result: detail.slice(0, 1000),
          verified_date: new Date().toISOString().slice(0, 10),
          status: first.performance >= 90 ? 'verified' : 'testing',
          history: [...(improvement.history || []), {
            date: new Date().toISOString(),
            event: 'psi_verified',
            note: detail.slice(0, 900),
          }],
        });
      }
    }

    return Response.json({ ok: true, url, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}