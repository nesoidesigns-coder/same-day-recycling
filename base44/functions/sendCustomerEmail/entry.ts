import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const OWNER_EMAIL = 'samedayrecycling@gmail.com';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const subject = String(body.subject || '').trim().slice(0, 150);
    const text = String(body.body || '').trim().slice(0, 5000);
    if (!subject || !text) {
      return Response.json({ error: 'subject and body are required' }, { status: 400 });
    }

    const svc = base44.asServiceRole;
    let to = null;
    let context = '';
    if (body.booking_id) {
      const booking = await svc.entities.Booking.get(String(body.booking_id));
      if (!booking || !booking.email) {
        return Response.json({ error: 'Booking not found or it has no customer email' }, { status: 404 });
      }
      to = booking.email;
      context = `customer on booking ${booking.id} (${booking.name || ''})`;
    } else if (body.to_owner) {
      to = OWNER_EMAIL;
      context = 'the owner';
    } else {
      return Response.json({ error: 'Pass booking_id (email that booking customer) or to_owner: true' }, { status: 400 });
    }

    await svc.integrations.Core.SendEmail({
      to,
      subject,
      body: text,
      from_name: 'Same Day Recycling',
    });

    return Response.json({ ok: true, sent_to: context });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}