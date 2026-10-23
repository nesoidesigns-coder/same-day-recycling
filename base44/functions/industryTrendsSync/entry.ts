import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { currentPeriod, previousPeriod } from '../../shared/demand.ts';

// Pulls the latest Google Trends relative-interest readings (Canada, last 30
// days) for the three tracked removal categories via live web research, and
// stores them as source-labeled DemandObservation records. Index values are
// interest samples (0-100), never search counts, and are only ever compared
// within the same comparison group.
const KEYWORDS = [
  { keyword: 'junk removal', category: 'junk_removal' },
  { keyword: 'furniture removal', category: 'furniture_removal' },
  { keyword: 'appliance removal', category: 'appliance_removal' },
];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const period = currentPeriod();
    const prevPeriod = previousPeriod(period);
    const today = new Date().toISOString().slice(0, 10);
    const comparisonGroup = `CA-${period}-30d`;

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Use Google Trends (Canada, trends.google.com) via web search to find the CURRENT search interest readings for three keywords: "junk removal", "furniture removal", and "appliance removal".

For EACH keyword report:
1. trend_index: the relative interest index (0-100) for Canada over roughly the last 30 days, where 100 = peak popularity of that keyword in Canada. Use the most recent Google Trends value you can actually find for Canada (worldwide values are not acceptable).
2. trend_direction: "rising", "steady", or "falling" versus the previous 30-day window.

IMPORTANT rules:
- These are Google Trends relative-interest indices, NOT search counts. Never estimate or invent a number of searches.
- If you cannot find a credible, current Google Trends reading for a keyword, leave it out of the results entirely and explain in retrieval_note. Do NOT guess a plausible-looking value.
- Base every number on the actual fetched sources.`,
      add_context_from_internet: true,
      model: 'gemini_3_8_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          categories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                keyword: { type: 'string' },
                trend_index: { type: 'number' },
                trend_direction: { type: 'string', enum: ['rising', 'steady', 'falling'] },
              },
              required: ['keyword'],
            },
          },
          retrieval_note: { type: 'string' },
        },
        required: ['categories'],
      },
    });

    const found = new Map();
    for (const row of (llm && llm.categories) || []) {
      const match = KEYWORDS.find((k) => String(row.keyword || '').toLowerCase().trim() === k.keyword);
      const idx = Number(row.trend_index);
      if (match && Number.isFinite(idx) && idx >= 0 && idx <= 100) {
        found.set(match.keyword, {
          ...match,
          trend_index: Math.round(idx * 10) / 10,
          trend_direction: ['rising', 'steady', 'falling'].includes(row.trend_direction) ? row.trend_direction : 'unknown',
        });
      }
    }

    const results = [];
    for (const spec of KEYWORDS) {
      const value = found.get(spec.keyword);
      const common = {
        trend_index: value ? value.trend_index : undefined,
        trend_direction: value ? value.trend_direction : 'unknown',
        metric_type: 'relative_interest',
        volume_basis: 'google_trends',
        source: 'Google Trends (live web research)',
        source_url: 'https://trends.google.com/trends',
        comparison_group: comparisonGroup,
        methodology_note: 'Relative interest index from Google Trends via live web research. 100 = peak interest for the keyword in Canada over the trailing 30 days. An index is not a search count.',
        last_updated: today,
      };
      const existing = await base44.entities.DemandObservation.filter(
        { keyword: spec.keyword, geo_key: 'CA', period },
        { limit: 50 }
      );
      if (existing.length > 0) {
        for (const rec of existing) {
          await base44.entities.DemandObservation.update(rec.id, common);
        }
      } else if (value) {
        await base44.entities.DemandObservation.create({
          keyword: spec.keyword,
          geo_type: 'national',
          geo_key: 'CA',
          service_category: spec.category,
          period,
          period_start: `${period}-01`,
          period_end: today,
          ...common,
        });
      }
      results.push({ keyword: spec.keyword, updated: Boolean(value), trend_index: value ? value.trend_index : null });
    }

    const upserted = results.filter((r) => r.updated).length;
    await base44.entities.DemandSyncLog.create({
      source: 'google_trends',
      status: upserted === KEYWORDS.length ? 'success' : upserted > 0 ? 'partial' : 'failed',
      run_date: today,
      records_upserted: upserted,
      period,
      coverage_note: `National (CA) relative-interest indices for ${upserted} of 3 keywords for ${period}. ${llm?.retrieval_note || ''}`.slice(0, 1000),
      next_update_cadence: 'On demand (manual refresh) · Google Trends updates daily',
    });

    return Response.json({ ok: true, period, previous_period: prevPeriod, results, retrieval_note: llm?.retrieval_note || '' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}