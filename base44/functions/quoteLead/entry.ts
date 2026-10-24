import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { checkRateLimit, rateLimitedResponse } from '../../shared/rateLimit.ts';

const OWNER_EMAIL = 'nesoidesigns@gmail.com';

// Anonymous quote-lead capture: a visitor who got an instant quote but didn't book
// leaves their phone or email so the team can follow up and close the job.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const limited = await checkRateLimit(base44, req, 'quoteLead', 5);
    if (!limited.allowed) return rateLimitedResponse();
    const body = await req.json().catch(() => ({}));
    const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

    const contact = str(body?.contact, 120);
    const itemsText = str(body?.items_text, 1000);
    const estimate = str(body?.estimate, 120);
    const city = str(body?.city, 80);
    const sid = str(body?.sid, 40);

    if (!contact) {
      return Response.json({ error: 'Enter a phone number or email address.' }, { status: 400 });
    }
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
    const digits = contact.replace(/\D/g, '');
    const isPhone = !isEmail && digits.length >= 7 && digits.length <= 15;
    if (!isEmail && !isPhone) {
      return Response.json({ error: 'Enter a valid phone number or email address.' }, { status: 400 });
    }

    await base44.asServiceRole.entities.QuoteLead.create({
      name: '',
      phone: isPhone ? contact : '',
      email: isEmail ? contact : '',
      items_text: itemsText,
      city,
      estimate,
      status: 'new',
      sid,
    });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: OWNER_EMAIL,
      from_name: 'Same Day Recycling Website',
      subject: `New quote lead${city ? ' - ' + city : ''}${estimate ? ' (' + estimate + ')' : ''}`,
      text: `Contact: ${contact}\nItems: ${itemsText || 'n/a'}\nCity: ${city || 'n/a'}\nInstant estimate: ${estimate || 'n/a'}\n\nThey got a quote but didn't book. Follow up within 30 minutes to close the job.`,
      html: `<div style="font-family:sans-serif;max-width:560px;color:#0c3b24">
        <h2 style="color:#0c3b24">New quote lead</h2>
        <p style="margin:4px 0"><strong>Contact:</strong> ${contact}</p>
        <p style="margin:4px 0"><strong>Items:</strong> ${itemsText || 'n/a'}</p>
        <p style="margin:4px 0"><strong>City:</strong> ${city || 'n/a'}</p>
        <p style="margin:4px 0"><strong>Instant estimate:</strong> ${estimate || 'n/a'}</p>
        <p style="margin:12px 0;color:#475569">They got a quote but didn't book. Follow up within 30 minutes to close the job.</p>
      </div>`,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}