import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

    const name = str(body?.name, 80);
    const phone = str(body?.phone, 30);
    const address = str(body?.address, 200);
    const items = str(body?.items_description, 500);
    if (!name || !phone || !address || !items) {
      return Response.json({ error: 'Missing required fields: name, phone, address, items_description.' }, { status: 400 });
    }
    const city = str(body?.city, 60);
    const preferred_date = str(body?.preferred_date, 20);
    const time_window = str(body?.time_window, 40);
    const quote_estimate = str(body?.quote_estimate, 120);
    const photo_uri = str(body?.photo_uri, 500);

    const booking = await base44.entities.Booking.create({
      name,
      phone,
      address,
      items_description: items,
      ...(city ? { city } : {}),
      ...(preferred_date ? { preferred_date } : {}),
      ...(time_window ? { time_window } : {}),
      ...(quote_estimate ? { quote_estimate } : {}),
      ...(photo_uri ? { photo_uri } : {}),
    });

    const preferred = `${preferred_date || 'any date'}${time_window ? ` · ${time_window}` : ''}`;
    const summary = `New booking: ${name}, ${phone}. ${address}${city ? ', ' + city : ''}. ${items}. Preferred: ${preferred}.${quote_estimate ? ` Quote: ${quote_estimate}.` : ''}`;

    // Email the owner immediately
    let emailSent = false;
    try {
      const recipients = ['nesoidesigns@gmail.com'];
      for (const to of recipients) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to,
            from_name: 'Same Day Recycling',
            subject: `New booking: ${name}${city ? ` — ${city}` : ''}`,
            text: summary,
            html: `<div style="font-family:sans-serif;max-width:560px">
              <h2 style="color:#0c3b24">New booking received</h2>
              <p style="margin:0;font-size:18px;font-weight:bold">${name}</p>
              <p style="margin:4px 0"><a href="tel:${phone}" style="color:#1d9e56;font-weight:bold">${phone}</a></p>
              <p style="margin:4px 0"><strong>Address:</strong> ${address}${city ? `, ${city}` : ''}</p>
              <p style="margin:4px 0"><strong>Items:</strong> ${items}</p>
              <p style="margin:4px 0"><strong>Preferred:</strong> ${preferred}</p>
              ${quote_estimate ? `<p style="margin:4px 0"><strong>Quote:</strong> ${quote_estimate}</p>` : ''}
              <p style="margin-top:16px;color:#64748b;font-size:13px">Manage it in the admin dashboard → /admin/jobs</p>
            </div>`,
          });
          emailSent = true;
        } catch (e) {
          // keep trying remaining admins
        }
      }
    } catch (e) {
      // admin lookup failed
    }

    return Response.json({ ok: true, booking_id: booking?.id, notified: { email: emailSent ? 'sent' : 'failed' } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}