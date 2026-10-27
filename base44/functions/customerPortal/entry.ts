import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';

// Customer portal identity resolver — the front door of the customer-facing OS.
// One signed-in person may be several kinds of customer at once (a contractor
// who also runs a property portfolio, a realtor who books cleanouts), so this
// returns EVERY role their own email is linked to, never a single guess.
//
// Rules honoured here:
// - Records are matched on the signed-in account's own email only.
// - Only customer-safe fields leave this function: no other customer's data,
//   no internal notes, no fee calculations, no test records.
// - Internal test records never appear in a customer's history.

const norm = (v) => String(v || '').trim().toLowerCase();
const esc = (v) => String(v || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const money = (n) => Math.round((Number(n) || 0) * 100) / 100;

const bookingView = (b) => ({
  id: b.id,
  reference_code: b.reference_code || '',
  city: b.city || '',
  status: b.status || 'new',
  assignment_status: b.assignment_status || 'unassigned',
  preferred_date: b.preferred_date || '',
  time_window: b.time_window || '',
  items_description: b.items_description || '',
  address: b.address || '',
  quote_estimate: b.quote_estimate || '',
  payment_status: b.payment_status || 'none',
  created_date: b.created_date || '',
});

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const email = norm(user.email);
    if (!email) return Response.json({ error: 'This account has no email address on file.' }, { status: 400 });

    // Case-insensitive exact match on the signed-in person's own email.
    const byEmail = { $regex: '^\\s*' + esc(email) + '\\s*$', $options: 'i' };
    const sr = base44.asServiceRole;

    const [partnerPage, subPage, movePage, bookingPage, realtorPage] = await Promise.all([
      sr.entities.Partner.filter({ email: byEmail }, { limit: 5 }),
      sr.entities.Subscription.filter({ email: byEmail }, { limit: 5 }),
      sr.entities.MoveAssistProject.filter({ email: byEmail }, { sort: '-created_date', limit: 20 }),
      sr.entities.Booking.filter({ email: byEmail, record_type: { $ne: 'internal_test' } }, { sort: '-created_date', limit: 20 }),
      sr.entities.RealtorLead.filter({ email: byEmail }, { sort: '-created_date', limit: 20 }),
    ]);

    const partner = (partnerPage.items || [])[0] || null;
    const subscription = (subPage.items || [])[0] || null;
    const projects = (movePage.items || []).filter((p) => (p.record_type || 'service') !== 'internal_test');
    const bookings = bookingPage.items || [];
    const leads = realtorPage.items || [];

    // ---------- Contractor (Recycling OS subscriber) ----------
    let contractor = null;
    if (partner) {
      const cityMatch = { $regex: '^\\s*' + esc(partner.city || '') + '\\s*$', $options: 'i' };
      const [activeJobs, completedJobs, openRequests] = await Promise.all([
        sr.entities.Booking.count({
          partner_id: partner.id,
          assignment_status: { $in: ['assigned', 'accepted'] },
          record_type: { $ne: 'internal_test' },
          status: { $ne: 'cancelled' },
        }),
        sr.entities.Booking.count({
          partner_id: partner.id,
          assignment_status: 'completed',
          record_type: { $ne: 'internal_test' },
        }),
        partner.city
          ? sr.entities.NationalRequest.count({
              city: cityMatch,
              status: { $in: ['new', 'provider_matching'] },
              record_type: { $ne: 'internal_test' },
            })
          : 0,
      ]);
      contractor = {
        name: partner.name || '',
        city: partner.city || '',
        verified: !!partner.verified,
        active: partner.active !== false,
        active_jobs: Number(activeJobs) || 0,
        completed_jobs: Number(completedJobs) || 0,
        open_requests: Number(openRequests) || 0,
      };
    }

    // ---------- Business / property manager (recurring plan) ----------
    const business = subscription
      ? {
          company: subscription.company || subscription.name || '',
          city: subscription.city || '',
          plan: subscription.plan || '',
          status: subscription.status || 'new',
        }
      : null;

    // ---------- Household ----------
    const household =
      bookings.length || projects.length
        ? {
            bookings: bookings.map(bookingView),
            projects: projects.map((p) => ({
              id: p.id,
              name: p.name || '',
              reference_code: p.reference_code || '',
              city: p.city || '',
              move_date: p.move_date || '',
              move_flexible: !!p.move_flexible,
              status: p.status || 'planning',
              stage_count: (p.stages || []).length,
            })),
          }
        : null;

    // ---------- Realtor / referral partner ----------
    const realtor = leads.length
      ? {
          agent_name: leads[0].agent_name || '',
          brokerage: leads[0].brokerage || '',
          leads: leads.map((l) => ({
            id: l.id,
            property_address: l.property_address || '',
            city: l.city || '',
            status: l.status || 'new',
            preferred_date: l.preferred_date || '',
            quote_low: money(l.quote_low),
            quote_high: money(l.quote_high),
            created_date: l.created_date || '',
          })),
        }
      : null;

    const roles = [];
    if (contractor) roles.push('contractor');
    if (business) roles.push('business');
    if (realtor) roles.push('realtor');
    if (household || (!contractor && !business && !realtor)) roles.push('household');

    return Response.json({
      email: user.email,
      name: user.full_name || '',
      roles,
      contractor,
      business,
      household,
      realtor,
      has_records: !!(contractor || business || household || realtor),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}