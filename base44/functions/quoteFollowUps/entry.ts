import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const OWNER_EMAIL = 'nesoidesigns@gmail.com';
const MAX_ROUNDS = 3;
// Days to wait before each round: round 1 a day after the quote, round 2 three days later, round 3 four days after that
const ROUND_GAPS = { 1: 1, 2: 3, 3: 4 };
const TEMPLATES = { 1: 'QuoteFollowUp1', 2: 'QuoteFollowUp2', 3: 'QuoteFollowUp3' };

const esc = (s) => String(s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const vancouverToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Vancouver' }).format(new Date());

const daysSince = (dateStr) => {
  if (!dateStr) return Infinity;
  const t = Date.parse(dateStr.length > 10 ? dateStr : `${dateStr}T00:00:00Z`);
  if (Number.isNaN(t)) return Infinity;
  return Math.floor((Date.now() - t) / 86400000);
};

// Admin-only: sends the 3-round email sequence to quote leads that never booked.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let payload = {};
    try { payload = await req.json(); } catch {}
    const dryRun = payload.dry_run === true;

    const leads = (await base44.asServiceRole.entities.QuoteLead.filter(
      { status: { $in: ['new', 'contacted'] } },
      { sort: '-created_date', limit: 100 }
    )).items || [];

    const due = [];
    const escalated = [];
    for (const l of leads) {
      const round = l.followup_count || 0;
      if (round >= MAX_ROUNDS) {
        escalated.push(l);
        continue;
      }
      const next = round + 1;
      const since = round === 0 ? daysSince(l.created_date) : daysSince(l.last_followup_date);
      if (since >= ROUND_GAPS[next]) due.push({ lead: l, round: next });
    }

    if (!due.length && !escalated.length) {
      return Response.json({ ok: true, sent: [], escalated: [], message: 'No quote leads need a follow-up right now.' });
    }

    const sent = [];
    const updates = [];

    for (const { lead, round } of due) {
      const name = (lead.name || '').trim();
      const canEmail = Boolean(lead.email) && !dryRun;
      if (canEmail) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: lead.email,
            from_name: 'Same Day Recycling',
            template_name: TEMPLATES[round],
            variables: {
              name,
              items_text: lead.items_text || 'your items',
              estimate: lead.estimate || 'on-site estimate',
              city: lead.city || '',
            },
          });
        } catch {}
      }

      if (!dryRun) {
        updates.push({
          id: lead.id,
          followup_count: round,
          last_followup_date: vancouverToday(),
          ...(round === 1 ? { status: 'contacted' } : {}),
        });
      }

      sent.push({
        id: lead.id,
        name: name || '(no name)',
        email: lead.email || 'no email on file',
        round,
        estimate: lead.estimate || '',
        emailed: canEmail,
      });

      // Round 3 just went out and the lead still hasn't booked: hand it to the owner
      if (round === MAX_ROUNDS && !dryRun && lead.email) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: OWNER_EMAIL,
            from_name: 'Same Day Recycling',
            subject: `Quote lead exhausted the sequence: call ${name || lead.email}`,
            html:
              `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px">` +
              `<p style="color:#0c3b24;font-size:15px;line-height:1.6">All 3 follow-up emails went out and this quote lead still hasn't booked. Time for a personal call:</p>` +
              `<p style="color:#0c3b24;font-size:15px;line-height:1.6"><strong>Name:</strong> ${esc(name || 'n/a')}<br/><strong>Email:</strong> ${esc(lead.email)}<br/><strong>Phone:</strong> ${esc(lead.phone || 'n/a')}<br/><strong>City:</strong> ${esc(lead.city || 'n/a')}<br/><strong>Items:</strong> ${esc(lead.items_text || '')}<br/><strong>Estimate:</strong> ${esc(lead.estimate || '')}</p>` +
              `<p style="margin-top:16px"><a href="https://samedayrecycling.ca/admin/marketing" style="background:#1d9e56;color:#000;padding:12px 24px;border-radius:16px;font-weight:bold;text-decoration:none">Open the dashboard</a></p>` +
              `</div>`,
          });
        } catch {}
      }
    }

    if (!dryRun && updates.length) {
      await base44.asServiceRole.entities.QuoteLead.bulkUpdate(updates);
    }

    const callList = escalated.map((l) => ({ id: l.id, name: l.name || '(no name)', email: l.email || '', phone: l.phone || '' }));

    if (!dryRun && (sent.length || callList.length)) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: OWNER_EMAIL,
          from_name: 'Same Day Recycling',
          subject: `Quote follow-ups: ${sent.length} email${sent.length === 1 ? '' : 's'} sent today`,
          html:
            `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px">` +
            `<h2 style="color:#0c3b24">Quote lead follow-ups - today's report</h2>` +
            (sent.length
              ? `<ul style="font-size:14px;color:#0c3b24">` +
                sent.map((s) => `<li>Round ${s.round} to ${esc(s.name)} (${esc(s.email)}) - ${esc(s.estimate || 'no estimate')}</li>`).join('') +
                `</ul>`
              : '') +
            (callList.length
              ? `<p style="color:#0c3b24;font-weight:bold;margin-top:16px">Already got the full sequence - worth a personal call:</p>` +
                `<ul style="font-size:14px;color:#0c3b24">` +
                callList.map((c) => `<li>${esc(c.name)} - ${esc(c.email || 'no email')}${c.phone ? ' · ' + esc(c.phone) : ''}</li>`).join('') +
                `</ul>`
              : '') +
            `</div>`,
        });
      } catch {}
    }

    return Response.json({
      ok: true,
      sent,
      escalated: callList,
      message: dryRun
        ? `Dry run: ${sent.length} follow-up email(s) would be sent${callList.length ? `, ${callList.length} already finished the sequence` : ''}.`
        : `${sent.length} follow-up email(s) sent.${callList.length ? ` ${callList.length} lead(s) finished the sequence and were escalated to you.` : ''}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}