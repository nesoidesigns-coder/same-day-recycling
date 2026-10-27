import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { dedupeObservations, summarizeDemand, currentPeriod, PROVINCES } from '../../shared/demand.ts';
import { detectMarkets } from '../../shared/demandTaxonomy.ts';
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
    const allDeduped = dedupeObservations(rows);
    // Market-relevance gate: the observation table samples every industry group
    // tracked (veterinary, dental, software...). Only keywords resolving to one
    // of the removal/recycling markets are analysed as this platform's demand;
    // everything else is excluded and reported, never merged into the figures.
    const deduped = allDeduped.filter(
      (r: any) => detectMarkets(`${r.keyword || ''} ${(r.close_variants || []).join(' ')}`, r.service_category || '').length > 0,
    );
    const excludedOffMarket = allDeduped.length - deduped.length;
    const industry = summarizeDemand(deduped);

    const snaps = await svc.entities.DemandSnapshot.list({ sort: '-refreshed_at', limit: 1 });
    const capture = snaps.items?.[0]?.capture || {};
    const partnerPage = await svc.entities.Partner.list({ limit: 500 });
    const partners = (partnerPage.items || []).filter((p) => p.active && !isTestPartner(p));
    const coveredCities = [...new Set(partners.map((p) => String(p.city || '').trim()).filter(Boolean))];

    // Report provenance. Every field here is read from stored records — no
    // period, refresh time or coverage figure is ever invented.
    const generatedAt = new Date().toISOString();
    const lastSourceRefresh = deduped.reduce((m, r) => {
      const stamp = String(r.retrieved_at || r.last_updated || '');
      return stamp > m ? stamp : m;
    }, String(snaps.items?.[0]?.refreshed_at || ''));
    const sourcesUsed = [...new Set(deduped.map((r) => r.provider || r.search_engine || r.source).filter(Boolean))];
    const geoCoverage = {
      provinces: new Set(deduped.map((r) => r.province_code).filter(Boolean)).size,
      cities: new Set(deduped.map((r) => r.city).filter(Boolean)).size,
      unresolved: deduped.filter((r) => !r.province_code && !r.city).length,
    };
    const missingData: string[] = [];
    if (!industry.latest_period) missingData.push('No reporting period is on file for the demand observations');
    if (!(industry.volume_basis || []).length) missingData.push('Observations carry no volume basis label (estimate type unrecorded)');
    if (!geoCoverage.provinces && !geoCoverage.cities) missingData.push('No geographic evidence on file: observations are national-level only, so no city or province can be named');
    if (!capture.gsc) missingData.push('Google Search Console capture is not available for this window');
    if (!capture.ga) missingData.push('Google Analytics capture is not available for this window');
    if (!coveredCities.length) missingData.push('No active verified contractor is on file, so coverage gaps cannot be measured');
    if (!deduped.length) missingData.push('The demand observation table is empty');
    // Confidence is a deterministic function of evidence volume, not an AI opinion.
    const confidence = !deduped.length || !industry.latest_period
      ? 'insufficient'
      : deduped.length >= 50 && geoCoverage.provinces >= 3 ? 'moderate'
      : 'low';

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
- If a question cannot be answered from the JSON, state which record is missing instead of concluding.

Answer these five questions explicitly:
1. What is happening? (measured activity and direction)
2. Where is it happening? (cities / provinces named only where an observation is on file)
3. Why does it matter? (customer need, operational and commercial implication)
4. How reliable is it? (which source, which limitation, which confidence)
5. What should we do next? (an action that cites the observation supporting it)

Return STRICT JSON with exactly this shape:
{
  "summary": "3-5 sentence national intelligence summary grounded in the data, naming the period or saying the period is unavailable",
  "high_demand_categories": [{"category": "category label", "finding": "1-2 sentences citing on-file figures"}],
  "underserved_markets": [{"geography": "City or province name", "finding": "1-2 sentences, citing demand on file vs contractor coverage"}],
  "seasonal_opportunities": ["1-2 sentence observations grounded in period-over-period data, or 'not enough period coverage on file'"],
  "rising_terms": [{"term": "keyword", "finding": "1 sentence citing its recorded values"}],
  "contractor_recruitment": ["1-2 sentence recommendations grounded in demand-vs-coverage gaps"],
  "landing_page_recommendations": [{"location": "City, Province", "keyword": "keyword on file", "rationale": "1 sentence citing the recorded estimate"}],
  "reliability": [{"claim": "the finding", "evidence": "the record and value behind it", "confidence": "high | moderate | low | insufficient"}],
  "next_actions": [{"action": "specific operational step", "because": "the observation that justifies it"}]
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
          reliability: { type: 'array', items: { type: 'object', properties: { claim: { type: 'string' }, evidence: { type: 'string' }, confidence: { type: 'string' } } } },
          next_actions: { type: 'array', items: { type: 'object', properties: { action: { type: 'string' }, because: { type: 'string' } } } },
        },
        required: ['summary'],
      },
    });

    const analysis = llm.analysis || llm;
    const record = await svc.entities.DemandInsight.create({
      // `period` is the DATA period the observations actually cover. When no
      // reporting period is on file it stays empty — the generation month is
      // recorded separately in generated_at and never substituted for it.
      period: industry.latest_period || '',
      data_period: industry.latest_period || '',
      generated_at: generatedAt,
      last_source_refresh: lastSourceRefresh,
      sources_used: sourcesUsed,
      record_count: deduped.length,
      geo_coverage: geoCoverage,
      confidence,
      missing_data: missingData,
      analysis,
      summary: String(analysis.summary || '').slice(0, 3000),
      generated_by: 'rex_ai',
      basis: `DemandObservation database (${deduped.length} in-market records, ${excludedOffMarket} off-market excluded, period ${industry.latest_period || 'unavailable'}, basis ${(industry.volume_basis || []).join(', ') || 'n/a'}), latest DemandSnapshot capture, ${partners.length} active verified partners.`,
    });
    return Response.json({ ok: true, insight: record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}