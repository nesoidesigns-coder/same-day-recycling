import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';
import { checkRateLimit, rateLimitedResponse } from '../../shared/rateLimit.ts';
import { sendBookingNotifications } from '../../shared/bookingNotify.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const limited = await checkRateLimit(base44, req, 'createBooking', 5);
    if (!limited.allowed) return rateLimitedResponse();
    const body = await req.json();
    const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

    const name = str(body?.name, 80);
    const phone = str(body?.phone, 30);
    const address = str(body?.address, 200);
    const items = str(body?.items_description, 500);
    if (!name || !phone || !address || !items) {
      return Response.json({ error: 'Missing required fields: name, phone, address, items_description.' }, { status: 400 });
    }
    const email = str(body?.email, 120);
    const city = str(body?.city, 60);
    const preferred_date = str(body?.preferred_date, 20);
    const time_window = str(body?.time_window, 40);
    const quote_estimate = str(body?.quote_estimate, 120);
    const photo_uri = str(body?.photo_uri, 500);

    // Same-day booking is live Canada-wide
    const booking = await base44.entities.Booking.create({
      status_history: [{ status: 'new', date: new Date().toISOString() }],
      name,
      phone,
      address,
      items_description: items,
      ...(email ? { email } : {}),
      ...(city ? { city } : {}),
      ...(preferred_date ? { preferred_date } : {}),
      ...(time_window ? { time_window } : {}),
      ...(quote_estimate ? { quote_estimate } : {}),
      ...(photo_uri ? { photo_uri } : {}),
    });

    const notified = await sendBookingNotifications(base44.asServiceRole, {
      name,
      phone,
      address,
      city,
      items_description: items,
      email,
      preferred_date,
      time_window,
      quote_estimate,
    });

    return Response.json({ ok: true, booking_id: booking?.id, notified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}