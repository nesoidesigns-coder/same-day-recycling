import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

    const name = str(body?.customer_name, 80);
    const phone = str(body?.phone, 30);
    const text = str(body?.text, 600);
    const city = str(body?.city, 60);
    const rating = Math.min(5, Math.max(1, Math.round(Number(body?.rating) || 0)));

    if (!name || !phone || !text || !rating) {
      return Response.json({ error: 'Missing required fields: name, phone, rating, review.' }, { status: 400 });
    }

    const digits = phone.replace(/\D/g, '').slice(-10);
    if (digits.length !== 10) {
      return Response.json({ error: 'Enter the phone number you booked with.' }, { status: 400 });
    }

    // Public lookup: verify the phone matches a completed booking
    const { items: completed } = await base44.asServiceRole.entities.Booking.filter(
      { status: 'completed' },
      { sort: '-created_date', limit: 200, fields: ['id', 'phone', 'city'] }
    );
    const match = completed.find((b) => String(b.phone || '').replace(/\D/g, '').slice(-10) === digits);
    if (!match) {
      return Response.json({ error: "We couldn't find a completed booking with that phone number. Please double-check it, or call us at (604) 849-1745." }, { status: 404 });
    }

    const review = await base44.asServiceRole.entities.Review.create({
      booking_id: match.id,
      customer_name: name,
      city: city || match.city || '',
      rating,
      text,
      approved: false,
    });

    return Response.json({ ok: true, review_id: review?.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}