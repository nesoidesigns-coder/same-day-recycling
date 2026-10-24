import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const round = (n) => Math.round((Number(n) || 0) * 100) / 100;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Number(v) || 0));

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const payload = await req.json().catch(() => ({}));
    const jobsPerDay = clamp(payload.jobs_per_day, 0, 100);
    const subscribers = clamp(payload.contractor_subscribers, 0, 500);
    const costIncrease = clamp(payload.cost_increase_pct, -90, 300);
    const extraJobs = clamp(payload.extra_monthly_jobs, 0, 5000);

    const lt = await base44.functions.invoke('businessLifetime', {});
    const life = lt?.data ?? lt;
    const L = life?.lifetime || {};

    const avgCommission = Number(L.avg_commission_per_job) || 0;
    const avgJobValue = Number(L.avg_job_value) || 0;
    const monthlyJobs = Number(L.avg_monthly_completed_jobs) || 0;
    const monthlyExpenses = Number(L.avg_monthly_expenses) || 0;
    const monthlyOsRevenue = Number(L.avg_monthly_os_revenue) || 0;
    const activeContractors = Number(L.active_contractors) || 0;

    // Per-subscriber software revenue: verified only if OS revenue exists.
    const perSubscriber = monthlyOsRevenue > 0 && activeContractors > 0
      ? round(monthlyOsRevenue / activeContractors)
      : null;

    const scenarioJobs = round(jobsPerDay * 30.44 + extraJobs);
    const scenarioPlatformRevenue = round(scenarioJobs * avgCommission);
    const subscriptionNote = perSubscriber === null
      ? 'No verified OS subscription revenue exists yet, so subscription revenue is modelled at $0 — record software revenue in the ledger to model it.'
      : `Per-subscriber monthly revenue of $${perSubscriber} derived from verified OS revenue ÷ active contractors.`;
    const scenarioOsRevenue = perSubscriber === null ? 0 : round(subscribers * perSubscriber);
    const scenarioRevenue = round(scenarioPlatformRevenue + scenarioOsRevenue);

    const payoutPerJob = avgJobValue > 0 ? round(Math.max(0, avgJobValue - avgCommission)) : 0;
    const scenarioExpenses = round(monthlyExpenses * (1 + costIncrease / 100) + scenarioJobs * payoutPerJob);
    const scenarioNet = round(scenarioRevenue - scenarioExpenses);
    const scenarioMargin = scenarioRevenue > 0 ? round((scenarioNet / scenarioRevenue) * 100) : null;

    const baselineRevenue = round(monthlyJobs * avgCommission + monthlyOsRevenue);
    const baselineExpenses = round(monthlyExpenses + monthlyJobs * payoutPerJob);

    // Capacity: 3 completed jobs per contractor per operating day (assumption).
    const contractorsNeeded = jobsPerDay > 0 ? Math.ceil(jobsPerDay / 3) : 0;
    const gap = contractorsNeeded > activeContractors
      ? `${contractorsNeeded - activeContractors} more contractor(s) than currently active — recruitment required first`
      : contractorsNeeded > 0
        ? 'Within current active contractor capacity'
        : 'No change in job volume requested';

    const risks = [];
    if (contractorsNeeded > activeContractors && contractorsNeeded > 0) risks.push(`Capacity: the scenario needs ${contractorsNeeded} active contractors but only ${activeContractors} are active today. Revenue only materializes after verified recruitment.`);
    if (perSubscriber === null && subscribers > 0) risks.push('Subscription revenue is modelled at $0 because no verified OS revenue exists yet — the projection understates that stream.');
    if (scenarioNet < 0) risks.push('Margin: this scenario loses money monthly at current price assumptions — increase job value, commissions, or control costs before pursuing it.');
    if (scenarioMargin !== null && scenarioMargin < 15 && scenarioNet >= 0) risks.push('Margin: net margin under 15% leaves little room for surprises (fuel spikes, refund disputes, seasonality).');
    if (!life?.inception_date) risks.push('Baseline: no booking history exists yet — the simulation has almost no verified data to stand on.');

    return Response.json({
      generated_at: new Date().toISOString(),
      basis_summary: `${monthlyJobs} completed jobs/mo average, $${avgCommission} commission per job, $${round(monthlyExpenses)} monthly expenses`,
      baseline: {
        monthly_platform_revenue: round(monthlyJobs * avgCommission),
        monthly_os_revenue: monthlyOsRevenue,
        monthly_expenses: baselineExpenses,
      },
      scenario: {
        monthly_jobs: scenarioJobs,
        monthly_platform_revenue: scenarioPlatformRevenue,
        monthly_os_revenue: scenarioOsRevenue,
        monthly_revenue: scenarioRevenue,
        monthly_expenses: scenarioExpenses,
        monthly_net_estimate: scenarioNet,
        monthly_margin_pct: scenarioMargin,
      },
      twelve_month: {
        platform_revenue: round(scenarioPlatformRevenue * 12),
        os_revenue: round(scenarioOsRevenue * 12),
        expenses: round(scenarioExpenses * 12),
        net_estimate: round(scenarioNet * 12),
      },
      capacity: {
        contractors_needed: contractorsNeeded,
        contractors_active: activeContractors,
        gap,
        assumption: 'Assumes 3 completed jobs per contractor per operating day — a stated assumption, not a verified rate.',
      },
      assumptions: [
        `Commission per completed job: $${avgCommission} (from ${L.completed_jobs || 0} completed booking records).`,
        `Average job value: $${avgJobValue}; contractor payout per job modelled at $${payoutPerJob}.`,
        `Baseline completed jobs per month: ${monthlyJobs} (lifetime average since inception).`,
        `Operating expenses per month: $${monthlyExpenses} (verified paid expense records only), adjusted ${costIncrease >= 0 ? '+' : ''}${costIncrease}%.`,
        subscriptionNote,
        'Per-job margins assume today\'s pricing carries over; taxes are not modelled.',
      ],
      risks,
      disclaimer: 'HYPOTHETICAL SIMULATION. Straight-line arithmetic on historical averages — not a forecast, not a guarantee, and not financial advice. Confirm with a professional before acting.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}