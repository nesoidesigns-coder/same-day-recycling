import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Network Growth Engine aggregation. Verified records only: subscription
// revenue counts collected/paying licenses, never trials or failed payments.
// Fund budget is a planning figure computed from owner-controlled settings —
// never an authorization to spend.
const money = (n) => Math.round((Number(n) || 0) * 100) / 100;
const sum = (arr, get) => arr.reduce((a, x) => a + (Number(get(x)) || 0), 0);

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const toArr = (p) => (Array.isArray(p) ? p : p.items || []);
    const [licensePage, invoicePage, paypalPage, finTxPage, partnerPage, settingsList, campaignPage, contribPage, jobFinPage, bookingPage] = await Promise.all([
      base44.entities.SoftwareLicense.list({ limit: 500 }),
      base44.entities.LicenseInvoice.list({ limit: 500 }),
      base44.entities.PaypalTransaction.list({ limit: 500 }),
      base44.entities.FinancialTx.filter({ owner_type: 'sdr_admin' }, { limit: 500 }),
      base44.entities.Partner.list({ limit: 500 }),
      base44.entities.NetworkGrowthSettings.list({ limit: 1 }),
      base44.entities.NetworkCampaign.list({ sort: '-created_date', limit: 100 }),
      base44.entities.MarketingContribution.list({ limit: 500 }),
      base44.entities.JobFinancials.list({ limit: 500 }),
      base44.entities.Booking.list({ limit: 500 }),
    ]);
    const licenses = toArr(licensePage), invoices = toArr(invoicePage), paypalTx = toArr(paypalPage),
      finTx = toArr(finTxPage), partners = toArr(partnerPage), campaigns = toArr(campaignPage),
      contributions = toArr(contribPage), jobFin = toArr(jobFinPage), bookings = toArr(bookingPage);

    const settings = toArr(settingsList)[0] || {};

    // ---- Contractor revenue engine ----
    const PAYING = ['active', 'paid'];
    const paying = licenses.filter((l) => PAYING.includes(l.status) && (Number(l.monthly_fee) || 0) > 0);
    const pipeline = licenses.filter((l) => !PAYING.includes(l.status) && !['cancelled', 'ended'].includes(l.status) && (Number(l.monthly_fee) || 0) > 0);
    const cancelled = licenses.filter((l) => ['cancelled', 'ended'].includes(l.status));
    const monthlyOf = (l) => {
      const fee = Number(l.monthly_fee) || 0;
      return (l.billing_cycle === 'annual' && fee > 0) ? fee / 12 : fee;
    };
    const plans = {};
    paying.forEach((l) => {
      const key = l.plan || 'unspecified';
      plans[key] = plans[key] || { plan: key, monthly_fee: money(monthlyOf(l)), contractors: 0, monthly_revenue: 0 };
      plans[key].contractors += 1;
      plans[key].monthly_revenue = money(plans[key].monthly_revenue + monthlyOf(l));
    });

    // Collected cash: paid license invoices + subscription-shaped PayPal captures.
    const paidInvoices = invoices.filter((i) => i.status === 'paid');
    const activationCollected = money(sum(paidInvoices, (i) => Number(i.amount) || 0));
    const subPaypal = paypalTx.filter((t) =>
      t.status === 'COMPLETED' && /membership|subscription|license|software|activation/i.test(String(t.purpose || '')));
    const paypalCollected = money(sum(subPaypal, (t) => {
      const gross = Number(t.subtotal_amount) > 0 ? t.subtotal_amount : (Number(t.amount) - Number(t.tax_amount || 0));
      return gross;
    }));
    const failedPayments = paypalTx.filter((t) => /FAILED|failed/.test(String(t.status))).length;

    const mrr = money(sum(paying, monthlyOf));
    const netMrr = money(mrr - sum(contributions.filter((c) => c.status === 'active'), (c) => Number(c.monthly_amount) || 0));

    // ---- Book cash (verified ledger) ----
    const incomeTx = finTx.filter((t) => t.kind === 'income' && t.status === 'paid');
    const expenseTx = finTx.filter((t) => t.kind === 'expense' && t.status === 'paid');
    const marketingSpend = money(sum(expenseTx.filter((t) => t.category === 'marketing'), (t) => t.amount));

    // ---- Network Growth Fund (planning figure) ----
    const fundBase = money(mrr - (Number(settings.monthly_operating_costs) || 0));
    const pct = Math.min(100, Math.max(0, Number(settings.allocation_pct) || 0));
    const fundBudget = money(Math.max(0, fundBase * pct / 100));

    // ---- Fulfillment capacity ----
    const capacityPartners = partners.filter((p) => p.verified && p.active);
    const coverageCities = {};
    capacityPartners.forEach((p) => {
      const cities = [p.city, ...(p.service_cities || [])].filter(Boolean);
      cities.forEach((city) => {
        const key = city.toLowerCase();
        coverageCities[key] = coverageCities[key] || { city, trucks: 0, contractors: 0, same_day_capable: false, partners: [] };
        coverageCities[key].trucks += Number(p.truck_capacity) || 1;
        coverageCities[key].contractors += 1;
        coverageCities[key].same_day_capable = coverageCities[key].same_day_capable || Boolean(p.same_day_capable);
        coverageCities[key].partners.push(p.name);
      });
    });

    // ---- Jobs & commissions ----
    const completedJobs = jobFin.filter((j) => j.job_status === 'completed');
    const platformCommissions = money(sum(completedJobs, (j) => Number(j.commission_earned) || 0));
    const jobRevenue = money(sum(completedJobs, (j) => Number(j.final_customer_price) || 0));

    // ---- Campaign portfolio ----
    const approvedCampaigns = campaigns.filter((c) => ['approved', 'paused', 'completed'].includes(c.status));
    const actualSpend = money(sum(campaigns, (c) => Number(c.actual_spend) || 0));
    const campaignOutcomes = approvedCampaigns.reduce((a, c) => {
      const r = c.results || {};
      a.inquiries += Number(r.inquiries) || 0;
      a.qualified_leads += Number(r.qualified_leads) || 0;
      a.bookings += Number(r.bookings) || 0;
      a.completed_jobs += Number(r.completed_jobs) || 0;
      a.platform_commission = money(a.platform_commission + (Number(r.platform_commission) || 0));
      return a;
    }, { inquiries: 0, qualified_leads: 0, bookings: 0, completed_jobs: 0, platform_commission: 0 });
    const cac = campaignOutcomes.bookings > 0 ? money(actualSpend / campaignOutcomes.bookings) : null;
    const roas = actualSpend > 0 ? money((jobRevenue > 0 ? platformCommissions : campaignOutcomes.platform_commission) / actualSpend) : null;

    const retentionBase = paying.length + cancelled.length;
    return Response.json({
      contractors: {
        paying_count: paying.length,
        pipeline_count: pipeline.length,
        cancelled_count: cancelled.length,
        retention_rate: retentionBase > 0 ? money((paying.length / retentionBase) * 100) : null,
        mrr,
        net_mrr: netMrr,
        activation_collected: activationCollected,
        paypal_collected: paypalCollected,
        failed_payments: failedPayments,
        plans: Object.values(plans),
        pipeline: pipeline.map((l) => ({ company: l.company, plan: l.plan, monthly_fee: money(monthlyOf(l)), status: l.status })),
        cancelled_list: cancelled.map((l) => ({ company: l.company, plan: l.plan, status: l.status })),
      },
      cash: {
        ledger_income: money(sum(incomeTx, (t) => t.amount)),
        ledger_expenses: money(sum(expenseTx, (t) => t.amount)),
        ledger_count: finTx.length,
        available_reserve: Number(settings.available_cash_reserve) || 0,
        marketing_spend_recorded: marketingSpend,
      },
      fund: {
        allocation_pct: pct,
        monthly_operating_costs: Number(settings.monthly_operating_costs) || 0,
        base_revenue: mrr,
        fund_base: fundBase,
        planning_budget: fundBudget,
        contributions_program_status: settings.contributions_program_status || 'off',
        settings_id: settings.id || null,
      },
      contributions: contributions.map((c) => ({
        id: c.id, partner_name: c.partner_name, partner_email: c.partner_email,
        territory_cities: c.territory_cities, monthly_limit: Number(c.monthly_limit) || 0,
        status: c.status, authorized_date: c.authorized_date,
      })),
      contributions_active_total: money(sum(contributions.filter((c) => c.status === 'active'), (c) => Number(c.monthly_limit) || 0)),
      coverage: Object.values(coverageCities).sort((a, b) => b.trucks - a.trucks),
      jobs: {
        completed_count: completedJobs.length,
        platform_commissions: platformCommissions,
        job_revenue: jobRevenue,
        bookings_total: bookings.length,
      },
      campaigns: {
        list: campaigns.map((c) => ({
          id: c.id, name: c.name, status: c.status, target_region: c.target_region, target_city: c.target_city,
          service_category: c.service_category, planned_monthly_budget: Number(c.planned_monthly_budget) || 0,
          evidence: c.evidence || [], lead_cost_estimate: Number(c.lead_cost_estimate) || 0,
          conversion_rate_estimate: Number(c.conversion_rate_estimate) || 0,
          est_monthly_bookings: Number(c.est_monthly_bookings) || 0,
          est_platform_commission: Number(c.est_platform_commission) || 0,
          fulfillment_cities: c.fulfillment_cities || [], capacity_note: c.capacity_note || '',
          risk_assessment: c.risk_assessment || '', actual_spend: Number(c.actual_spend) || 0,
          results: c.results || {}, attribution_note: c.attribution_note || '', notes: c.notes || '',
        })),
        approved_count: approvedCampaigns.length,
        proposed_count: campaigns.filter((c) => c.status === 'proposed' || c.status === 'pending_approval').length,
        actual_spend: actualSpend,
        outcomes: campaignOutcomes,
        customer_acquisition_cost: cac,
        return_on_ad_spend: roas,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}