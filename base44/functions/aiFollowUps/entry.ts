import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const OWNER_EMAIL = 'nesoidesigns@gmail.com';
const MAX_ROUNDS = 3;

// The closing playbook the AI follows, one round at a time
const ROUND_PLAYBOOK = {
  1: 'Round 1 - warm close: confirm the job details back in one line, remind them the on-site price is approved by them BEFORE anything is lifted, and ask them to confirm today while same-day slots are still open.',
  2: 'Round 2 - objection handling: they likely hesitated on price, timing or trust. Address it in one confident line (free on-site estimate, upfront pricing, insured crew, eco receipts) and ask once more for the confirmation.',
  3: 'Round 3 - final nudge: short and direct. Say slots for their requested day are filling and this is the last hold. One clear question: shall we lock it in? Friendly, no guilt-tripping.',
};

const esc = (s) => String(s || '').replace(/</g, '&lt;');

// All dates the business reasons about are Vancouver local dates, never UTC
const vancouverToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Vancouver' }).format(new Date());

const wrapEmail = (message) =>
  `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px">` +
  `<p style="color:#0c3b24;font-size:15px;line-height:1.6">${esc(message)}</p>` +
  `<p style="color:#0c3b24;font-size:15px;line-height:1.6;margin-top:12px">Same Day Recycling<br>(604) 849-1745 · samedayrecycling.ca</p>` +
  `</div>`;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let payload = {};
    try { payload = await req.json(); } catch {}
    const dryRun = payload.dry_run === true;

    // Open realtor leads, and bookings sitting unconfirmed for 4+ hours
    const leads = (await base44.asServiceRole.entities.RealtorLead.filter(
      { status: { $in: ['new', 'contacted'] } },
      { sort: '-created_date', limit: 20 }
    )).items || [];

    const cutoff = new Date(Date.now() - 4 * 3600 * 1000).toISOString();
    const bookings = (await base44.asServiceRole.entities.Booking.filter(
      { status: 'new', created_date: { $lt: cutoff } },
      { sort: '-created_date', limit: 20 }
    )).items || [];

    const stillOpen = (l) => (l.followup_count || 0) >= MAX_ROUNDS;
    const activeLeads = leads.filter((l) => !stillOpen(l));
    const escalatedLeads = leads.filter(stillOpen);
    const activeBookings = bookings.filter((b) => !stillOpen(b));
    const escalatedBookings = bookings.filter(stillOpen);

    if (!activeLeads.length && !activeBookings.length && !escalatedLeads.length && !escalatedBookings.length) {
      return Response.json({ ok: true, followups: [], escalated: [], message: 'Nothing needs a follow-up right now.' });
    }

    // Draft one closing message per active lead, following its round's playbook
    const summary = [
      ...activeLeads.map((l) =>
        `REALTOR LEAD (id ${l.id}, round ${(l.followup_count || 0) + 1}): ${l.agent_name}${l.brokerage ? ' of ' + l.brokerage : ''}, email ${l.email}, phone ${l.phone}, property ${l.property_address}${l.city ? ', ' + l.city : ''}, status ${l.status}, quoted ${l.load_label || 'n/a'} $${l.quote_low || '?'}-$${l.quote_high || '?'}, needed ${l.preferred_date || 'flexible'}, items: ${l.items_description || ''}`
      ),
      ...activeBookings.map((b) =>
        `BOOKING (id ${b.id}, round ${(b.followup_count || 0) + 1}): ${b.name}, email ${b.email || 'none'}, phone ${b.phone}, ${b.address}${b.city ? ', ' + b.city : ''}, requested ${b.preferred_date || 'flexible'} ${b.time_window || ''}, quote ${b.quote_estimate || 'not given'}, items: ${b.items_description}`
      ),
    ].join('\n');

    if (!summary.trim()) {
      const escalated = [
        ...escalatedLeads.map((l) => ({ id: l.id, kind: 'realtor_lead', name: l.agent_name })),
        ...escalatedBookings.map((b) => ({ id: b.id, kind: 'booking', name: b.name })),
      ];
      if (escalated.length) {
        return Response.json({ ok: true, followups: [], escalated, message: `${escalated.length} lead(s) already got the full 3-round sequence - they need a personal call now.` });
      }
      return Response.json({ ok: true, followups: [], escalated: [], message: 'Nothing needs a follow-up right now.' });
    }

    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are the AI sales closer for Same Day Recycling, a same-day junk removal company in Canada (phone 604-849-1745). ' +
        'For each open lead or unconfirmed booking below, write ONE short closing message (2-3 sentences) to send the customer by email, ' +
        'following exactly the playbook for their round. Sound like a confident dispatcher, never pushy. ' +
        'The goal is to convert them into a CONFIRMED booking today. Never promise a specific arrival time or invent prices - ' +
        'only reference quotes already in the data. Return one entry per lead with its id.\n\n' +
        'ROUND PLAYBOOKS:\n' + Object.entries(ROUND_PLAYBOOK).map(([r, p]) => p).join('\n') +
        '\n\nLEADS:\n' + summary,
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

    const drafts = ai.followups || [];
    const today = vancouverToday();
    const leadById = new Map(activeLeads.map((l) => [l.id, l]));
    const bookingById = new Map(activeBookings.map((b) => [b.id, b]));

    const followups = [];
    const updates = { realtor_lead: [], booking: [] };

    for (const f of drafts) {
      const record = f.kind === 'booking' ? bookingById.get(f.id) : leadById.get(f.id);
      if (!record || !f.message) continue;
      const round = (record.followup_count || 0) + 1;
      const recipient = f.kind === 'booking' ? (record.email || '') : (record.email || '');
      const canEmail = Boolean(recipient) && !dryRun;

      if (canEmail) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: recipient,
            from_name: 'Same Day Recycling',
            subject: f.kind === 'booking'
              ? 'Your Same Day Recycling pickup - shall we lock it in?'
              : 'Your Same Day Recycling cleanout - one quick confirmation',
            html: wrapEmail(f.message),
          });
        } catch {}
      }

      if (!dryRun) {
        updates[f.kind === 'booking' ? 'booking' : 'realtor_lead'].push({
          id: record.id,
          followup_count: round,
          last_followup_date: today,
        });
      }

      followups.push({ id: f.id, kind: f.kind, name: f.name, message: f.message, round, recipient: recipient || 'no email on file', emailed: canEmail });
    }

    // Advance each round counter (and flag realtor leads as AI-handled)
    if (!dryRun) {
      if (updates.booking.length) {
        await base44.asServiceRole.entities.Booking.bulkUpdate(
          updates.booking.map((u) => ({ id: u.id, followup_count: u.followup_count, last_followup_date: u.last_followup_date }))
        );
      }
      if (updates.realtor_lead.length) {
        await base44.asServiceRole.entities.RealtorLead.bulkUpdate(
          updates.realtor_lead.map((u) => ({ id: u.id, followup_count: u.followup_count, last_followup_date: u.last_followup_date, ai_processed: true }))
        );
      }
    }

    const escalated = [
      ...escalatedLeads.map((l) => ({ id: l.id, kind: 'realtor_lead', name: l.agent_name, phone: l.phone })),
      ...escalatedBookings.map((b) => ({ id: b.id, kind: 'booking', name: b.name, phone: b.phone })),
    ];
    const noEmail = followups.filter((f) => !f.emailed && f.recipient === 'no email on file');

    // Digest to the owner: what was sent, plus who now needs a personal call
    const rowsSent = followups
      .map((f) => `<tr><td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#0c3b24;vertical-align:top">${f.kind === 'booking' ? 'Booking' : 'Realtor lead'}<br><span style="font-weight:normal;color:#475569">${esc(f.name)} · round ${f.round}${f.emailed ? ' · emailed ' + esc(f.recipient) : ' · no email on file'}</span></td><td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;color:#0c3b24">${esc(f.message)}</td></tr>`)
      .join('');
    const rowsCall = [...escalated, ...noEmail.map((f) => ({ name: f.name, phone: 'no email on file', kind: f.kind }))]
      .map((e) => `<li style="color:#0c3b24">${e.kind === 'booking' ? 'Booking' : 'Realtor lead'}: ${esc(e.name)}${e.phone ? ' · ' + esc(e.phone) : ''}</li>`)
      .join('');

    if (!dryRun && (rowsSent || rowsCall)) {
      const html =
        `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">` +
        `<h2 style="color:#0c3b24">AI sales closer - today's report</h2>` +
        (rowsSent ? `<p style="color:#475569">Closing emails sent automatically:</p><table style="width:100%;border-collapse:collapse;font-size:14px">${rowsSent}</table>` : '') +
        (rowsCall ? `<p style="color:#0c3b24;font-weight:bold;margin-top:20px">Needs a personal call now (full sequence done or no email on file):</p><ul style="font-size:14px">${rowsCall}</ul>` : '') +
        `<p style="margin-top:16px"><a href="https://samedayrecycling.ca/admin/jobs" style="background:#1d9e56;color:#000;padding:12px 24px;border-radius:16px;font-weight:bold;text-decoration:none">Open the dashboard</a></p>` +
        `</div>`;
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: OWNER_EMAIL,
          from_name: 'Same Day Recycling',
          subject: `AI closer: ${followups.length} follow-up email${followups.length === 1 ? '' : 's'} sent${escalated.length ? `, ${escalated.length} need your call` : ''}`,
          html,
        });
      } catch {}
    }

    return Response.json({
      ok: true,
      followups,
      escalated,
      message: dryRun
        ? `Dry run: ${followups.length} closing email(s) would be sent.`
        : followups.length
          ? `${followups.length} closing email(s) sent. ${escalated.length ? escalated.length + ' lead(s) escalated to you for a call.' : ''}`
          : 'Nothing needs a follow-up right now.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}