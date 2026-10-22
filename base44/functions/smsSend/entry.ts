import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { sendSms, flushSmsQueue, getSmsConfig } from '../../shared/twilio.ts';

// Authenticated SMS operations (admin console + Rex + scheduled workflows).
// SMS is optional: with no provider configured, sends are queued, never
// claimed as sent, and the business contact number is untouched.
//   custom          — send a text to any phone number (admin only)
//   booking_message — send a text to a booking's customer phone (admin only)
//   dispatch_alert  — text a partner contractor about a job (admin only)
//   reminders       — day-before reminders for tomorrow's confirmed jobs (scheduled workflow)
//   status          — connection status + queued count for the admin dashboard
//   flush_queue     — send everything queued (admin only)
const vancouverToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Vancouver' }).format(new Date());

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || 'custom');

    if (action === 'status') {
      const cfg = await getSmsConfig(svc);
      const queued = await svc.entities.SmsMessage.count({ direction: 'outbound', status: 'queued' });
      return Response.json({
        provider: cfg.provider,
        outbound_enabled: cfg.outbound_enabled,
        account_sid_set: !!cfg.account_sid,
        auth_token_set: !!cfg.auth_token,
        from_number: cfg.from_number || '',
        from_number_source: cfg.from_number_source,
        verified: !!cfg.verified,
        ready: cfg.ready,
        queued_count: queued,
      });
    }

    if (action === 'flush_queue') {
      const result = await flushSmsQueue(svc);
      return Response.json(result, { status: result.ok ? 200 : 503 });
    }

    if (action === 'custom') {
      const to = String(body?.to || '').trim();
      const text = String(body?.body || '').trim().slice(0, 1600);
      if (!to || !text) return Response.json({ error: 'to and body are required' }, { status: 400 });
      const result = await sendSms(svc, {
        to,
        body: text,
        booking_id: String(body?.booking_id || ''),
        partner_id: String(body?.partner_id || ''),
        role: 'admin',
      });
      return Response.json(result, { status: result.ok ? 200 : (result.queued ? 202 : 502) });
    }

    if (action === 'booking_message') {
      const bookingId = String(body?.booking_id || '').trim();
      const text = String(body?.body || '').trim().slice(0, 1600);
      if (!bookingId || !text) return Response.json({ error: 'booking_id and body are required' }, { status: 400 });
      const booking = await svc.entities.Booking.get(bookingId).catch(() => null);
      if (!booking || !booking.phone) return Response.json({ error: 'Booking or phone not found' }, { status: 404 });
      const result = await sendSms(svc, { to: booking.phone, body: text, booking_id: bookingId, partner_id: booking.partner_id || '', role: 'admin' });
      return Response.json(result, { status: result.ok ? 200 : (result.queued ? 202 : 502) });
    }

    if (action === 'dispatch_alert') {
      const bookingId = String(body?.booking_id || '').trim();
      if (!bookingId) return Response.json({ error: 'booking_id is required' }, { status: 400 });
      const booking = await svc.entities.Booking.get(bookingId).catch(() => null);
      if (!booking || !booking.partner_id) return Response.json({ error: 'Booking has no assigned partner' }, { status: 404 });
      const { items: partners } = await svc.entities.Partner.filter({ id: booking.partner_id }, { limit: 1 });
      const partner = (partners || [])[0];
      if (!partner || !partner.phone) return Response.json({ error: 'Partner has no phone number on file' }, { status: 404 });
      const when = `${booking.preferred_date || 'date TBD'}${booking.time_window ? ' · ' + booking.time_window : ''}`;
      const text = `Same Day Recycling dispatch: new job for you — ${booking.name}, ${booking.address}${booking.city ? ', ' + booking.city : ''}, ${booking.items_description.slice(0, 80)}, ${when}. Accept in your partner portal.`;
      const result = await sendSms(svc, { to: partner.phone, body: text, booking_id: bookingId, partner_id: partner.id, role: 'system' });
      return Response.json(result, { status: result.ok ? 200 : (result.queued ? 202 : 502) });
    }

    if (action === 'reminders') {
      const today = vancouverToday();
      const tomorrow = new Date(Date.parse(today + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10);
      const { items: due } = await svc.entities.Booking.filter(
        {
          preferred_date: tomorrow,
          status: { $in: ['confirmed', 'scheduled'] },
          record_type: { $ne: 'internal_test' },
        },
        { limit: 200 },
      );
      const results = [];
      for (const booking of due) {
        if (!booking.phone || (booking.notified && booking.notified.reminder_sms_sent)) continue;
        const window = booking.time_window ? ` between ${booking.time_window}` : '';
        const text = `Same Day Recycling reminder: your pickup is tomorrow (${tomorrow})${window}. Reply here or call (604) 849-1745.`;
        const r = await sendSms(svc, { to: booking.phone, body: text, booking_id: booking.id, partner_id: booking.partner_id || '', role: 'system' });
        await svc.entities.Booking.update(booking.id, {
          notified: { ...(booking.notified || {}), reminder_sms_sent: r.ok ? 'sent' : (r.queued ? 'queued' : 'failed') },
        }).catch(() => {});
        results.push({ booking_id: booking.id, ok: r.ok, queued: !!r.queued, error: r.error || '' });
      }
      return Response.json({ ok: true, date: tomorrow, due: due.length, sent: results });
    }

    return Response.json({ error: 'Unknown action. Use custom, booking_message, dispatch_alert, reminders, status or flush_queue.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}