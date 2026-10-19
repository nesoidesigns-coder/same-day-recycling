import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const page = await base44.asServiceRole.entities.Booking.filter(
      { status: { $ne: 'cancelled' } },
      { sort: '-created_date', limit: 100, fields: ['city', 'status', 'created_date'] }
    );
    const rows = (Array.isArray(page) ? page : page.items) || [];
    return Response.json({
      bookings: rows.map((b) => ({
        city: String(b.city || '').slice(0, 60),
        status: String(b.status || 'new'),
        created_date: b.created_date,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}