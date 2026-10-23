import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { dedupeObservations, summarizeDemand, CATEGORY_LABELS, PROVINCES } from '../../shared/demand.ts';
import { isTestPartner } from '../../shared/coverageStatus.ts';

// Admin-only: Rex analyzes the demand database and produces clearly-labeled
// AI estimates (never presented as verified data) across high-demand
// categories, underserved markets, seasonal patterns, rising terms,
// contractor recruitment and landing-page opportunities.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const svc = base44.asServiceRole;

    let rows = [];
    let cursor = undefined;
    for (let i = 0; i < 12; i++) {
      const page = await svc.entities.DemandObservation.list({ limit: 500, cursor });
      rows = rows.concat(page.items || []);
      if (!page.has_more) break;
      cursor = page.next_cursor;
    }
    const deduped = dedupeObservations(rows);
    const industry = summarizeDemand(deduped);

    const snaps = await svc.entities.DemandSnapshot.list({ sort: '-refreshed_at', limit: 1 });
    const capture = snaps.items?.[0]?.capture || {};
    const partnerPage = await svc.entities.Partner.list({ limit: 500 });
    const partners = (partnerPage.items || []).filter((p) => p.active && !isTestPartner(p));
    const coveredCities = [...new Set(partners.map((p) => String(p.city || '').trim()).filter(Boolean))];

    const dataSummary = {
      industry_available: industry.available,
      latest_period: industry.latest_period || 'none',
      total_est_monthly_searches: industry.total_est_monthly_searches || 0,
      volume_basis: industry.volume_basis || [],
      by_category: industry.by_category || [],
      fastest_growing: industry.fastest_growing || [],
      by_province: industry.by_province || [],
      by_city: industry.by_city || [],
      top_keywords: industry.top_keywords || [],
      periods_on_file: industry.periods || [],
      capture: {
        gsc: capture.gsc || null,
        ga: capture.ga || null,
        recycling_os: capture.recycling_os || null,
      },
      coverage: { available_contractors: partners.length, covered_cities: coveredCities },
      provinces: PROVINCES.map(([code, name]) => `${code} ${name}`),
    };

    const llm = await svc.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      prompt: `You are Rex, the market-intelligence analyst for Same Day Recycling, a Canadian junk-removal and recycling dispatch platform. Analyze the demand data below and produce business analysis.

DATA (JSON):
${JSON.stringify(dataSummary)}

Rules:
- Every output item is an AI ESTIMATE, not verified fact. Phrase recommendations in plain business English.
- If industry demand data is unavailable or thin, say so explicitly and base analysis on what exists (capture data, coverage, keyword patterns).
- Underserved markets = geographies with meaningful demand signals (or clear keyword patterns) but few/no covered cities on file. Never claim a market's absolute size without a recorded volume.
- Seasonal opportunities must reference actual period data on file if any; otherwise mark as hypothesis.
- Landing-page recommendations must name a specific city or province and a specific service keyword already present in the data.
- Contractor recruitment: name the cities/categories where demand signals and thin contractor coverage align.
- Be specific and concise. 3-6 items per list maximum. Canadian spelling where natural.`,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string', description: '3-5 sentence executive summary of the demand landscape.' },
          high_demand_categories: { type: 'array', items: { type: 'object', properties: { category: { type: 'string' }, finding: { type: 'string' } }, required: ['category', 'finding'] } },
          underserved_markets: { type: 'array', items: { type: 'object', properties: { geography: { type: 'string' }, finding: { type: 'string' } }, required: ['geography', 'finding'] } },
          seasonal_opportunities: { type: 'array', items: { type: 'string' } },
          rising_terms: { type: 'array', items: { type: 'object', properties: { term: { type: 'string' }, finding: { type: 'string' } }, required: ['term', 'finding'] } },
          contractor_recruitment: { type: 'array', items: { type: 'string' } },
          landing_page_recommendations: { type: 'array', items: { type: 'object', properties: { location: { type: 'string' }, keyword: { type: 'string' }, rationale: { type: 'string' } }, required: ['location', 'keyword', 'rationale'] } },
        },
        required: ['summary', 'high_demand_categories', 'underserved_markets', 'seasonal_opportunities', 'rising_terms', 'contractor_recruitment', 'landing_page_recommendations'],
      },
    });

    const analysis = llm && typeof llm === 'object' ? llm : { summary: 'Analysis could not be generated.' };

    const record = await svc.entities.DemandInsight.create({
      period: industry.latest_period || 'none',
      analysis,
      summary: String(analysis.summary || '').slice(0, 3000),
      generated_by: 'rex_ai',
      basis: 'DemandObservation database + verified capture snapshot + contractor coverage, analyzed by AI. All outputs are AI estimates, not verified facts.',
    });

    return Response.json({ ok: true, insight: record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}