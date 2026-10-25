import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';
import { checkRateLimit, rateLimitedResponse } from '../../shared/rateLimit.ts';
import { sendBookingNotifications } from '../../shared/bookingNotify.ts';
import { isActiveCity } from '../../shared/coverageStatus.ts';
import { provinceForCity } from '../../shared/canadaTax.ts';

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
    // Advertised $25 curbside discount: one per job, applied at creation and
    // recorded on the booking so payment and pricing always see it.
    const curbside = body?.curbside === true;
    const discount_amount = curbside ? 25 : 0;
    const province_code = provinceForCity(city);
    const sid = str(body?.sid, 40);
    // Verified pickup location (address engine) + job-prep answers.
    const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
    let pickup_lat = num(body?.pickup_lat);
    let pickup_lng = num(body?.pickup_lng);
    if (pickup_lat === null || pickup_lng === null || pickup_lat < 41 || pickup_lat > 84 || pickup_lng < -142 || pickup_lng > -52) {
      pickup_lat = null;
      pickup_lng = null;
    }
    const pickup_unit = str(body?.pickup_unit, 40);
    const pickup_location_source = ['verified_geocode', 'customer_adjusted'].includes(body?.pickup_location_source)
      ? body.pickup_location_source
      : '';
    const access_notes = body?.access_notes && typeof body.access_notes === 'object' && !Array.isArray(body.access_notes)
      ? body.access_notes
      : {};

    // Booking integrity: confirmed bookings are only accepted in active service
    // territories. The frontend routes non-live cities to the ServiceWaitlist;
    // this guard enforces the same rule server-side.
    if (!city || !isActiveCity(city)) {
      return Response.json({
        error: 'service_not_available',
        message: 'Confirmed direct bookings are only available in active service territories. Submit a nationwide service request and our dispatch team will confirm your local contractor, pricing and pickup window before anything is scheduled.',
      }, { status: 422 });
    }
    // Public tracking code: shown to the customer so they can look up their
    // own booking status without an account (see requestLookup).
    const reference_code = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
    const booking = await base44.entities.Booking.create({
      reference_code,
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
      ...(curbside ? { curbside_discount: true, discount_amount: 25 } : {}),
      ...(province_code ? { province_code } : {}),
      ...(sid ? { sid } : {}),
      ...(pickup_lat !== null ? { pickup_lat, pickup_lng } : {}),
      ...(pickup_unit ? { pickup_unit } : {}),
      ...(pickup_location_source && pickup_lat !== null ? { pickup_location_source } : {}),
      ...(Object.keys(access_notes).length ? { access_notes } : {}),
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

    // Persist the delivery outcome on the booking for system-health reporting.
    if (booking?.id) {
      await base44.entities.Booking.update(booking.id, {
        notified,
        ...(province_code ? { province_code } : {}),
        ...(curbside ? { discount_amount: 25 } : {}),
      }).catch((e) => console.error('Failed to record notification status:', e.message));
    }

    return Response.json({ ok: true, booking_id: booking?.id, reference_code, notified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}