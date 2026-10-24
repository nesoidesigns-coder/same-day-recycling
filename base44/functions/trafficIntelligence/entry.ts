import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { buildTrafficReport, loadVisits, loadLeads, loadBookings } from '../../shared/trafficIntel.ts';

// AI Business Master: traffic & acquisition analysis over the reconciled,
// verified reporting layer. Admin-only. The model sees exactly the evidence
// the dashboards see (same shared module) and must cite real counts, respect
// confidence labels, and never invent numbers.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const [v, l, b] = await Promise.all([loadVisits(base44), loadLeads(base44), loadBookings(base44)]);
    const report = buildTrafficReport(v.rows, l.rows, b.rows);
    const w7 = report.windows['7d'];
    const w30 = report.windows['30d'];

    const compact = (w) => ({
      label: w.label,
      sessions: w.sessions,
      new_visitors: w.new_visitors,
      returning_visitors: w.returning_visitors,
      classes: w.classes,
      channels: w.channels,
      top_pages: w.top_pages,
      funnel_stages: w.funnel.stages.map((s) => ({ stage: s.label, count: s.count })),
      funnel_rates: w.funnel.rates,
      bookings: w.bookings,
      bookings_by_channel: w.bookings_by_channel,
      linked_bookings: w.linked_bookings,
      cities: w.cities,
      revenue: w.revenue,
      owner: w.owner,
      bots: w.bots,
      confidence: w.confidence,
    });

    const evidence = {
      reporting_timezone: report.tz,
      definitions_note: report.data_quality.definitions_note,
      attribution_note: report.data_quality.attribution_note,
      data_quality: {
        legacy_records_all_time: report.data_quality.legacy_records_all_time,
        unattributed_records_all_time: report.data_quality.unattributed_records_all_time,
        unclassified_records_all_time: report.data_quality.unclassified_records_all_time,
      },
      windows: { '7d': compact(w7), '30d': compact(w30) },
      daily_pageviews_last_30_days: report.daily.map((d) => ({ date: d.date, pageviews: d.pageviews, sessions: d.sessions })),
    };

    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the AI Business Master analyst for Same Day Recycling, a Canadian junk removal and recycling service network. Analyze the VERIFIED traffic and conversion evidence below (reporting time zone: America/Vancouver). Produce at most 6 insights covering: changes in acquisition performance, high-performing landing pages, weak conversion paths, unattributed traffic, contractor recruitment interest, geographic booking opportunities, and potential analytics failures.

STRICT RULES:
(1) Every statistical observation must cite the actual counts from the evidence.
(2) Respect the confidence labels: with very_low or low confidence denominators, call the finding a small-sample signal, never a trend.
(3) Never invent search volumes, dollar values, conversion numbers or traffic counts.
(4) Recommendations must be clearly labeled as advice, not fact.
(5) Flag where attribution is unavailable (legacy, unattributed or unclassified records) instead of guessing.
(6) Keep each insight short and specific to this business.

Verified evidence: ${JSON.stringify(evidence)}`,
      response_json_schema: {
        type: 'object',
        properties: {
          insights: {
            type: 'array',
            maxItems: 6,
            items: {
              type: 'object',
              properties: {
                kind: { type: 'string', enum: ['statistical_evidence', 'ai_recommendation'] },
                title: { type: 'string' },
                detail: { type: 'string' },
                evidence: { type: 'string' },
              },
              required: ['kind', 'title', 'detail'],
            },
          },
        },
        required: ['insights'],
      },
    });

    return Response.json({
      insights: (ai && ai.insights) || [],
      generated_at: new Date().toISOString(),
      evidence_basis: { windows: ['7d', '30d'], tz: report.tz, record_counts: { visits: v.rows.length, quote_leads: l.rows.length, bookings: b.rows.length } },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}