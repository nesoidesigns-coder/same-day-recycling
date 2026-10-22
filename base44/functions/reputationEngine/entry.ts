import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Network Reputation & Reliability engine.
// Computes every metric from ACTUAL records only (Bookings, LeadOffers,
// Disputes, Reviews, Partners). A metric with too little underlying data is
// returned as null with a reason, never fabricated. No composite scores and
// no automatic penalties: unverified complaints are reported as unverified.

const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : null);
const round1 = (n) => Math.round(n * 10) / 10;
const r2 = (n) => Math.round(n * 100) / 100;
const isReal = (b) => (b.record_type || 'service') !== 'internal_test';
const COMPLETED_STATES = ['completed', 'paid'];

function completionTs(b) {
  const hs = Array.isArray(b.status_history) ? b.status_history : [];
  const done = hs.filter((h) => (h.status || h.event) === 'completed');
  return done.length ? done[done.length - 1].date : b.updated_date;
}

function weekStart(ts) {
  const d = new Date(ts);
  if (isNaN(d)) return null;
  const day = (d.getDay() + 6) % 7; // Monday-based weeks
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const [bookingPage, offerPage, disputePage, reviewPage, partnerPage, coPage] = await Promise.all([
      base44.asServiceRole.entities.Booking.list({ limit: 500 }),
      base44.asServiceRole.entities.LeadOffer.list({ limit: 500 }),
      base44.asServiceRole.entities.Dispute.list({ limit: 200 }),
      base44.asServiceRole.entities.Review.list({ limit: 300 }),
      base44.asServiceRole.entities.Partner.list({ limit: 200 }),
      base44.asServiceRole.entities.ChangeOrder.list({ limit: 300 }),
    ]);
    const bookings = (bookingPage.items || []).filter(isReal);
    const offers = offerPage.items || [];
    const disputes = disputePage.items || [];
    const reviews = reviewPage.items || [];
    const partners = partnerPage.items || [];
    const changeOrders = coPage.items || [];

    const completed = bookings.filter((b) => COMPLETED_STATES.includes(b.assignment_status) || b.status === 'completed');
    const approvedReviews = reviews.filter((r) => r.approved);

    // ---- Network KPIs ----
    const satisfaction = approvedReviews.length >= 3
      ? round1(approvedReviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / approvedReviews.length)
      : null;

    const arrivalRecorded = completed.filter((b) => b.arrival_status && b.arrival_status !== '');
    const onTimeRate = pct(arrivalRecorded.filter((b) => b.arrival_status === 'on_time').length, arrivalRecorded.length);

    const quoteApprovalCompliance = pct(completed.filter((b) => (Number(b.approved_quote_amount) || 0) > 0).length, completed.length);

    const disputedBookings = new Set(disputes.map((d) => d.booking_id));
    const disputeFrequency = pct(completed.filter((b) => disputedBookings.has(b.id)).length, completed.length);

    const resolvedDisputes = disputes.filter((d) => d.status === 'resolved' || d.status === 'closed');
    const disputeResolutionRate = pct(resolvedDisputes.length, disputes.length);

    const respondedOffers = offers.filter((o) => o.responded_date && o.created_date);
    const respHours = respondedOffers
      .map((o) => (new Date(o.responded_date) - new Date(o.created_date)) / 36e5)
      .filter((h) => Number.isFinite(h) && h >= 0);
    const avgResponseHours = respHours.length ? Math.round(respHours.reduce((s, h) => s + h, 0) / respHours.length) : null;

    const receiptRecorded = completed.filter((b) => b.receipt_sent === true || b.receipt_sent === false);
    const receiptCompletionRate = pct(completed.filter((b) => b.receipt_sent === true).length, completed.length);

    // Repeat customers: normalized phone number appearing on 2+ real bookings.
    const norm = (p) => String(p || '').replace(/\D/g, '').slice(-10);
    const byCustomer = {};
    for (const b of bookings) {
      const key = norm(b.phone);
      if (key.length >= 7) byCustomer[key] = (byCustomer[key] || 0) + 1;
    }
    const customers = Object.keys(byCustomer).length;
    const repeatRate = customers >= 3
      ? pct(Object.values(byCustomer).filter((c) => c >= 2).length, customers)
      : null;

    const responded = offers.filter((o) => o.status === 'accepted' || o.status === 'declined');
    const acceptanceRate = pct(responded.filter((o) => o.status === 'accepted').length, responded.length);

    const network = {
      total_completed_jobs: completed.length,
      verified_satisfaction: satisfaction,
      verified_review_count: approvedReviews.length,
      on_time_completion_rate: onTimeRate,
      on_time_recorded: arrivalRecorded.length,
      quote_approval_compliance: quoteApprovalCompliance,
      pricing_dispute_frequency: disputeFrequency,
      dispute_resolution_rate: disputeResolutionRate,
      avg_contractor_response_hours: avgResponseHours,
      receipt_completion_rate: receiptCompletionRate,
      receipt_recorded: receiptRecorded.length,
      repeat_customer_rate: repeatRate,
      offer_acceptance_rate: acceptanceRate,
      total_disputes: disputes.length,
      unverified_disputes: disputes.filter((d) => ['open', 'under_review', 'awaiting_customer'].includes(d.status)).length,
      change_orders_total: changeOrders.length,
      change_orders_approved: changeOrders.filter((c) => c.status === 'approved').length,
    };

    // ---- Per-contractor scorecards (facts, not scores) ----
    const contractors = partners.map((p) => {
      const mine = bookings.filter((b) => b.partner_id === p.id);
      const mineCompleted = mine.filter((b) => COMPLETED_STATES.includes(b.assignment_status) || b.status === 'completed');
      const mineDeclined = mine.filter((b) => b.assignment_status === 'declined');
      const mineActive = mine.filter((b) => ['assigned', 'accepted', 'scheduled'].includes(b.assignment_status));
      const myOffers = offers.filter((o) => o.partner_id === p.id);
      const myResponded = myOffers.filter((o) => o.status === 'accepted' || o.status === 'declined');
      const myResp = myResponded
        .filter((o) => o.responded_date && o.created_date)
        .map((o) => (new Date(o.responded_date) - new Date(o.created_date)) / 36e5)
        .filter((h) => Number.isFinite(h) && h >= 0);
      const myReviews = approvedReviews.filter((r) => r.provider_id === p.id);
      const bookingIds = new Set(mine.map((b) => b.id));
      const myDisputes = disputes
        .filter((d) => bookingIds.has(d.booking_id))
        .map((d) => ({
          id: d.id,
          job_ref: d.job_ref,
          status: d.status,
          outcome: d.resolution_outcome || '',
          complaint: String(d.complaint || '').slice(0, 300),
          contractor_response: d.contractor_response || '',
          contractor_response_date: d.contractor_response_date || '',
          created_date: d.created_date,
        }));
      const verifiedComplaints = myDisputes.filter((d) => d.outcome && d.outcome !== '');
      const arrivalRec = mineCompleted.filter((b) => b.arrival_status && b.arrival_status !== '');
      return {
        id: p.id,
        name: p.name,
        city: p.city,
        active: p.active,
        verified: p.verified,
        jobs_offered: mineActive.length + mineDeclined.length + mineCompleted.length,
        jobs_accepted: mineActive.length + mineCompleted.length,
        jobs_declined: mineDeclined.length,
        jobs_completed: mineCompleted.length,
        offer_acceptance_rate: pct(myResponded.filter((o) => o.status === 'accepted').length, myResponded.length),
        completion_rate: pct(mineCompleted.length, mineActive.length + mineCompleted.length),
        avg_response_hours: myResp.length ? Math.round(myResp.reduce((s, h) => s + h, 0) / myResp.length) : null,
        avg_rating: myReviews.length >= 2
          ? round1(myReviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / myReviews.length)
          : null,
        review_count: myReviews.length,
        on_time_rate: pct(arrivalRec.filter((b) => b.arrival_status === 'on_time').length, arrivalRec.length),
        receipt_compliance: pct(mineCompleted.filter((b) => b.receipt_sent === true).length, mineCompleted.length),
        verified_complaints: verifiedComplaints.length,
        unverified_complaints: myDisputes.filter((d) => !d.outcome && !['resolved', 'closed'].includes(d.status)).length,
        pricing_disputes: myDisputes.filter((d) => /price|pricing|billing|charge|overcharg|invoice/i.test(d.complaint || '')).length,
        damage_incidents: myDisputes.filter((d) => /damag/i.test(d.complaint || '') || /damag/i.test(String(d.outcome || ''))).length,
        disputes: myDisputes,
      };
    }).sort((a, b) => b.jobs_completed - a.jobs_completed || b.jobs_offered - a.jobs_offered);

    // ---- 8-week historical trend ----
    const trend = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const ws = weekStart(now);
      ws.setDate(ws.getDate() - i * 7);
      const we = new Date(ws);
      we.setDate(we.getDate() + 7);
      const inWeek = (ts) => {
        if (!ts) return false;
        const d = new Date(ts);
        return !isNaN(d) && d >= ws && d < we;
      };
      trend.push({
        week: `${ws.getMonth() + 1}/${ws.getDate()}`,
        created: bookings.filter((b) => inWeek(b.created_date)).length,
        completed: bookings.filter((b) => inWeek(completionTs(b))).length,
      });
    }

    return Response.json({
      generated_at: new Date().toISOString(),
      network,
      contractors,
      trend,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}