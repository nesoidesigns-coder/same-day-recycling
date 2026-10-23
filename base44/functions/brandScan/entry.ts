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
      `URL: ${r.url}\nTITLE: ${r.title}\nMETA DESCRIPTION: ${r.description}\nCONTENT: ${r.text}`
    ).join('\n\n---\n\n').slice(0, 20000);

    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are a brand and market auditor for Same Day Recycling (samedayrecycling.ca), a same-day junk removal ' +
        'and recycling service operating across Canada through a contractor network. Below is live content fetched ' +
        'from its own pages' + (socialUrls.length ? ' plus its public social profile(s) listed in the URLs' : '') + '.\n\n' +
        'Evaluate the brand on five dimensions, each scored 0-100 with a one-to-two-sentence explanation:\n' +
        '- seo (technical and on-page SEO visible in the fetched content, titles, descriptions, keyword clarity)\n' +
        '- discoverability (how easily a customer would understand and find the core services and booking path)\n' +
        '- reputation (trust signals visible: reviews, testimonials, guarantees, transparency about disposal)\n' +
        '- credibility (contact information, pricing transparency, business identity, honest coverage claims)\n' +
        '- positioning (how distinct and compelling the value proposition is versus generic junk removal messaging)\n\n' +
        'Rules:\n' +
        '- For each dimension set basis to "verified" only when the score rests on content you actually received; ' +
        'use "ai_estimate" when you had to judge from thin or missing content.\n' +
        '- verified_findings must each cite concrete evidence from the fetched content (quote or specific element).\n' +
        '- ai_estimates are observations you could not confirm — say why they are unconfirmed.\n' +
        '- Never invent reviews, ratings, traffic numbers, competitor data or environmental statistics.\n\n' +
        'CONTENT:\n' + context,
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
      run_by: user.email || '',
    });

    return Response.json({ ok: true, scan: record, previous_score: prev ? prev.overall_score : null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}