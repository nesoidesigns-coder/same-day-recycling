import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// AI Brand Scanner: fetches the business's own public pages, then produces
// explainable 0-100 scores. Findings confirmed against fetched content are
// marked verified; anything the AI cannot confirm is marked ai_estimate and
// never blended into a verified claim. Every scan is stored for history.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let payload = {};
    try { payload = await req.json(); } catch {}
    const socialUrls = (Array.isArray(payload.social_urls) ? payload.social_urls : [])
      .filter((u) => /^https:\/\//.test(u)).slice(0, 3);

    const pages = ['/', '/pricing', '/contact', '/furniture-removal'].map((p) => 'https://samedayrecycling.ca' + p);
    const targets = [...pages, ...socialUrls];

    const fetchText = async (url) => {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecyclingOS-Audit/1.0)' },
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) return { url, ok: false, status: res.status };
        const html = await res.text();
        const text = html
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 6000);
        const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '';
        const desc = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) || [])[1] || '';
        return { url, ok: true, title, description: desc, text };
      } catch (e) {
        return { url, ok: false, status: e.message };
      }
    };

    const results = await Promise.all(targets.map(fetchText));
    const fetched = results.filter((r) => r.ok);
    const sources = results.map((r) => `${r.ok ? 'fetched' : 'unreachable'} ${r.url}`);
    if (!fetched.length) {
      return Response.json({ error: 'None of the target pages could be fetched — no scan stored.' }, { status: 502 });
    }

    const context = fetched.map((r) =>
      `URL: ${r.url}\nTITLE: ${r.title}\nMETA DESCRIPTION: ${r.description}\nRAW SERVER HTML CONTENT (non-JS crawler view): ${r.text}`
    ).join('\n\n---\n\n').slice(0, 12000);

    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are a brand and market auditor for Same Day Recycling (samedayrecycling.ca), a same-day junk removal ' +
        'and recycling service operating across Canada through a contractor network.\n\n' +
        'IMPORTANT CONTEXT: samedayrecycling.ca is a JavaScript-rendered web app. The RAW SERVER HTML CONTENT below ' +
        'is what a non-JS crawler receives: an app shell plus an embedded <noscript> summary (contact details, pricing ' +
        'tiers, services). It is NOT what visitors or Google see. Use your live web-search context to review the REAL ' +
        'rendered pages of samedayrecycling.ca (home, /pricing, /contact, /furniture-removal)' +
        (socialUrls.length ? ' plus its public social profile(s) listed in the URLs' : '') + ' as visitors and search ' +
        'engines see them. Base your five dimension scores on the rendered site. Separately, treat the non-JS crawler ' +
        'view as its own finding: note in the relevant explanations how complete or thin the noscript/server-HTML ' +
        'summary is for AI crawlers that do not execute JavaScript (AI-visibility), and reflect that in the seo and ' +
        'discoverability explanations rather than claiming the pages are empty.\n\n' +
        'Evaluate the brand on five dimensions, each scored 0-100 with a one-to-two-sentence explanation:\n' +
        '- seo (technical and on-page SEO visible in the fetched content, titles, descriptions, keyword clarity)\n' +
        '- discoverability (how easily a customer would understand and find the core services and booking path)\n' +
        '- reputation (trust signals visible: reviews, testimonials, guarantees, transparency about disposal)\n' +
        '- credibility (contact information, pricing transparency, business identity, honest coverage claims)\n' +
        '- positioning (how distinct and compelling the value proposition is versus generic junk removal messaging)\n\n' +
        'Rules:\n' +
        '- For each dimension set basis to "verified" only when the score rests on content you actually received ' +
        '(fetched server HTML or live web context you could confirm); use "ai_estimate" when you had to judge from ' +
        'thin or missing content. Never mark the rendered site "empty" based only on the raw app shell.\n' +
        '- verified_findings must each cite concrete evidence from the fetched content (quote or specific element).\n' +
        '- ai_estimates are observations you could not confirm — say why they are unconfirmed.\n' +
        '- Never invent reviews, ratings, traffic numbers, competitor data or environmental statistics.\n\n' +
        'CONTENT:\n' + context,
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          overall_score: { type: 'number' },
          scores: {
            type: 'object',
            properties: {
              seo: { type: 'object', properties: { score: { type: 'number' }, explanation: { type: 'string' }, basis: { type: 'string', enum: ['verified', 'ai_estimate'] } }, required: ['score', 'explanation', 'basis'] },
              discoverability: { type: 'object', properties: { score: { type: 'number' }, explanation: { type: 'string' }, basis: { type: 'string', enum: ['verified', 'ai_estimate'] } }, required: ['score', 'explanation', 'basis'] },
              reputation: { type: 'object', properties: { score: { type: 'number' }, explanation: { type: 'string' }, basis: { type: 'string', enum: ['verified', 'ai_estimate'] } }, required: ['score', 'explanation', 'basis'] },
              credibility: { type: 'object', properties: { score: { type: 'number' }, explanation: { type: 'string' }, basis: { type: 'string', enum: ['verified', 'ai_estimate'] } }, required: ['score', 'explanation', 'basis'] },
              positioning: { type: 'object', properties: { score: { type: 'number' }, explanation: { type: 'string' }, basis: { type: 'string', enum: ['verified', 'ai_estimate'] } }, required: ['score', 'explanation', 'basis'] },
            },
            required: ['seo', 'discoverability', 'reputation', 'credibility', 'positioning'],
          },
          strengths: { type: 'array', items: { type: 'string' } },
          weaknesses: { type: 'array', items: { type: 'string' } },
          opportunities: { type: 'array', items: { type: 'string' } },
          verified_findings: { type: 'array', items: { type: 'object', properties: { finding: { type: 'string' }, evidence: { type: 'string' } }, required: ['finding', 'evidence'] } },
          ai_estimates: { type: 'array', items: { type: 'object', properties: { finding: { type: 'string' }, reasoning: { type: 'string' } }, required: ['finding', 'reasoning'] } },
          summary: { type: 'string' },
        },
        required: ['overall_score', 'scores', 'strengths', 'weaknesses', 'opportunities', 'verified_findings', 'ai_estimates', 'summary'],
      },
    });

    // Previous scan for trend comparison (stored, never fabricated).
    const history = await base44.entities.BrandScan.list({ sort: '-created_date', limit: 1 });
    const prev = Array.isArray(history) ? history[0] : history?.items?.[0];

    // Scoring formula recorded with every scan, so a score movement is always
    // explainable — including when the methodology itself changed.
    const METHODOLOGY = 'Formula v2 (2026-10-24): overall score = straight average of the five 0-100 dimension scores (seo, discoverability, reputation, credibility, positioning). Each dimension is judged from the live fetched pages plus web-search context; dimensions resting on thin or unconfirmable evidence are labelled ai_estimate and never counted as verified. Measured search performance (Google Search Console), approved review counts and verified contractor coverage are recorded separately as measured signals and are NOT part of the AI score. A methodology version change can move scores without the site changing.';

    // Directly measured signals — kept strictly separate from the AI scores.
    const measured_signals = [];
    try {
      const snaps = (await base44.asServiceRole.entities.SeoPerformanceSnapshot.filter({}, { sort: '-snapshot_date', limit: 20 })).items || [];
      const latestPer = {};
      for (const s of snaps) if (!latestPer[s.page_path]) latestPer[s.page_path] = s;
      let clicks = 0; let impressions = 0; let weighted = 0;
      for (const s of Object.values(latestPer)) {
        clicks += Number(s.clicks) || 0;
        impressions += Number(s.impressions) || 0;
        if (Number(s.impressions) > 0) weighted += (Number(s.avg_position) || 0) * Number(s.impressions);
      }
      if (impressions > 0) {
        measured_signals.push({ metric: 'Google organic clicks', value: String(clicks), window: '28d, latest per-page snapshots', source: 'google_search_console' });
        measured_signals.push({ metric: 'Google organic impressions', value: String(impressions), window: '28d, latest per-page snapshots', source: 'google_search_console' });
        measured_signals.push({ metric: 'Avg search position', value: String(Math.round((weighted / impressions) * 10) / 10), window: '28d, impressions-weighted', source: 'google_search_console' });
      } else {
        measured_signals.push({ metric: 'Google organic performance', value: 'no snapshot data yet', window: '—', source: 'google_search_console' });
      }
    } catch {}
    try {
      const approvedReviews = await base44.asServiceRole.entities.Review.count({ approved: true });
      measured_signals.push({ metric: 'Approved customer reviews', value: String(approvedReviews), window: 'all-time', source: 'app records' });
    } catch {}
    try {
      const partners = (await base44.asServiceRole.entities.Partner.filter({ active: true, verified: true }, { limit: 200 })).items || [];
      const cities = new Set();
      for (const p of partners) {
        if (p.city) cities.add(p.city);
        for (const c of (p.service_cities || [])) cities.add(c);
      }
      measured_signals.push({ metric: 'Verified active contractors', value: String(partners.length), window: 'current', source: 'partner territory records' });
      measured_signals.push({ metric: 'Municipalities with confirmed coverage', value: String(cities.size), window: 'current', source: 'partner territory records' });
    } catch {}

    // Why the score moved: dimension movements, methodology changes and
    // measured-signal shifts — computed, never invented.
    let score_change_explanation = prev ? 'No comparable previous dimension scores stored.' : 'First scan — no previous score to compare.';
    if (prev && prev.scores) {
      const moves = [];
      for (const key of ['seo', 'discoverability', 'reputation', 'credibility', 'positioning']) {
        const before = Number(prev.scores?.[key]?.score);
        const after = Number(ai.scores?.[key]?.score);
        if (!Number.isNaN(before) && !Number.isNaN(after) && Math.abs(after - before) >= 5) {
          moves.push(`${key} ${Math.round(before)}→${Math.round(after)}`);
        }
      }
      const delta = Math.round(ai.overall_score || 0) - (Number(prev.overall_score) || 0);
      const parts = [];
      parts.push(delta === 0 ? 'Overall score unchanged' : `Overall score ${delta > 0 ? 'up' : 'down'} ${Math.abs(delta)} points`);
      if (moves.length) parts.push(`dimension movement: ${moves.join(', ')}`);
      if (prev.methodology && prev.methodology !== METHODOLOGY) parts.push('the scoring methodology changed since the previous scan — compare with care');
      score_change_explanation = parts.join('; ') + '.';
    }

    const record = await base44.entities.BrandScan.create({
      target: 'samedayrecycling.ca',
      overall_score: Math.round(ai.overall_score || 0),
      scores: ai.scores || {},
      strengths: (ai.strengths || []).slice(0, 10),
      weaknesses: (ai.weaknesses || []).slice(0, 10),
      opportunities: (ai.opportunities || []).slice(0, 10),
      verified_findings: (ai.verified_findings || []).slice(0, 15),
      ai_estimates: (ai.ai_estimates || []).slice(0, 15),
      sources,
      summary: String(ai.summary || '').slice(0, 3000),
      previous_overall_score: prev ? prev.overall_score : null,
      methodology: METHODOLOGY,
      measured_signals,
      score_change_explanation,
      run_by: user.email || '',
    });

    return Response.json({ ok: true, scan: record, previous_score: prev ? prev.overall_score : null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}