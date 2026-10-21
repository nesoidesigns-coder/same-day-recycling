import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';
import { checkRateLimit, rateLimitedResponse } from '../../shared/rateLimit.ts';

const OWNER_EMAIL = 'nesoidesigns@gmail.com';
const BUSINESS_PHONE = '(604) 849-1745';

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

    const preferred = `${preferred_date || 'any date'}${time_window ? ` · ${time_window}` : ''}`;
    const ownerText = `New booking: ${name}, ${phone}. ${address}${city ? ', ' + city : ''}. ${items}. Preferred: ${preferred}.${quote_estimate ? ` Quote: ${quote_estimate}.` : ''}${email ? ` Email: ${email}.` : ''}`;

    // 1) Instant email to the owner
    let ownerEmail = 'failed';
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: OWNER_EMAIL,
        from_name: 'Same Day Recycling',
        subject: `New booking: ${name}${city ? ` — ${city}` : ''}`,
        text: ownerText,
        html: `<div style="font-family:sans-serif;max-width:560px">
          <h2 style="color:#0c3b24">New booking received</h2>
          <p style="margin:0;font-size:18px;font-weight:bold">${name}</p>
          <p style="margin:4px 0"><a href="tel:${phone}" style="color:#1d9e56;font-weight:bold">${phone}</a>${email ? ` · ${email}` : ''}</p>
          <p style="margin:4px 0"><strong>Address:</strong> ${address}${city ? `, ${city}` : ''}</p>
          <p style="margin:4px 0"><strong>Items:</strong> ${items}</p>
          <p style="margin:4px 0"><strong>Preferred:</strong> ${preferred}</p>
          ${quote_estimate ? `<p style="margin:4px 0"><strong>Quote:</strong> ${quote_estimate}</p>` : ''}
          <p style="margin-top:16px;color:#64748b;font-size:13px">Manage it in the admin dashboard → /admin/jobs</p>
        </div>`,
      });
      ownerEmail = 'sent';
    } catch (e) {
      // non-fatal
    }

    const notified = { owner_email: ownerEmail, customer_email: 'skipped' };

    // 2) Instant confirmation to the customer (email + SMS)
    const customerHtml = `<div style="font-family:sans-serif;max-width:560px">
      <h2 style="color:#0c3b24">Your pickup is booked ✅</h2>
      <p style="margin:0 0 12px">Hi ${name}, thanks for choosing Same Day Recycling. Here's what we have:</p>
      <p style="margin:4px 0"><strong>Service:</strong> ${items}${quote_estimate ? ` (${quote_estimate})` : ''}</p>
      <p style="margin:4px 0"><strong>Date / time:</strong> ${preferred}</p>
      <p style="margin:4px 0"><strong>Address:</strong> ${address}${city ? `, ${city}` : ''}</p>
      <p style="margin-top:12px">We'll confirm your exact time slot shortly.</p>
      <p style="margin-top:12px;font-size:13px;color:#64748b">Your request status: Request received → Confirmed → Scheduled → Completed. We update you at every step.</p>
      <p style="margin-top:12px">Questions? Call us at <a href="tel:+16048491745" style="color:#1d9e56;font-weight:bold">${BUSINESS_PHONE}</a></p>
    </div>`;

    if (email) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          from_name: 'Same Day Recycling',
          subject: `Booking received — we'll confirm your time slot shortly`,
          text: `Hi ${name}, your pickup is booked! Service: ${items}${quote_estimate ? ` (${quote_estimate})` : ''}. Date/time: ${preferred}. Address: ${address}${city ? ', ' + city : ''}. We'll confirm your exact time slot shortly. Your request status: Request received, Confirmed, Scheduled, Completed. We update you at every step. Questions? Call ${BUSINESS_PHONE}.`,
          html: customerHtml,
        });
        notified.customer_email = 'sent';
      } catch (e) {
        notified.customer_email = 'failed';
      }
    }

    return Response.json({ ok: true, booking_id: booking?.id, notified });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}