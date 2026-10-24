import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const round = (n) => Math.round((Number(n) || 0) * 100) / 100;
const num = (v) => (Number(v) || 0);
const items = (r) => (r && r.items ? r.items : Array.isArray(r) ? r : []);

// Owner-only strategic oversight of the Recycling OS software business.
// Read-only aggregation + AI strategic analysis. Never executes anything.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const [licensePage, ledgerPage, invoicePage, pickupPage, partnerCounts, licenseInvoiceOwners] = await Promise.all([
      base44.asServiceRole.entities.SoftwareLicense.list({ limit: 500, sort: '-created_date' }),
      base44.entities.RevenueLedger.list({ limit: 1000, sort: '-created_date' }),
      base44.asServiceRole.entities.LicenseInvoice.list({ limit: 1000, sort: '-created_date' }),
      base44.asServiceRole.entities.LicensePickup.list({ limit: 1000, sort: '-created_date' }),
      Promise.all([
        base44.asServiceRole.entities.Partner.count({ active: true }),
        base44.asServiceRole.entities.Partner.count({}),
      ]),
      base44.asServiceRole.entities.LicenseInvoice.list({ distinct: 'license_email' }),
    ]);
    const licenses = items(licensePage);
    const ledger = items(ledgerPage);
    const invoices = items(invoicePage);
    const pickups = items(pickupPage);
    const activePartners = num(partnerCounts[0]);
    const totalPartners = num(partnerCounts[1]);
    const adopters = items(licenseInvoiceOwners);

    const active = licenses.filter((l) => l.status === 'active');
    const cancelled = licenses.filter((l) => l.status === 'cancelled');
    const paused = licenses.filter((l) => l.status === 'paused');
    const mrr = round(active.reduce((n, l) => n + num(l.monthly_fee), 0));
    const byPlan = {};
    for (const l of active) {
      const k = l.plan || 'unknown';
      byPlan[k] = byPlan[k] || { plan: k, count: 0, mrr: 0 };
      byPlan[k].count += 1;
      byPlan[k].mrr = round(byPlan[k].mrr + num(l.monthly_fee));
    }
    const tenureMonths = (l) => {
      const start = l.started_date || String(l.created_date || '').slice(0, 10);
      if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) return null;
      return Math.max(0, Math.round((Date.now() - new Date(`${start}T00:00:00Z`).getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
    };
    const tenures = active.map(tenureMonths).filter((v) => v !== null);
    const avgTenure = tenures.length ? Math.round(tenures.reduce((a, b) => a + b, 0) / tenures.length) : null;
    const churnPct = active.length + cancelled.length > 0 ? Math.round((cancelled.length / (active.length + cancelled.length)) * 100) : null;

    const softwareRevenue = round(ledger.filter((l) => l.direction === 'revenue' && ['membership', 'software_subscription', 'software_setup'].includes(l.category)).reduce((n, l) => n + num(l.amount), 0));
    const commissions = round(ledger.filter((l) => l.direction === 'revenue' && l.category === 'job_commission').reduce((n, l) => n + num(l.amount), 0));

    const licenseEmails = new Set(licenses.map((l) => String(l.email || '').toLowerCase()).filter(Boolean));
    const invoiceAdopters = adopters.filter((e) => licenseEmails.has(String(e).toLowerCase())).length;
    const pickupAdopterEmails = new Set(pickups.map((p) => String(p.license_email || '').toLowerCase()).filter(Boolean));
    const pickupAdopters = [...licenseEmails].filter((e) => pickupAdopterEmails.has(e)).length;

    const metrics = {
      active_licenses: active.length,
      paused_licenses: paused.length,
      cancelled_licenses: cancelled.length,
      churn_pct: churnPct,
      mrr,
      arr: round(mrr * 12),
      mrr_by_plan: Object.values(byPlan),
      avg_tenure_months: avgTenure,
      software_revenue_lifetime: softwareRevenue,
      service_commission_lifetime: commissions,
      separation_note: 'Software revenue and service commissions are tracked in separate RevenueLedger categories and are never combined into one sales total.',
      adoption: {
        licenses_with_invoices: invoiceAdopters,
        licenses_with_pickups: pickupAdopters,
        invoices_total: invoices.length,
        invoices_paid: invoices.filter((i) => i.status === 'paid').length,
        pickups_total: pickups.length,
        adoption_rate_pct: licenses.length ? Math.round((Math.max(invoiceAdopters, pickupAdopters) / licenses.length) * 100) : null,
      },
      partners_active: activePartners,
      partners_total: totalPartners,
    };

    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are the strategic oversight advisor for the owner of Same Day Recycling (Recycling OS) — a Canadian contractor software platform plus a national customer-acquisition service network.\n' +
        'Evaluate the SOFTWARE business: subscription revenue and retention, cancellations, feature adoption, platform reliability signals, profitability by tier, national expansion readiness, and contractor outcomes.\n' +
        'STRICT RULES:\n' +
        '- Challenge unsupported assumptions explicitly. If the data is too thin to conclude something, say so — small samples and empty states are NOT trends.\n' +
        '- Never confuse projections with actual results. Label anything forward-looking as a projection with low/medium/high confidence.\n' +
        '- Software and service-network revenue stay separate; flag any framing that merges them.\n' +
        '- Never recommend consequential actions as approved — spending, pricing changes, publishing or agreements need the owner\'s explicit authorization.\n' +
        '- Data gaps go in data_gaps, not into invented numbers.\n' +
        '\nVERIFIED METRICS (JSON):\n' + JSON.stringify(metrics) +
        '\n\nReturn 2-5 strategic recommendations, each structured as: business_opportunity, verified_evidence (cite exact metrics), financial_implications, risks_and_uncertainties, recommended_next_action, confidence (low/medium/high).',
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          recommendations: { type: 'array', items: { type: 'object', properties: {
            business_opportunity: { type: 'string' },
            verified_evidence: { type: 'string' },
            financial_implications: { type: 'string' },
            risks_and_uncertainties: { type: 'string' },
            recommended_next_action: { type: 'string' },
            confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
          }, required: ['business_opportunity', 'verified_evidence', 'financial_implications', 'risks_and_uncertainties', 'recommended_next_action', 'confidence'] } },
        },
        required: ['summary', 'recommendations'],
      },
    });

    return Response.json({
      generated_at: new Date().toISOString(),
      metrics,
      analysis: {
        summary: String(ai.summary || '').slice(0, 3000),
        recommendations: (ai.recommendations || []).slice(0, 6),
      },
      data_gaps: [
        ...(licenses.length === 0 ? ['No software licenses exist yet — retention and tier analysis have no sample.'] : []),
        ...(avgTenure === null ? ['No tenure data: licenses lack start dates.'] : []),
        ...(churnPct === null ? ['Churn is undefined until at least one active or cancelled license exists.'] : []),
        'Subscription plan tiers ($349/$499/$999) are a PROPOSED allocation — current agreements and prices remain in force until the owner approves changes.',
      ],
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}