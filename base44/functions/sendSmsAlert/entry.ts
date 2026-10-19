import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const bookingId = body.booking_id;
    const message = typeof body.message === 'string' && body.message.trim()
      ? body.message.trim().slice(0, 320)
      : '';
    if (!bookingId) return Response.json({ error: 'booking_id is required' }, { status: 400 });

    const booking = await base44.entities.Booking.get(bookingId);
    if (!booking || !booking.phone) {
      return Response.json({ error: 'Booking or phone number not found' }, { status: 404 });
    }

    const to = normalizePhone(booking.phone);
    if (!to) {
      return Response.json({ error: `Cannot send to ${booking.phone} — not a valid phone number` }, { status: 400 });
    }

    const sid = secrets.get('TWILIO_ACCOUNT_SID');
    const token = secrets.get('TWILIO_AUTH_TOKEN');
    const from = secrets.get('TWILIO_FROM_NUMBER');
    if (!sid || !token || !from) {
      return Response.json({
        error: 'Twilio is not configured yet — add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER on the app dashboard Secrets page.',
      }, { status: 503 });
    }

    const text = message || "Same Day Recycling: your removal crew is on the way for today's pickup. Reply here or call (604) 849-1745.";

    const params = new URLSearchParams({ To: to, From: from, Body: text });
    const twRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${sid}:${token}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      signal: AbortSignal.timeout(10000),
    });
    const twData = await twRes.json().catch(() => ({}));
    if (!twRes.ok) {
      return Response.json({ error: twData.message || `Twilio error ${twRes.status}` }, { status: 502 });
    }

    return Response.json({ ok: true, message_sid: twData.sid, to });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  if (digits.length > 11) return '+' + digits;
  return null;
}