import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';

// Google Business Profile funnel: visit -> inquiry -> quote -> completed job -> commission.
// Attribution comes from the anonymous session id shared by visits, quote
// requests and bookings, plus manually tagged inquiries (QuoteLead.source =
// 'google_business'). Nothing is inferred or estimated: a stage is counted
// only when the underlying record says so.

const normPhone = (p) => String(p || '').replace(/\D/g, '').slice(-10);
const round2 = (n) => Math.round(n * 100) / 100;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me().catch(() => null);
    if (!me || me.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const url = new URL(req.url);
    const days = Math.max(0, Number(body?.days ?? url.searchParams.get('days') ?? 30));
    const since = days > 0 ? new Date(Date.now() - days * 86400000).toISOString() : null;

    // 1. GBP visits — real customer traffic from the Business Profile / Maps.
    const visitQuery = { source: 'google_business', traffic_class: 'customer' };
    if (since) visitQuery.created_date = { $gte: since };
    const visits = (await base44.asServiceRole.entities.Visit.filter(visitQuery, { limit: 1000 })).items || [];
    const sids = [...new Set(visits.map((v) => v.sid).filter(Boolean))];

    // 2. Inquiries: manually tagged GBP leads + leads captured in GBP sessions (all time).
    const tagged = (await base44.asServiceRole.entities.QuoteLead.filter({ source: 'google_business' }, { sort: '-created_date', limit: 500 })).items || [];
    const sessionLeads = sids.length
      ? (await base44.asServiceRole.entities.QuoteLead.filter({ sid: { $in: sids } }, { sort: '-created_date', limit: 500 })).items || []
      : [];
    const leadMap = new Map();
    for (const l of [...tagged, ...sessionLeads]) leadMap.set(l.id, l);
    const leads = [...leadMap.values()];

    // 3. Linked bookings: same session id, or the same customer phone number.
    const bookings = (await base44.asServiceRole.entities.Booking.filter({ record_type: 'service' }, { sort: '-created_date', limit: 1000 })).items || [];
    const leadPhones = new Set(leads.map((l) => normPhone(l.phone)).filter((p) => p.length === 10));
    const bookingFor = (lead) =>
      bookings.find(
        (b) =>
          (lead.sid && b.sid && b.sid === lead.sid) ||
          (leadPhones.has(normPhone(b.phone)) && b.phone && normPhone(b.phone) === normPhone(lead.phone))
      ) || null;

    const stages = { visits: visits.length, inquiries: 0, quotes_sent: 0, booked: 0, completed: 0 };
    let commissionTotal = 0;
    const rows = leads.map((lead) => {
      const booking = bookingFor(lead);
      if (lead.status === 'lost') {
        return {
          id: lead.id, name: lead.name, phone: lead.phone, city: lead.city,
          estimate: lead.estimate, items_text: lead.items_text, created_date: lead.created_date,
          stage: 'lost', commission: 0,
          booking_id: booking?.id || null, booking_status: booking?.status || null, booking_ref: booking?.reference_code || '',
        };
      }
      let stage = 'inquiry';
      if (lead.status === 'contacted') stage = 'quote_sent';
      if (lead.status === 'booked') stage = 'booked';
      if (booking && booking.status !== 'cancelled') {
        if (stage === 'inquiry') stage = 'booked';
        if (booking.status === 'completed') stage = 'completed';
        if (booking.commission_earned > 0) stage = 'commission';
      }
      // Funnel counts respect the selected window; the board shows all leads.
      if (!since || lead.created_date >= since) {
        stages.inquiries += 1;
        if (stage !== 'inquiry') stages.quotes_sent += 1;
        if (stage === 'booked' || stage === 'completed' || stage === 'commission') stages.booked += 1;
        if (stage === 'completed' || stage === 'commission') stages.completed += 1;
        if (stage === 'commission') commissionTotal += booking.commission_earned;
      }
      return {
        id: lead.id, name: lead.name, phone: lead.phone, city: lead.city,
        estimate: lead.estimate, items_text: lead.items_text, created_date: lead.created_date,
        stage, commission: stage === 'commission' ? booking.commission_earned : 0,
        booking_id: booking?.id || null, booking_status: booking?.status || null, booking_ref: booking?.reference_code || '',
      };
    });

    rows.sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || '')));

    return Response.json({
      funnel: { ...stages, commission_total: round2(commissionTotal) },
      leads: rows,
      visit_sessions: sids.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}