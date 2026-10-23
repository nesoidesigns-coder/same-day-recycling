import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { dedupeObservations, summarizeDemand, currentPeriod } from '../../shared/demand.ts';
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
      prompt: `You are Rex, the market-intelligence analyst for Same Day Recycling (a Canadian junk removal / recycling platform).

Below is a JSON snapshot of verified, source-labeled demand observations plus the company's own measured capture and contractor coverage.

${JSON.stringify(dataSummary)}

Produce an executive-ready analysis. Rules you MUST follow:
- Every figure you cite must come from the JSON above. Never invent, extrapolate or round numbers into new totals.
- Clearly distinguish: (a) industry-wide search-demand ESTIMATES (not our performance), (b) Same Day Recycling's measured capture, (c) contractor coverage from platform records.
- Search-volume estimates are not bookings, market share, or revenue predictions.
- Never state that demand for a city exists unless an observation for that geography is on file.
- Relative-interest indices are never search counts.
- If the data is thin, say so plainly and analyze only what is defensible.

Return STRICT JSON with exactly this shape:
{
  "summary": "3-5 sentence executive summary grounded in the data, naming the period",
  "high_demand_categories": [{"category": "category label", "finding": "1-2 sentences citing on-file figures"}],
  "underserved_markets": [{"geography": "City or province name", "finding": "1-2 sentences, citing demand on file vs contractor coverage"}],
  "seasonal_opportunities": ["1-2 sentence observations grounded in period-over-period data, or 'not enough period coverage on file'"],
  "rising_terms": [{"term": "keyword", "finding": "1 sentence citing its recorded values"}],
  "contractor_recruitment": ["1-2 sentence recommendations grounded in demand-vs-coverage gaps"],
  "landing_page_recommendations": [{"location": "City, Province", "keyword": "keyword on file", "rationale": "1 sentence citing the recorded estimate"}]
}`,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          high_demand_categories: { type: 'array', items: { type: 'object', properties: { category: { type: 'string' }, finding: { type: 'string' } } } },
          underserved_markets: { type: 'array', items: { type: 'object', properties: { geography: { type: 'string' }, finding: { type: 'string' } } } },
          seasonal_opportunities: { type: 'array', items: { type: 'string' } },
          rising_terms: { type: 'array', items: { type: 'object', properties: { term: { type: 'string' }, finding: { type: 'string' } } } },
          contractor_recruitment: { type: 'array', items: { type: 'string' } },
          landing_page_recommendations: { type: 'array', items: { type: 'object', properties: { location: { type: 'string' }, keyword: { type: 'string' }, rationale: { type: 'string' } } } },
        },
        required: ['summary'],
      },
    });

    const analysis = llm.analysis || llm;
    const record = await svc.entities.DemandInsight.create({
      period: currentPeriod(),
      analysis,
      summary: String(analysis.summary || '').slice(0, 3000),
      generated_by: 'rex_ai',
      basis: `DemandObservation database (period ${industry.latest_period || 'none'}, basis ${(industry.volume_basis || []).join(', ') || 'n/a'}), latest DemandSnapshot capture, ${partners.length} active verified partners.`,
    });
    return Response.json({ ok: true, insight: record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}