import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const OWNER_EMAIL = 'nesoidesigns@gmail.com';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Realtor leads still open, and bookings sitting untouched for 4+ hours
    const leads = (await base44.asServiceRole.entities.RealtorLead.filter(
      { status: { $in: ['new', 'contacted'] } },
      { sort: '-created_date', limit: 15 }
    )).items || [];

    const cutoff = new Date(Date.now() - 4 * 3600 * 1000).toISOString();
    const bookings = (await base44.asServiceRole.entities.Booking.filter(
      { status: 'new', created_date: { $lt: cutoff } },
      { sort: '-created_date', limit: 15 }
    )).items || [];

    if (!leads.length && !bookings.length) {
      return Response.json({ ok: true, followups: [], message: 'Nothing needs a follow-up right now.' });
    }

    const summary = [
      ...leads.map((l) =>
        `REALTOR LEAD (id ${l.id}): ${l.agent_name}${l.brokerage ? ' of ' + l.brokerage : ''}, phone ${l.phone}, email ${l.email}, property ${l.property_address}${l.city ? ', ' + l.city : ''}, status ${l.status}, quoted ${l.load_label || 'n/a'} $${l.quote_low || '?'}-$${l.quote_high || '?'}, needed ${l.preferred_date || 'flexible'}, items: ${l.items_description || ''}`
      ),
      ...bookings.map((b) =>
        `BOOKING (id ${b.id}): ${b.name}, phone ${b.phone}, ${b.address}${b.city ? ', ' + b.city : ''}, requested ${b.preferred_date || 'flexible'} ${b.time_window || ''}, items: ${b.items_description}, still status "new" since ${b.created_date}`
      ),
    ].join('\n');

    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are the AI sales assistant for Same Day Recycling, a same-day junk removal company in British Columbia (phone 604-849-1745). ' +
        'For each open lead or unconfirmed booking below, draft ONE short, friendly follow-up message (2-3 sentences) to send the customer. ' +
        'Goal: get them booked or confirmed today. Mention the upfront on-site pricing and same-day availability where natural. ' +
        'Never promise a specific arrival time. Return one entry per lead with its id.\n\n' +
        summary,
      response_json_schema: {
        type: 'object',
        properties: {
          followups: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                kind: { type: 'string', enum: ['realtor_lead', 'booking'] },
                name: { type: 'string' },
                message: { type: 'string' },
              },
              required: ['id', 'kind', 'name', 'message'],
            },
          },
        },
        required: ['followups'],
      },
    });

    const followups = ai.followups || [];

    // Daily digest email to the owner
    if (followups.length) {
      const rows = followups
        .map(
          (f) =>
            `<tr><td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#0c3b24;vertical-align:top">${f.kind === 'booking' ? 'Booking' : 'Realtor lead'}<br><span style="font-weight:normal;color:#475569">${f.name}</span></td>` +
            `<td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;color:#0c3b24">${String(f.message).replace(/</g, '&lt;')}</td></tr>`
        )
        .join('');
      const html =
        `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">` +
        `<h2 style="color:#0c3b24">AI follow-ups for today</h2>` +
        `<p style="color:#475569">The AI drafted these follow-ups for open leads and unconfirmed bookings. Call or text them, or copy the message:</p>` +
        `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>` +
        `<p style="margin-top:16px"><a href="https://samedayrecycling.ca/admin/jobs" style="background:#1d9e56;color:#000;padding:12px 24px;border-radius:16px;font-weight:bold;text-decoration:none">Open the dashboard</a></p>` +
        `</div>`;
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: OWNER_EMAIL,
          subject: `AI follow-ups: ${followups.length} leads to chase today`,
          html,
        });
      } catch {}
    }

    return Response.json({ ok: true, followups, leads_found: leads.length, bookings_found: bookings.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}