import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Admin-only commercial intelligence aggregates. Reads live entity records;
// never estimates or fabricates. internal_test bookings are excluded from
// every operational figure. Revenue categories are disjoint (no double counting):
//   - referral revenue: Booking.platform_fee_amount + commission_earned (realized)
//   - subscription revenue: active ContractorAgreement.membership_fee_monthly
//     plus active SoftwareLicense.monthly_fee (both recurring, reported separately)

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const rowsOf = (res) => (Array.isArray(res) ? res : res?.rows) || [];
const itemsOf = (res) => (Array.isArray(res) ? res : res?.items) || [];
const num = (v) => Number(v) || 0;
const keyOf = (name) => name || 'Unassigned';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const op = { record_type: { $ne: 'internal_test' } };
    const doneStatuses = { $in: ['completed', 'paid'] };

    const [
      inquiriesByCity, inquiryStatuses, quoteLeadsByCity,
      offeredAgg, completedAgg, declinedAgg, platformDoneAgg,
      agreementAgg, licenseAgg, openByCity, verifiedPartners, countedAgreements,
    ] = await Promise.all([
      base44.entities.NationalRequest.aggregate({ groupBy: 'city' }),
      base44.entities.NationalRequest.aggregate({ groupBy: 'status' }),
      base44.entities.QuoteLead.aggregate({ groupBy: 'city' }),
      // every job ever offered to a contractor (assigned, accepted, finished or declined)
      base44.entities.Booking.aggregate({
        query: { ...op, assignment_status: { $in: ['assigned', 'accepted', 'scheduled', 'completed', 'paid', 'declined'] } },
        groupBy: 'partner_name',
      }),
      base44.entities.Booking.aggregate({
        query: { ...op, assignment_status: doneStatuses },
        groupBy: 'partner_name',
        sum: ['job_value', 'final_invoice', 'platform_fee_amount', 'commission_earned'],
      }),
      base44.entities.Booking.aggregate({
        query: { ...op, assignment_status: 'declined' },
        groupBy: 'partner_name',
      }),
      base44.entities.Booking.aggregate({
        query: { ...op, job_source: 'platform_generated', assignment_status: doneStatuses },
        groupBy: 'partner_name',
      }),
      base44.entities.ContractorAgreement.aggregate({
        query: { status: 'active' },
        groupBy: 'partner_name',
        sum: ['membership_fee_monthly'],
      }),
      base44.entities.SoftwareLicense.aggregate({
        query: { status: { $in: ['active', 'setup_paid'] } },
        groupBy: 'plan',
        sum: ['monthly_fee'],
      }),
      base44.entities.NationalRequest.aggregate({
        query: { status: { $in: ['new', 'provider_matching', 'recruiting'] } },
        groupBy: 'city',
      }),
      base44.entities.Partner.filter({ verified: true, active: true }, { limit: 500 }),
      base44.entities.ContractorAgreement.count({ status: 'active' }),
    ]);

    const byName = (agg) => Object.fromEntries(rowsOf(agg).map((r) => [keyOf(r.partner_name), r]));
    const offered = byName(offeredAgg);
    const completed = byName(completedAgg);
    const declined = byName(declinedAgg);
    const platformDone = byName(platformDoneAgg);
    const memberships = byName(agreementAgg);

    const contractors = Object.keys(offered).map((name) => {
      const offeredCount = num(offered[name]?.count);
      const doneCount = num(completed[name]?.count);
      const declinedCount = num(declined[name]?.count);
      const platformCount = num(platformDone[name]?.count);
      const fees = num(completed[name]?.sum_platform_fee_amount);
      const commissions = num(completed[name]?.sum_commission_earned);
      const membership = num(memberships[name]?.sum_membership_fee_monthly);
      return {
        partner: name,
        offered: offeredCount,
        completed: doneCount,
        declined: declinedCount,
        // Acceptance = offered jobs that were not declined.
        acceptance_rate: offeredCount ? Math.round(((offeredCount - declinedCount) / offeredCount) * 100) : null,
        gross_job_value: r2(num(completed[name]?.sum_job_value)),
        referral_revenue: r2(fees + commissions),
        membership_mrr: r2(membership),
        platform_completed_jobs: platformCount,
        // Measurable only when at least one platform-generated job completed.
        effective_acquisition_cost: platformCount ? r2((fees + commissions + membership) / platformCount) : null,
      };
    }).sort((a, b) => b.gross_job_value - a.gross_job_value);

    const networkMRR = r2(rowsOf(agreementAgg).reduce((s, r) => s + num(r.sum_membership_fee_monthly), 0));
    const softwareMRR = r2(rowsOf(licenseAgg).reduce((s, r) => s + num(r.sum_monthly_fee), 0));

    const verifiedCities = new Set(
      itemsOf(verifiedPartners).map((p) => String(p.city || '').toLowerCase().trim()).filter(Boolean)
    );
    const territoryGaps = rowsOf(openByCity)
      .filter((r) => r.city)
      .map((r) => ({
        city: r.city,
        open_requests: num(r.count),
        has_verified_contractor: verifiedCities.has(String(r.city).toLowerCase().trim()),
      }))
      .sort((a, b) => b.open_requests - a.open_requests);

    const quoteRows = rowsOf(quoteLeadsByCity).filter((r) => r.city).sort((a, b) => b.count - a.count);
    const referralRevenue = r2(contractors.reduce((s, c) => s + c.referral_revenue, 0));

    return Response.json({
      generated_at: new Date().toISOString(),
      inquiries_by_city: rowsOf(inquiriesByCity).filter((r) => r.city).sort((a, b) => b.count - a.count).slice(0, 40),
      inquiry_statuses: rowsOf(inquiryStatuses),
      qualified_leads: {
        quote_leads_by_city: quoteRows.slice(0, 40),
        total_quote_leads: quoteRows.reduce((s, r) => s + num(r.count), 0),
      },
      contractors,
      referral_revenue: referralRevenue,
      subscription_revenue: {
        network_membership_mrr: networkMRR,
        software_license_mrr: softwareMRR,
        combined_mrr: r2(networkMRR + softwareMRR),
        active_agreements: countedAgreements,
      },
      territory_gaps: territoryGaps,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}