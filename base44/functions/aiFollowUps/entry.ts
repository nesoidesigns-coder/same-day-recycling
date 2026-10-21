import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const OWNER_EMAIL = 'nesoidesigns@gmail.com';
const MAX_ROUNDS = 3;

// The closing playbook the AI follows, one round at a time
const ROUND_PLAYBOOK = {
  1: 'Round 1 - warm close: confirm the job details back in one line, remind them the on-site price is approved by them BEFORE anything is lifted, and ask them to confirm today while same-day slots are still open.',
  2: 'Round 2 - objection handling: they likely hesitated on price, timing or trust. Address it in one confident line (free on-site estimate, upfront pricing, insured crew, eco receipts) and ask once more for the confirmation.',
  3: 'Round 3 - final nudge: short and direct. Say slots for their requested day are filling and this is the last hold. One clear question: shall we lock it in? Friendly, no guilt-tripping.',
};

const KIND_LABEL = {
  booking: 'Booking',
  realtor_lead: 'Realtor lead',
  software_inquiry: 'Software inquiry',
  white_label_lead: 'White-label lead',
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

// One sweep group per open-inquiry kind the daily closer chases
const describeLine = (kind, r, round) => {
  switch (kind) {
    case 'realtor_lead':
      return `REALTOR LEAD (id ${r.id}, round ${round}): ${r.agent_name}${r.brokerage ? ' of ' + r.brokerage : ''}, email ${r.email}, phone ${r.phone}, property ${r.property_address}${r.city ? ', ' + r.city : ''}, status ${r.status}, quoted ${r.load_label || 'n/a'} $${r.quote_low || '?'}-$${r.quote_high || '?'}, needed ${r.preferred_date || 'flexible'}, items: ${r.items_description || ''}`;
    case 'booking':
      return `BOOKING (id ${r.id}, round ${round}): ${r.name}, email ${r.email || 'none'}, phone ${r.phone}, ${r.address}${r.city ? ', ' + r.city : ''}, requested ${r.preferred_date || 'flexible'} ${r.time_window || ''}, quote ${r.quote_estimate || 'not given'}, items: ${r.items_description}`;
    case 'software_inquiry':
      return `SOFTWARE INQUIRY (id ${r.id}, round ${round}): ${r.contact_name} of ${r.company}, email ${r.email || 'none'}, phone ${r.phone || 'none'}, fleet size ${r.fleet_size ?? 'unknown'}, status ${r.status}, message: ${r.message || '(none)'}`;
    case 'white_label_lead':
      return `WHITE-LABEL LEAD (id ${r.id}, round ${round}): ${r.contact_name} of ${r.company}, email ${r.email || 'none'}, phone ${r.phone || 'none'}, city ${r.city || 'unknown'}, mode ${r.mode}, fleet size ${r.fleet_size ?? 'unknown'}, status ${r.status}, message: ${r.message || '(none)'}`;
    default:
      return '';
  }
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let payload = {};
    try { payload = await req.json(); } catch {}
    const dryRun = payload.dry_run === true;

    const cutoff = new Date(Date.now() - 4 * 3600 * 1000).toISOString();

    // Every open inquiry kind: realtor leads, unconfirmed bookings (4+ hours),
    // software inquiries and white-label leads still sitting in new/contacted
    const groups = [
      { kind: 'realtor_lead', entity: 'RealtorLead', filter: { status: { $in: ['new', 'contacted'] } } },
      { kind: 'software_inquiry', entity: 'SoftwareInquiry', filter: { status: { $in: ['new', 'contacted'] } } },
      { kind: 'white_label_lead', entity: 'WhiteLabelLead', filter: { status: { $in: ['new', 'contacted'] } } },
      { kind: 'booking', entity: 'Booking', filter: { status: 'new', created_date: { $lt: cutoff } } },
    ];

    const stillOpen = (r) => (r.followup_count || 0) >= MAX_ROUNDS;
    const allRecords = [];
    for (const g of groups) {
      const items = ((await base44.asServiceRole.entities[g.entity].filter(g.filter, { sort: '-created_date', limit: 20 })).items) || [];
      for (const r of items) allRecords.push({ kind: g.kind, entity: g.entity, record: r });
    }

    const active = allRecords.filter((x) => !stillOpen(x.record));
    const escalated = allRecords.filter((x) => stillOpen(x.record));

    if (!active.length && !escalated.length) {
      return Response.json({ ok: true, followups: [], escalated: [], message: 'Nothing needs a follow-up right now.' });
    }

    // Draft one closing message per active lead, following its round's playbook
    const summary = active
      .map((x) => describeLine(x.kind, x.record, (x.record.followup_count || 0) + 1))
      .join('\n');

    if (!summary.trim()) {
      return Response.json({
        ok: true,
        followups: [],
        escalated: escalated.map((x) => ({ id: x.record.id, kind: x.kind, name: x.record.name || x.record.agent_name || x.record.contact_name })),
        message: `${escalated.length} lead(s) already got the full 3-round sequence - they need a personal call now.`,
      });
    }

    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are the AI sales closer for Same Day Recycling, a same-day junk removal company in Canada (phone 604-849-1745). ' +
        'For each open lead or unconfirmed booking below, write ONE short closing message (2-3 sentences) to send the customer by email, ' +
        'following exactly the playbook for their round. Sound like a confident dispatcher, never pushy. ' +
        'The goal is to convert them into a CONFIRMED booking or a reply today. Never promise a specific arrival time or invent prices - ' +
        'only reference quotes already in the data. For software and white-label leads, the close is a reply or a short call. ' +
        'Return one entry per lead with its id.\n\n' +
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
                kind: { type: 'string', enum: ['realtor_lead', 'booking', 'software_inquiry', 'white_label_lead'] },
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
    const byId = new Map(allRecords.map((x) => [`${x.kind}:${x.record.id}`, x]));
    const subjectFor = (kind) => ({
      booking: 'Your Same Day Recycling pickup - shall we lock it in?',
      realtor_lead: 'Your Same Day Recycling cleanout - one quick confirmation',
      software_inquiry: 'Your Same Day Recycling software inquiry - shall we talk?',
      white_label_lead: 'Your white-label launch - shall we talk?',
    }[kind] || 'Same Day Recycling - following up');

    const followups = [];
    const updates = {};

    for (const f of drafts) {
      const entry = byId.get(`${f.kind}:${f.id}`);
      if (!entry || !f.message) continue;
      const { record, entity, kind } = entry;
      const round = (record.followup_count || 0) + 1;
      const recipient = record.email || '';
      const canEmail = Boolean(recipient) && !dryRun;

      if (canEmail) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: recipient,
            from_name: 'Same Day Recycling',
            subject: subjectFor(kind),
            html: wrapEmail(f.message),
          });
        } catch {}
      }

      if (!dryRun) {
        const patch = { id: record.id, followup_count: round, last_followup_date: today };
        if (kind === 'realtor_lead') patch.ai_processed = true;
        (updates[entity] = updates[entity] || []).push(patch);
      }

      followups.push({ id: f.id, kind, name: f.name, message: f.message, round, recipient: recipient || 'no email on file', emailed: canEmail });
    }

    // Advance each round counter
    if (!dryRun) {
      for (const [entity, patches] of Object.entries(updates)) {
        if (patches.length) await base44.asServiceRole.entities[entity].bulkUpdate(patches);
      }
    }

    const escalatedOut = escalated.map((x) => ({
      id: x.record.id,
      kind: x.kind,
      name: x.record.name || x.record.agent_name || x.record.contact_name,
      phone: x.record.phone,
    }));
    const noEmail = followups.filter((f) => !f.emailed && f.recipient === 'no email on file');

    // Digest to the owner: what was sent, plus who now needs a personal call
    const rowsSent = followups
      .map((f) => `<tr><td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-weight:bold;color:#0c3b24;vertical-align:top">${KIND_LABEL[f.kind] || esc(f.kind)}<br><span style="font-weight:normal;color:#475569">${esc(f.name)} · round ${f.round}${f.emailed ? ' · emailed ' + esc(f.recipient) : ' · no email on file'}</span></td><td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;color:#0c3b24">${esc(f.message)}</td></tr>`)
      .join('');
    const rowsCall = [...escalatedOut, ...noEmail.map((f) => ({ name: f.name, phone: 'no email on file', kind: f.kind }))]
      .map((e) => `<li style="color:#0c3b24">${KIND_LABEL[e.kind] || esc(e.kind)}: ${esc(e.name)}${e.phone ? ' · ' + esc(e.phone) : ''}</li>`)
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
          subject: `AI closer: ${followups.length} follow-up email${followups.length === 1 ? '' : 's'} sent${escalatedOut.length ? `, ${escalatedOut.length} need your call` : ''}`,
          html,
        });
      } catch {}
    }

    return Response.json({
      ok: true,
      followups,
      escalated: escalatedOut,
      message: dryRun
        ? `Dry run: ${followups.length} closing email(s) would be sent.`
        : followups.length
          ? `${followups.length} closing email(s) sent. ${escalatedOut.length ? escalatedOut.length + ' lead(s) escalated to you for a call.' : ''}`
          : 'Nothing needs a follow-up right now.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}