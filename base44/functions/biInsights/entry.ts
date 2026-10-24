import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';

// AI business insights for the Live BI dashboard. Input is the verified summary
// the dashboard itself renders (the businessIntel payload) — the model reasons
// only over those figures and labels every insight verified_data / estimate /
// prediction. No numbers are invented, stored or simulated.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const summary = body?.summary;
    if (!summary || typeof summary !== 'object' || Array.isArray(summary)) {
      return Response.json({ error: 'summary (object) required' }, { status: 400 });
    }
    const serialized = JSON.stringify(summary);
    if (serialized.length > 60000) {
      return Response.json({ error: 'Summary too large' }, { status: 400 });
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the business-intelligence analyst for Recycling OS (Same Day Recycling), a Canadian junk removal and recycling network. Analyze ONLY the verified metrics supplied below.

HARD RULES:
- Use only figures present in the supplied data. Never invent, estimate from memory, or extrapolate numbers into a finding.
- Cite the supplied value as evidence in every insight. Small denominators (under ~30 sessions/leads/bookings) make percentages fragile — say so when relevant.
- Label every insight with kind: "verified_data" (directly restates a supplied metric), "estimate" (your reasoning over the data), or "prediction" (forward-looking and clearly conditional).
- Return 5 to 8 insights, each practical and specific to a Canadian junk-removal operator.

Analyze for: high-interest service categories, cities generating customer demand, most effective referral channels, abandoned journeys (buying intent that never became a lead or booking), contractor coverage gaps, conversion bottlenecks, revenue opportunities, and search visibility improvements.

SUPPLIED VERIFIED DATA (JSON):
${serialized}`,
      response_json_schema: {
        type: 'object',
        properties: {
          insights: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                area: { type: 'string' },
                kind: { type: 'string', enum: ['verified_data', 'estimate', 'prediction'] },
                finding: { type: 'string' },
                evidence: { type: 'string' },
                recommendation: { type: 'string' },
                priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              },
              required: ['title', 'kind', 'finding', 'evidence', 'recommendation'],
            },
          },
        },
        required: ['insights'],
      },
    });

    return Response.json({ insights: result?.insights || [], generated_at: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}