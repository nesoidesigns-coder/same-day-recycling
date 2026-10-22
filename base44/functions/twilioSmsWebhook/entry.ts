import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { validateTwilioSignature, twiml, twilioConfig } from '../../shared/twilio.ts';
import { OWNER_EMAIL, BUSINESS_PHONE } from '../../shared/bookingNotify.ts';

// Twilio inbound SMS webhook — two-way messaging.
//   Customer texts  → answered by Rex (LLM, scoped to the matching booking).
//   Contractor texts → logged and emailed to the owner for follow-up.
// Every request is validated with Twilio's request signature before anything runs.

const normDigits = (raw) => String(raw || '').replace(/\D/g, '');

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const cfg = twilioConfig();

    const form = await req.formData().catch(() => null);
    if (!form) return twiml('');
    const params = {};
    for (const [k, v] of form.entries()) params[k] = String(v);
    const from = String(params.From || '').trim();
    const text = String(params.Body || '').trim().slice(0, 1600);
    if (!from || !text) return twiml('');

    const appUrl = (req.headers.get('x-base44-app-url') || '').replace(/\/$/, '');
    const signature = req.headers.get('x-twilio-signature') || '';
    const valid = await validateTwilioSignature(cfg.auth_token, appUrl + '/functions/twilioSmsWebhook', params, signature);
    if (!valid) return new Response('Invalid signature', { status: 403 });

    // Identify the sender by last 10 digits: contractor first, then customer.
    const last10 = normDigits(from).slice(-10);
    const { items: partners } = await svc.entities.Partner.filter({ active: true }, { limit: 200 });
    const partner = (partners || []).find((p) => normDigits(p.phone).slice(-10) === last10 && last10.length === 10) || null;

    const { items: bookings } = await svc.entities.Booking.filter({}, { sort: '-created_date', limit: 200 });
    const booking = (bookings || []).find((b) => normDigits(b.phone).slice(-10) === last10 && last10.length === 10) || null;

    await svc.entities.SmsMessage.create({
      direction: 'inbound',
      role: partner ? 'contractor' : 'customer',
      phone: from,
      body: text,
      booking_id: booking?.id || '',
      partner_id: partner?.id || '',
      status: 'received',
    });

    if (partner) {
      // Contractor reply: log it and alert the owner — no automated replies.
      try {
        await svc.integrations.Core.SendEmail({
          to: OWNER_EMAIL,
          from_name: 'Same Day Recycling',
          subject: 'SMS from contractor ' + (partner.name || from),
          text: `Contractor ${partner.name} (${partner.city || ''}) texted ${from}: "${text}"`,
        });
      } catch {
        // Email alerts are best-effort; the message is already logged.
      }
      return twiml('');
    }

    // Customer reply: Rex answers, scoped to the booking on file (if any).
    let reply = `Thanks for texting Same Day Recycling! A team member will follow up shortly. For urgent help call ${BUSINESS_PHONE}.`;
    try {
      const context = booking
        ? `Existing booking on file: status ${booking.status} (${booking.assignment_status || 'unassigned'}), items: ${booking.items_description}, address: ${booking.address}${booking.city ? ', ' + booking.city : ''}, date: ${booking.preferred_date || 'TBD'}${booking.time_window ? ' ' + booking.time_window : ''}, quote: ${booking.quote_estimate || 'none'}.`
        : 'No booking on file for this phone number yet.';
      const llm = await svc.integrations.Core.InvokeLLM({
        prompt: `You are Rex, the booking dispatcher for Same Day Recycling (same-day junk removal when confirmed; phone ${BUSINESS_PHONE}). A customer texted: "${text}". ${context} Reply as a short SMS (max 300 characters, plain text, no emojis, no markdown). Use only the facts in the context: mark recorded facts as confirmed and everything else as pending. Never invent prices or availability. If they want to book and no booking exists, ask for missing details one at a time (items, address, city, date, name). If they want changes to an existing booking, say dispatch will confirm. Reply with only the message text.`,
      });
      const llmText = (typeof llm === 'string' ? llm : String((llm && (llm.reply || llm.text)) || '')).trim();
      if (llmText) reply = llmText.slice(0, 320);
    } catch {
      // LLM unavailable — keep the fallback reply.
    }

    await svc.entities.SmsMessage.create({
      direction: 'outbound',
      role: 'rex',
      phone: from,
      body: reply,
      booking_id: booking?.id || '',
      status: 'sent',
    });
    return twiml(reply);
  } catch {
    // Never leak errors to the carrier — acknowledge without replying.
    return twiml('');
  }
}