import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const OWNER_EMAIL = 'nesoidesigns@gmail.com';

// Application notifications, called by the entity-triggered workflows:
//   action 'received' — fires when a contractor application is created.
//   action 'approved' — fires when an application is marked approved.
// Each sends the branded email template to the applicant exactly once
// (guarded by a sent flag on the record) and alerts the owner.
export default async function(req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || '');
  const id = String(body.id || '');
  if (!['received', 'approved'].includes(action) || !id) {
    return Response.json({ error: 'Unknown action or missing id' }, { status: 400 });
  }

  const app = await base44.asServiceRole.entities.ContractorApplication.get(id);
  if (!app) return Response.json({ error: 'Application not found' }, { status: 404 });
  if (!app.email) return Response.json({ error: 'No applicant email on file.' }, { status: 400 });

  const sentFlag = action === 'received' ? 'application_received_sent' : 'approval_sent';
  if (app[sentFlag]) return Response.json({ ok: true, skipped: 'already_sent' });

  const variables = {
    owner_name: app.owner_name || 'there',
    company: app.company || 'your company',
    city: app.city || '',
  };
  const template = action === 'received' ? 'ContractorApplicationReceived' : 'ContractorApplicationApproved';
  try {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: app.email,
      from_name: 'Same Day Recycling',
      template_name: template,
      variables,
    });
  } catch (e) {
    return Response.json({ error: `Email send failed: ${e.message}` }, { status: 502 });
  }

  await base44.asServiceRole.entities.ContractorApplication.update(id, { [sentFlag]: true });

  // Owner alert: every application event is reported to the admin.
  const subject = action === 'received'
    ? `New contractor application — ${app.company} (${app.city})`
    : `Contractor approved — ${app.company} (${app.city})`;
  const context = `Application: ${app.company} (owner ${app.owner_name}), email ${app.email}, phone ${app.phone || 'none'}, city ${app.city}, status ${app.status}`;
  const ownerHtml =
    `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px">` +
    `<h2 style="color:#0c3b24">${action === 'received' ? 'New contractor application' : 'Contractor approved'} — applicant notified</h2>` +
    `<p style="color:#475569;font-size:14px;line-height:1.6">${context}</p>` +
    `<p style="color:#475569;font-size:14px;line-height:1.6">Confirmation email sent to ${app.email}.</p>` +
    `<p style="margin-top:16px"><a href="https://samedayrecycling.ca/admin/applications" style="background:#1d9e56;color:#000;padding:12px 24px;border-radius:16px;font-weight:bold;text-decoration:none">Open applications</a></p>` +
    `</div>`;
  try {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: OWNER_EMAIL,
      from_name: 'Same Day Recycling',
      subject,
      html: ownerHtml,
    });
  } catch { /* owner alert is best-effort */ }

  return Response.json({ ok: true, action, id, emailed: app.email });
}