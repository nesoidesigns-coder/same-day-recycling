import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const PARTNER_SHARE = 0.75;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action || 'data';

    // Self-service signup: creates a partner record linked to the signed-in email.
    if (action === 'register') {
      const companyName = String(body?.company || '').trim();
      const city = String(body?.city || '').trim();
      const equipment = Array.isArray(body?.equipment)
        ? body.equipment.map((e) => String(e).trim().slice(0, 60)).filter(Boolean).slice(0, 12)
        : [];
      if (!companyName || !city) {
        return Response.json({ error: 'Company name and service city are required.' }, { status: 400 });
      }
      const existing = await base44.asServiceRole.entities.Partner.filter({ email: user.email });
      const existingList = Array.isArray(existing) ? existing : (existing.items || []);
      if (existingList.length) {
        return Response.json({ error: 'A partner account already exists for this email.' }, { status: 409 });
      }
      await base44.asServiceRole.entities.Partner.create({
        name: companyName.slice(0, 120),
        email: user.email,
        city: city.slice(0, 60),
        equipment,
        active: true,
      });
      return Response.json({ ok: true });
    }

    // Resolve the partner record for this exact signed-in email.
    const rawPartners = await base44.asServiceRole.entities.Partner.filter({ email: user.email });
    const partners = Array.isArray(rawPartners) ? rawPartners : (rawPartners.items || []);
    const partner = partners[0];
    if (!partner || partner.active === false) {
      return Response.json({ error: 'No active partner account is linked to this email.' }, { status: 403 });
    }

    const publicPartner = { id: partner.id, name: partner.name, city: partner.city };
    // Test (internal_test) and cancelled bookings never reach contractors.
    const loadBookings = () => base44.asServiceRole.entities.Booking.filter(
      { partner_id: partner.id, assignment_status: { $in: ['assigned', 'accepted'] }, record_type: { $ne: 'internal_test' }, status: { $ne: 'cancelled' } },
      { sort: '-created_date', limit: 50 }
    );
    const loadHistory = () => base44.asServiceRole.entities.Booking.filter(
      { partner_id: partner.id, assignment_status: 'completed', record_type: { $ne: 'internal_test' } },
      { sort: '-created_date', limit: 50 }
    );

    // Incoming national inquiries in this partner's city, still open for
    // intake (not yet matched, confirmed, completed or cancelled).
    const loadRequests = () => base44.asServiceRole.entities.NationalRequest.filter(
      {
        city: { $regex: '^\\s*' + String(partner.city || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', $options: 'i' },
        status: { $in: ['new', 'provider_matching'] },
      },
      { sort: '-created_date', limit: 50 }
    );

    if (action === 'data') {
      const [{ items: jobs }, { items: history }, { items: requests }] = await Promise.all([
        loadBookings(), loadHistory(), loadRequests(),
      ]);
      return Response.json({ partner: publicPartner, jobs, history, requests });
    }

    // Territory overview: bookings, quotes and estimated revenue for this partner's city.
    if (action === 'territory') {
      const city = String(partner.city || '').trim();
      const [{ items: rawCityBookings }, quotes] = await Promise.all([
        base44.asServiceRole.entities.Booking.filter({ city }, { sort: '-created_date', limit: 500 }),
        base44.asServiceRole.entities.QuoteLead.count({ city }),
      ]);
      // Internal payment-test bookings never enter territory stats.
      const cityBookings = rawCityBookings.filter((b) => (b.record_type || 'service') !== 'internal_test');
      const estimatedRevenue = cityBookings.reduce((s, b) => s + (Number(b.job_value) || 0), 0);
      return Response.json({
        city,
        bookings: cityBookings.length,
        completed_bookings: cityBookings.filter((b) => b.assignment_status === 'completed').length,
        quotes,
        estimated_revenue: Math.round(estimatedRevenue * 100) / 100,
      });
    }

    // Scoped mutation: only a booking assigned to THIS partner may change state.
    const allowed = { accept: 'accepted', decline: 'declined', complete: 'completed' };
    const next = allowed[action];
    const bookingId = String(body?.booking_id || '');
    if (!next || !bookingId) {
      return Response.json({ error: 'Invalid action.' }, { status: 400 });
    }

    const booking = await base44.asServiceRole.entities.Booking.get(bookingId);
    if (!booking || booking.partner_id !== partner.id) {
      return Response.json({ error: 'That booking is not assigned to you.' }, { status: 403 });
    }
    const validFrom = { accepted: 'assigned', declined: 'assigned', completed: 'accepted' };
    if (booking.assignment_status !== validFrom[next]) {
      return Response.json({ error: `Cannot ${action} a booking in "${booking.assignment_status}" state.` }, { status: 409 });
    }
    // Every contractor action is timestamped in the booking's status history
    // (accept, decline and complete), for an immutable acceptance audit trail.
    const updateData = {
      assignment_status: next,
      status_history: [...(booking.status_history || []), { status: next, date: new Date().toISOString() }],
    };
    if (next === 'completed') {
      updateData.status = 'completed';
    }
    await base44.asServiceRole.entities.Booking.update(bookingId, updateData);

    const [{ items: jobs }, { items: history }] = await Promise.all([loadBookings(), loadHistory()]);
    return Response.json({ ok: true, partner: publicPartner, jobs, history });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}