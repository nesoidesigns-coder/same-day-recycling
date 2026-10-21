import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const OWNER_EMAIL = 'nesoidesigns@gmail.com';
const BUSINESS_PHONE = '(604) 849-1745';

// AI lead chaser: the moment a new inquiry of ANY kind lands, the AI drafts a
// personalized first-touch reply, emails it instantly, flips the lead to
// "contacted" and alerts the owner with the draft. Called by entity-triggered
// workflows, one call per new inquiry.
const KINDS = {
  quote_lead: { entity: 'QuoteLead', label: 'Quote lead' },
  software_inquiry: { entity: 'SoftwareInquiry', label: 'Software inquiry' },
  white_label_lead: { entity: 'WhiteLabelLead', label: 'White-label lead' },
  contractor_application: { entity: 'ContractorApplication', label: 'Contractor application' },
};

const CUSTOMER_SUBJECT = {
  quote_lead: 'Your Same Day Recycling quote — we can pick this up',
  software_inquiry: 'Your Same Day Recycling software inquiry',
  white_label_lead: 'Your white-label request — let us get you live',
  contractor_application: 'We received your contractor application',
};

const GOAL = {
  quote_lead: 'get them to confirm the pickup today while same-day slots are open',
  software_inquiry: 'get them to reply or book a short call about running their junk removal business on the Same Day Recycling operating system',
  white_label_lead: 'get them to reply or book a short call about launching their own white-labeled booking app',
  contractor_application: 'acknowledge their application warmly, note that AI document review is under way, and tell them what comes next (approval and onboarding)',
};

const esc = (s) => String(s || '').replace(/</g, '&lt;');

const vancouverToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Vancouver' }).format(new Date());

const wrapEmail = (message) =>
  `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px">` +
  `<p style="color:#0c3b24;font-size:15px;line-height:1.6">${esc(message)}</p>` +
  `<p style="color:#0c3b24;font-size:15px;line-height:1.6;margin-top:12px">Same Day Recycling<br>${BUSINESS_PHONE} · samedayrecycling.ca</p>` +
  `</div>`;

function describe(kind, r) {
  switch (kind) {
    case 'quote_lead':
      return `Quote lead ${r.name || '(no name)'}, email ${r.email || 'none'}, phone ${r.phone || 'none'}, city ${r.city || 'unknown'}, items: ${r.items_text || 'not described'}, estimate ${r.estimate || 'not given'}, status ${r.status}`;
    case 'software_inquiry':
      return `Software inquiry from ${r.contact_name} of ${r.company}, email ${r.email || 'none'}, phone ${r.phone || 'none'}, fleet size ${r.fleet_size ?? 'unknown'}, message: ${r.message || '(none)'}, status ${r.status}`;
    case 'white_label_lead':
      return `White-label lead ${r.contact_name} of ${r.company}, email ${r.email || 'none'}, phone ${r.phone || 'none'}, city ${r.city || 'unknown'}, mode ${r.mode}, fleet size ${r.fleet_size ?? 'unknown'}, message: ${r.message || '(none)'}, status ${r.status}`;
    case 'contractor_application':
      return `Contractor application: ${r.company} (owner ${r.owner_name}), email ${r.email || 'none'}, phone ${r.phone || 'none'}, city ${r.city}, fleet: ${r.fleet_description || 'not described'}, AI document verdict ${r.ai_verdict || 'pending'}`;
    default:
      return '';
  }
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const kind = String(body.kind || '');
    const id = String(body.id || '');
    const dryRun = body.dry_run === true;
    const cfg = KINDS[kind];
    if (!cfg || !id) return Response.json({ error: 'Unknown kind or missing id' }, { status: 400 });

    const record = await base44.asServiceRole.entities[cfg.entity].get(id);
    if (!record) return Response.json({ error: 'Record not found' }, { status: 404 });

    // Guard: this inquiry has already been chased (idempotency / no double emails)
    if ((record.followup_count || 0) > 0) {
      return Response.json({ ok: true, skipped: 'already_chased' });
    }

    const context = describe(kind, record);
    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are the AI lead chaser for Same Day Recycling, a same-day junk removal and recycling company in Canada (phone ' + BUSINESS_PHONE + '). ' +
        'A new inquiry just came in. Your goal for this reply: ' + GOAL[kind] + '. ' +
        'Lead context: ' + context + '. ' +
        'Write ONE short personalized reply (2-4 sentences) to send this person by email right now. ' +
        'Acknowledge their specific details, set a clear expectation, and end with one clear next step. ' +
        'Sound like a confident, friendly Canadian dispatcher — never pushy. ' +
        'Never invent prices, availability or promises beyond the data above. Use Canadian spelling.',
      response_json_schema: {
        type: 'object',
        properties: { message: { type: 'string' } },
        required: ['message'],
      },
    });

    const message = String((ai && ai.message) || '').trim().slice(0, 1200);
    const recipient = record.email || '';
    let emailed = false;

    if (recipient && !dryRun) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: recipient,
          from_name: 'Same Day Recycling',
          subject: CUSTOMER_SUBJECT[kind],
          html: wrapEmail(message),
        });
        emailed = true;
      } catch {}
    }

    const today = vancouverToday();
    if (!dryRun) {
      // ContractorApplication tracks review state, not a chase cadence — leave its status alone
      if (kind !== 'contractor_application') {
        const patch = { followup_count: 1, last_followup_date: today, status: 'contacted' };
        await base44.asServiceRole.entities[cfg.entity].update(id, patch);
      }
      const ownerHtml =
        `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px">` +
        `<h2 style="color:#0c3b24">New ${esc(cfg.label.toLowerCase())} — AI chase sent</h2>` +
        `<p style="color:#475569;font-size:14px;line-height:1.6">${esc(context)}</p>` +
        `<p style="color:#0c3b24;font-weight:bold;margin-top:16px">AI-drafted reply ${emailed ? 'sent to ' + esc(recipient) : (recipient ? 'could not be emailed to ' + esc(recipient) : 'NOT sent — no email on file')}:</p>` +
        `<p style="color:#0c3b24;font-size:14px;line-height:1.6">${esc(message)}</p>` +
        `<p style="margin-top:16px"><a href="https://samedayrecycling.ca/admin" style="background:#1d9e56;color:#000;padding:12px 24px;border-radius:16px;font-weight:bold;text-decoration:none">Open the dashboard</a></p>` +
        `</div>`;
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: OWNER_EMAIL,
          from_name: 'Same Day Recycling',
          subject: `AI chase: new ${cfg.label.toLowerCase()} — ${record.company || record.name || 'new lead'}`,
          html: ownerHtml,
        });
      } catch {}
    }

    return Response.json({ ok: true, kind, id, emailed, message, skipped: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}