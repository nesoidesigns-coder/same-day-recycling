import KpiCard from "@/components/admin/KpiCard";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function RevenueKpis({ data }) {
  const { gross, revenue: r, adjustments: a } = data;
  const ext = data.external_payments || null;
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#102B2A] mb-1">Gross transaction volume</h2>
        <p className="text-xs text-slate-500 mb-3">What customers pay contractors. This is NOT Same Day Recycling revenue.</p>
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <KpiCard label="Gross customer job value" value={money(gross.job_value)} sub="Quoted value, active + completed jobs" />
          <KpiCard label="Final invoiced" value={money(gross.invoiced)} sub="Completed job invoices" />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#102B2A] mb-1">Revenue earned by Same Day Recycling</h2>
        <p className="text-xs text-slate-500 mb-3">Each category is counted once. Jobs never double-count with memberships or software.</p>
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          <KpiCard label="Job commissions" value={money(r.job_commissions)} sub={`${money(r.job_commissions_outstanding)} outstanding`} tone="emerald" />
          <KpiCard label="Agreement platform fees" value={money(r.platform_fees)} sub="Per-contractor agreements" tone="emerald" />
          <KpiCard label="Contractor membership (MRR)" value={money(r.membership_mrr)} sub="Active agreements" tone="emerald" />
          <KpiCard label="Software subscriptions (MRR)" value={money(r.software_mrr)} sub="Active licenses" tone="emerald" />
          <KpiCard label="Software setup — collected" value={money(r.software_setup_collected)} sub={`${money(r.software_setup_agreed)} agreed in licenses`} tone="emerald" />
          <KpiCard label="Monthly recurring revenue" value={money(r.mrr)} sub="Membership + software only" />
        </div>
        <div className="mt-3 rounded-2xl bg-[#102B2A] text-white p-5 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-200/70">Total earned (recognised)</div>
          <div className="text-3xl font-bold text-[#54D9AE]">{money(r.total_earned)}</div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#102B2A] mb-3">Obligations, refunds and adjustments</h2>
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          <KpiCard label="Outstanding invoices" value={money(a.outstanding_invoices)} sub="Sent, not yet paid" tone="amber" />
          <KpiCard label="Contractor payouts" value={money(a.contractor_payouts)} sub="Recorded in ledger" />
          <KpiCard label="Refunds" value={money(a.booking_refunds + a.paypal_refunds + a.ledger_refunds)} sub="Bookings, PayPal, ledger" tone="red" />
          <KpiCard label="Adjustments" value={money(a.ledger_adjustments)} sub="Manual ledger entries" />
        </div>
      </section>

      {ext && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#102B2A] mb-1">Externally handled payments</h2>
          <p className="text-xs text-slate-500 mb-3">Customer settled outside Recycling OS (cash, e-transfer, contractor checkout). No platform transaction exists — unverified amounts are excluded from collected revenue until reconciled.</p>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <KpiCard label="Pending reconciliation" value={`${ext.pending.count} · ${money(ext.pending.amount)}`} sub="Excluded from collected revenue until verified" tone="amber" />
            <KpiCard label="Reconciled externally" value={`${ext.verified.count} · ${money(ext.verified.amount)}`} sub="Verified against the books" tone="emerald" />
          </div>
        </section>
      )}
    </div>
  );
}