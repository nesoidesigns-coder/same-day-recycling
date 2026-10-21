import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Revenue Intelligence aggregates for the admin Command Centre. Admin-only.
// Gross transaction volume is reported separately from revenue EARNED by
// Same Day Recycling. The revenue categories are disjoint, so nothing is
// double-counted:
//   - job commissions and platform fees: Booking fields only
//   - membership revenue: active ContractorAgreement records only
//   - software subscription revenue: SoftwareLicense monthly fees only
//   - software setup revenue: collected PayPal setup transactions only
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const sum = (rows, field) => (rows || []).reduce((s, r) => s + (Number(r[field]) || 0), 0);

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const serviceQuery = { record_type: { $ne: 'internal_test' }, status: { $ne: 'cancelled' } };
    const completedQuery = { ...serviceQuery, assignment_status: { $in: ['completed', 'paid'] } };

    const [grossAgg, earnedAgg, memberAgg, licenseAgg, invoiceAgg, setupAgg, ppRefundAgg, ledgerAgg, provinceAgg] = await Promise.all([
      base44.entities.Booking.aggregate({ query: serviceQuery, groupBy: 'status', sum: ['job_value', 'final_invoice'] }),
      base44.entities.Booking.aggregate({ query: completedQuery, groupBy: 'job_source', sum: ['commission_earned', 'commission_paid', 'platform_fee_amount', 'refund_amount'] }),
      base44.entities.ContractorAgreement.aggregate({ query: { status: 'active' }, groupBy: 'status', sum: ['membership_fee_monthly'] }),
      base44.entities.SoftwareLicense.aggregate({ query: {}, groupBy: 'status', sum: ['monthly_fee', 'setup_fee'] }),
      base44.entities.LicenseInvoice.aggregate({ query: { status: 'sent' }, groupBy: 'status', sum: ['amount'] }),
      base44.entities.PaypalTransaction.aggregate({ query: { status: 'paid', purpose: { $in: ['license_setup', 'white_label_setup'] } }, groupBy: 'purpose', sum: ['amount'] }),
      base44.entities.PaypalTransaction.aggregate({ query: { status: 'refunded' }, groupBy: 'status', sum: ['amount'] }),
      base44.entities.RevenueLedger.aggregate({ query: { direction: { $in: ['payout', 'refund', 'adjustment'] } }, groupBy: 'direction', sum: ['amount'] }),
      base44.entities.Booking.aggregate({ query: completedQuery, groupBy: 'province_code', sum: ['job_value', 'final_invoice', 'platform_fee_amount', 'commission_earned'] }),
    ]);

    const commissionEarned = sum(earnedAgg.rows, 'sum_commission_earned');
    const commissionPaid = sum(earnedAgg.rows, 'sum_commission_paid');
    const platformFees = sum(earnedAgg.rows, 'sum_platform_fee_amount');
    const membershipMrr = sum(memberAgg.rows, 'sum_membership_fee_monthly');
    const liveLicenses = (licenseAgg.rows || []).filter((r) => ['active', 'setup_paid'].includes(r.status));
    const softwareMrr = sum(liveLicenses, 'sum_monthly_fee');
    const setupCollected = sum(setupAgg.rows, 'sum_amount');
    const setupAgreed = sum((licenseAgg.rows || []).filter((r) => r.status !== 'provisioning' && r.status !== 'cancelled'), 'sum_setup_fee');
    const ledgerOf = (dir) => sum((ledgerAgg.rows || []).filter((r) => r.direction === dir), 'sum_amount');

    return Response.json({
      generated_at: new Date().toISOString(),
      gross: {
        job_value: r2(sum(grossAgg.rows, 'sum_job_value')),
        invoiced: r2(sum(grossAgg.rows, 'sum_final_invoice')),
      },
      revenue: {
        job_commissions: r2(commissionEarned),
        job_commissions_paid: r2(commissionPaid),
        job_commissions_outstanding: r2(Math.max(0, commissionEarned - commissionPaid)),
        platform_fees: r2(platformFees),
        membership_mrr: r2(membershipMrr),
        software_mrr: r2(softwareMrr),
        software_setup_agreed: r2(setupAgreed),
        software_setup_collected: r2(setupCollected),
        mrr: r2(membershipMrr + softwareMrr),
        total_earned: r2(commissionEarned + platformFees + membershipMrr + softwareMrr + setupCollected),
      },
      adjustments: {
        booking_refunds: r2(sum(earnedAgg.rows, 'sum_refund_amount')),
        paypal_refunds: r2(sum(ppRefundAgg.rows, 'sum_amount')),
        ledger_refunds: r2(ledgerOf('refund')),
        ledger_adjustments: r2(ledgerOf('adjustment')),
        contractor_payouts: r2(ledgerOf('payout')),
        outstanding_invoices: r2(sum(invoiceAgg.rows, 'sum_amount')),
      },
      by_province: (provinceAgg.rows || [])
        .map((r) => ({
          province: r.province_code || 'Unassigned',
          gross: r2(r.sum_job_value),
          invoiced: r2(r.sum_final_invoice),
          earned: r2((Number(r.sum_platform_fee_amount) || 0) + (Number(r.sum_commission_earned) || 0)),
        }))
        .sort((a, b) => b.gross - a.gross),
      by_source: (earnedAgg.rows || []).map((r) => ({
        source: r.job_source || 'unspecified',
        earned: r2((Number(r.sum_commission_earned) || 0) + (Number(r.sum_platform_fee_amount) || 0)),
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}