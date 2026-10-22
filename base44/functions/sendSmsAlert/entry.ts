import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { sendSms } from '../../shared/twilio.ts';

// Admin-only manual SMS to a booking's customer (e.g. "crew on the way").
// Sending and logging are handled by the shared Twilio module.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const bookingId = body.booking_id;
    const message = typeof body.message === 'string' && body.message.trim()
      ? body.message.trim().slice(0, 1600)
      : "Same Day Recycling: your removal crew is on the way for today's pickup. Reply here or call (604) 849-1745.";
    if (!bookingId) return Response.json({ error: 'booking_id is required' }, { status: 400 });

    const booking = await base44.entities.Booking.get(bookingId);
    if (!booking || !booking.phone) {
      return Response.json({ error: 'Booking or phone number not found' }, { status: 404 });
    }

    const result = await sendSms(base44.asServiceRole, {
      to: booking.phone,
      body: message,
      booking_id: booking.id,
      partner_id: booking.partner_id || '',
      role: 'admin',
    });
    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 502 });
    }
    return Response.json({ ok: true, message_sid: result.sid, to: result.to });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}