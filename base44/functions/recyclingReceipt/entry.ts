import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const bookingId = typeof body?.booking_id === 'string' ? body.booking_id : '';
    if (!bookingId) return Response.json({ error: 'booking_id is required' }, { status: 400 });

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.status !== 'completed') {
      return Response.json({ sent: false, reason: 'Booking is not completed yet' });
    }
    if (!booking.email) {
      return Response.json({ sent: false, reason: 'Booking has no customer email' });
    }

    const city = booking.city || 'Metro Vancouver';
    const pickupDate = booking.preferred_date || new Date().toISOString().slice(0, 10);

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: booking.email,
      template_name: 'RecyclingReceipt',
      variables: {
        customer_name: booking.name || 'there',
        city,
        pickup_date: pickupDate,
        items: (booking.items_description || '').slice(0, 400) || 'Your load',
      },
    });

    return Response.json({ sent: true, to: booking.email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}