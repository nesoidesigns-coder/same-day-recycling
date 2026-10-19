import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    const [queriesPage, bookingsPage] = await Promise.all([
      base44.asServiceRole.entities.ServiceQuery.filter(
        { source: 'receptionist' },
        { sort: '-created_date', limit: 10, fields: ['query_text', 'city', 'created_date'] }
      ),
      base44.asServiceRole.entities.Booking.filter(
        {},
        { sort: '-created_date', limit: 5, fields: ['items_description', 'city', 'created_date'] }
      ),
    ]);
    const queries = queriesPage?.items || [];
    const bookings = bookingsPage?.items || [];

    const events = [
      ...(queries || []).map((q) => ({
        type: 'question',
        text: String(q.query_text || '').slice(0, 140),
        city: q.city || '',
        at: q.created_date,
      })),
      ...(bookings || []).map((b) => ({
        type: 'booking',
        text: String(b.items_description || '').slice(0, 140),
        city: b.city || '',
        at: b.created_date,
      })),
    ]
      .filter((e) => e.text)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 10);

    return Response.json({ events });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}