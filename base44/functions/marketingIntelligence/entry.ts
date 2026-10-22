import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const iso = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString();

const KINDS = {
  quote_lead: { entity: 'QuoteLead', label: 'Quote lead' },
  software_inquiry: { entity: 'SoftwareInquiry', label: 'Software inquiry' },
  white_label_lead: { entity: 'WhiteLabelLead', label: 'White-label lead' },
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const srole = base44.asServiceRole;
    const cutoff30 = iso(30);
    const cutoff7 = iso(7);
    const pendingFilter = { status: 'new', $or: [{ followup_count: 0 }, { followup_count: { $exists: false } }] };

    const count = async (entity, query) => {
      try { return await srole.entities[entity].count(query); } catch { return null; }
    };

    // Batch 1: traffic + pipeline counts
    const [visits30, visits7, bookings30, bookingsNew, quotes30, softwareNew, wlNew, appsNew, natNew, queriesRecent] = await Promise.allSettled([
      srole.entities.Visit.aggregate({ query: { created_date: { $gte: cutoff30 } }, groupBy: 'source' }),
      srole.entities.Visit.count({ created_date: { $gte: cutoff7 } }),
      srole.entities.Booking.count({ created_date: { $gte: cutoff30 } }),
      srole.entities.Booking.count({ status: 'new' }),
      srole.entities.QuoteLead.count({ created_date: { $gte: cutoff30 } }),
      srole.entities.SoftwareInquiry.count({ status: 'new' }),
      srole.entities.WhiteLabelLead.count({ status: 'new' }),
      srole.entities.ContractorApplication.count({ status: 'new' }),
      srole.entities.NationalRequest.count({ created_date: { $gte: cutoff30 } }),
      srole.entities.ServiceQuery.list({ sort: '-created_date', limit: 8 }),
    ]);

    // Batch 2: pending (un-chased) leads, up to 3 per kind
    const [pQuotes, pSoftware, pWl] = await Promise.allSettled([
      srole.entities.QuoteLead.filter(pendingFilter, { sort: '-created_date', limit: 3 }),
      srole.entities.SoftwareInquiry.filter(pendingFilter, { sort: '-created_date', limit: 3 }),
      srole.entities.WhiteLabelLead.filter(pendingFilter, { sort: '-created_date', limit: 3 }),
    ]);

    const pending = [];
    for (const [kind, res] of [['quote_lead', pQuotes], ['software_inquiry', pSoftware], ['white_label_lead', pWl]]) {
      const items = res.status === 'fulfilled' ? res.value.items || res.value || [] : [];
      for (const r of items.slice(0, 3)) {
        pending.push({ kind, id: r.id, label: KINDS[kind].label, name: r.company || r.name || r.contact_name || 'unnamed' });
      }
    }

    const val = (r, fallback) => (r.status === 'fulfilled' ? r.value : fallback);
    const metrics = {
      visits_30d_by_source: val(visits30, []),
      visits_last_7d: val(visits7, 0),
      bookings_last_30d: val(bookings30, 0),
      bookings_awaiting_first_action: val(bookingsNew, 0),
      quote_leads_last_30d: val(quotes30, 0),
      software_inquiries_new: val(softwareNew, 0),
      white_label_leads_new: val(wlNew, 0),
      contractor_applications_new: val(appsNew, 0),
      national_requests_last_30d: val(natNew, 0),
      recent_customer_questions: (val(queriesRecent, { items: [] }).items || []).map((q) => q.query_text || ''),
      pending_outreach_leads: pending,
    };

    const ai = await srole.integrations.Core.InvokeLLM({
      prompt:
        'You are the AI marketing advisor for Same Day Recycling, a same-day junk removal and recycling company in Canada that also sells a white-label booking platform (Recycling OS) and contractor network memberships. ' +
        'Using ONLY the real metrics provided below, produce a marketing action plan: ' +
        '1) summary: one sentence on where marketing stands; ' +
        '2) recommendations: 3-5 concrete actions with title, detail (cite the real numbers) and priority high/medium/low; ' +
        '3) content_ideas: 3 content ideas (social/blog) each with title and angle, grounded in the customer questions or business data provided. ' +
        'Plain language, no emoji, never invent numbers.\n\nTODAY: ' + new Date().toISOString().slice(0, 10) +
        '\nMETRICS: ' + JSON.stringify(metrics),
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          recommendations: {
            type: 'array',
            items: {
              type: 'object',
              properties: { title: { type: 'string' }, detail: { type: 'string' }, priority: { type: 'string', enum: ['high', 'medium', 'low'] } },
              required: ['title', 'detail', 'priority'],
            },
          },
          content_ideas: {
            type: 'array',
            items: {
              type: 'object',
              properties: { title: { type: 'string' }, angle: { type: 'string' } },
              required: ['title', 'angle'],
            },
          },
        },
        required: ['summary', 'recommendations', 'content_ideas'],
      },
    });

    return Response.json({
      metrics: {
        visits_last_7d: metrics.visits_last_7d,
        bookings_last_30d: metrics.bookings_last_30d,
        quote_leads_last_30d: metrics.quote_leads_last_30d,
      },
      pending,
      plan: ai,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Analysis failed' }, { status: 500 });
  }
}