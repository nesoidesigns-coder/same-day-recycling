import { Kpi, Section, EmptyNote, money } from "./growthShared";

export default function FinancialsTab({ data }) {
  const c = data?.contractors;
  const cash = data?.cash;
  const jobs = data?.jobs;
  return (
    <div className="space-y-4">
      <Section title="Contractor subscription revenue" note="Collected and paying records only. Trials, unpaid subscriptions and failed transactions are never counted as revenue.">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Active paying contractors" value={c?.paying_count ?? 0} sub={`${c?.pipeline_count ?? 0} in onboarding (not yet collected)`} />
          <Kpi label="Monthly recurring revenue" value={c?.mrr ? money(c.mrr) : null} empty={!c?.mrr} tone="accent" sub="Verified paying subscriptions" />
          <Kpi label="Activation fees collected" value={c?.activation_collected || c?.paypal_collected ? money((Number(c.activation_collected) || 0) + (Number(c.paypal_collected) || 0)) : null} empty={!(c?.activation_collected || c?.paypal_collected)} sub="Paid license invoices + captured subscription payments" />
          <Kpi label="Contractor retention" value={c?.retention_rate != null ? `${c.retention_rate}%` : null} empty={c?.retention_rate == null} sub={`${c?.cancelled_count ?? 0} cancelled`} />
        </div>
        {(c?.plans?.length || c?.pipeline?.length) ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {c.plans.length > 0 && (
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">Paying plans</p>
                <ul className="mt-2 space-y-1 text-sm text-[#102B2A]">
                  {c.plans.map((p) => <li key={p.plan}>{p.plan} · {money(p.monthly_fee)}/mo · {p.contractors} operator(s) · {money(p.monthly_revenue)}/mo</li>)}
                </ul>
              </div>
            )}
            {c.pipeline.length > 0 && (
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase text-slate-500">Onboarding pipeline (not revenue)</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-500">
                  {c.pipeline.map((l, i) => <li key={i}>{l.company || "License"} · {l.plan || "plan"} · {money(l.monthly_fee)}/mo · {l.status}</li>)}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4"><EmptyNote>No paying contractor subscriptions on record yet. Revenue figures appear only from actual paid subscriptions and invoices.</EmptyNote></div>
        )}
        {(c?.failed_payments > 0) && <p className="mt-3 text-sm font-semibold text-red-600">{c.failed_payments} failed payment(s) recorded — excluded from collected revenue.</p>}
      </Section>

      <Section title="Operating cash (verified ledger)" note="From the Same Day Recycling transaction ledger. Includes taxes where recorded; revenue figures exclude nothing the ledger captured.">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Recorded income" value={cash?.ledger_income ? money(cash.ledger_income) : null} empty={!cash?.ledger_income} sub={`${cash?.ledger_count ?? 0} ledger entries`} />
          <Kpi label="Recorded expenses" value={cash?.ledger_expenses ? money(cash.ledger_expenses) : null} empty={!cash?.ledger_expenses} />
          <Kpi label="Marketing spend recorded" value={cash?.marketing_spend_recorded ? money(cash.marketing_spend_recorded) : null} empty={!cash?.marketing_spend_recorded} sub="Ledger marketing-category expenses" />
          <Kpi label="Cash reserve on file" value={cash?.available_reserve ? money(cash.available_reserve) : null} empty={!cash?.available_reserve} sub="Owner-verified in Growth Fund settings" />
        </div>
        {(cash?.ledger_count ?? 0) === 0 && <div className="mt-4"><EmptyNote>The transaction ledger is empty — connect actual payments or record transactions for verified cash figures.</EmptyNote></div>}
      </Section>

      <Section title="Job economics (verified completions only)">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Completed jobs" value={jobs?.completed_count ?? 0} sub={`${jobs?.bookings_total ?? 0} total bookings on record`} />
          <Kpi label="Job revenue (final prices)" value={jobs?.job_revenue ? money(jobs.job_revenue) : null} empty={!jobs?.job_revenue} />
          <Kpi label="Platform commissions" value={jobs?.platform_commissions ? money(jobs.platform_commissions) : null} empty={!jobs?.platform_commissions} sub="Per signed contractor agreements" />
          <Kpi label="Failed payments" value={c?.failed_payments ?? 0} sub="Never counted as revenue" />
        </div>
      </Section>
    </div>
  );
}