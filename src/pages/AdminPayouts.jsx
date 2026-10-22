import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import KpiCard from "@/components/admin/KpiCard";
import PayoutJobList from "@/components/admin/payouts/PayoutJobList";
import { Loader2, DollarSign } from "lucide-react";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Exact recorded amounts for one completed job — no fixed split anywhere.
// Legacy jobs completed before fee terms were recorded fall back to
// invoice minus referral commission, and are labelled as legacy.
function jobNumbers(b) {
  const invoice = Number(b.final_invoice) || Number(b.job_value) || 0;
  const snap = b.fee_terms_snapshot || {};
  const fee = b.platform_fee_amount != null ? Number(b.platform_fee_amount) || 0 : Number(snap.fee) || 0;
  const commission = Number(b.commission_earned) || 0;
  const refund = Number(b.refund_amount) || 0;
  const hasTerms = Boolean(snap.rule);
  const recordedNet = Number(b.contractor_net_amount);
  const contractorNet = hasTerms && Number.isFinite(recordedNet) ? recordedNet : Math.max(0, invoice - commission);
  return {
    id: b.id,
    name: b.name,
    partner_name: b.partner_name || "",
    preferred_date: b.preferred_date || "",
    invoice,
    fee,
    commission,
    refund,
    rule: snap.rule || "",
    disclosure: snap.disclosure || "",
    hasTerms,
    owed: Math.max(0, contractorNet - refund),
    payoutPaid: !!b.payout_paid,
  };
}

export default function AdminPayouts() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  const load = async () => {
    const [grossAgg, completedPage] = await Promise.all([
      base44.entities.Booking.aggregate({ query: { status: { $ne: "cancelled" } }, groupBy: "status", sum: ["job_value"] }),
      base44.entities.Booking.filter({ assignment_status: "completed" }, { sort: "-updated_date", limit: 200 }),
    ]);
    const gross = (grossAgg.rows || []).reduce((s, r) => s + (r.sum_job_value || 0), 0);
    const jobs = (completedPage.items || []).map(jobNumbers);
    const unpaid = jobs.filter((j) => !j.payoutPaid);
    const paid = jobs.filter((j) => j.payoutPaid);
    const sum = (list, key) => list.reduce((s, j) => s + j[key], 0);
    const names = [...new Set(jobs.map((j) => j.partner_name || "Unassigned"))];
    setData({
      gross,
      partnerOwed: sum(unpaid, "owed"),
      platformRevenue: sum(unpaid, "fee") + sum(unpaid, "commission") + sum(paid, "fee") + sum(paid, "commission"),
      paidTotal: sum(paid, "owed"),
      rows: names.map((name) => {
        const mine = jobs.filter((j) => (j.partner_name || "Unassigned") === name);
        const mineUnpaid = unpaid.filter((j) => (j.partner_name || "Unassigned") === name);
        const minePaid = paid.filter((j) => (j.partner_name || "Unassigned") === name);
        return {
          name,
          jobs: mine.length,
          revenue: sum(mine, "invoice"),
          unpaid: sum(mineUnpaid, "owed"),
          paid: sum(minePaid, "owed"),
          unpaidJobs: mineUnpaid,
        };
      }),
      unpaid,
      paid,
    });
  };

  useEffect(() => {
    load().catch(() => setFailed(true));
  }, []);

  const markPaid = async (name) => {
    await base44.entities.Booking.updateMany(
      { assignment_status: "completed", payout_paid: false, partner_name: name },
      { $set: { payout_paid: true, payout_paid_date: new Date().toISOString().slice(0, 10) } }
    );
    load().catch(() => setFailed(true));
  };

  const markOnePaid = async (job) => {
    await base44.entities.Booking.update(job.id, { payout_paid: true, payout_paid_date: new Date().toISOString().slice(0, 10) });
    load().catch(() => setFailed(true));
  };

  if (failed) {
    return <p className="rounded-2xl bg-red-50 text-red-700 p-6 font-semibold">Could not load payout data. Refresh and try again.</p>;
  }
  if (!data) return <Loader2 className="w-8 h-8 text-[#187B65] animate-spin mx-auto my-20" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#102B2A] tracking-tight">Financial Control</h1>
        <p className="text-sm text-slate-500 mt-1">Every number comes from the exact fee terms recorded on each job at assignment — no fixed percentages</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <KpiCard label="Gross booking value" value={money(data.gross)} sub="All active & completed jobs" />
        <KpiCard label="Contractor amounts owed" value={money(data.partnerOwed)} sub="Net after each job's exact fee terms" tone="amber" />
        <KpiCard label="Platform earnings" value={money(data.platformRevenue)} sub="Recorded fees + referral commissions on completed jobs" tone="emerald" />
        <KpiCard label="Payouts completed" value={money(data.paidTotal)} sub="Net amounts marked paid" tone="emerald" />
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#102B2A] mb-1">Payouts by partner</h2>
        <p className="text-xs text-slate-500 mb-4">Totals use each job's recorded fee terms — percentage, fixed, or no-fee agreements all shown exactly</p>
        {data.rows.length === 0 ? (
          <p className="text-slate-500 text-sm py-6 text-center">No completed jobs yet — payouts appear here as jobs are completed.</p>
        ) : (
          <div className="space-y-3">
            {data.rows.map((r) => (
              <div key={r.name} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f6f8f7] px-4 py-3">
                <div>
                  <div className="font-bold text-[#102B2A] text-sm">{r.name}</div>
                  <div className="text-xs text-slate-500">{r.jobs} completed job{r.jobs === 1 ? "" : "s"}</div>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-right text-sm">
                  <span><span className="text-xs text-slate-400 font-semibold">Invoiced </span><span className="font-bold text-[#102B2A]">{money(r.revenue)}</span></span>
                  <span><span className="text-xs text-slate-400 font-semibold">Paid </span><span className="font-bold text-[#187B65]">{money(r.paid)}</span></span>
                  <span><span className="text-xs text-slate-400 font-semibold">Owed </span><span className="font-bold text-amber-600">{money(r.unpaid)}</span></span>
                </div>
                <button
                  onClick={() => markPaid(r.name)}
                  disabled={!r.unpaid}
                  className="rounded-full bg-[#102B2A] text-white font-bold px-4 py-2 text-xs hover:bg-[#0a3020] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5" /> Mark paid
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#102B2A] mb-1">Per-job earnings breakdown — owed</h2>
        <p className="text-xs text-slate-500 mb-4">Invoice, exact fee terms applied, referral commission, refunds and contractor net for every unpaid completed job</p>
        <PayoutJobList jobs={data.unpaid} onMarkOne={markOnePaid} />
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#102B2A] mb-1">Payout history — paid</h2>
        <p className="text-xs text-slate-500 mb-4">Verified paid jobs with the exact fee terms that applied to each</p>
        <PayoutJobList jobs={data.paid} paid onMarkOne={markOnePaid} />
      </div>

      <p className="text-xs text-slate-400 px-1">
        Fee terms are captured per job when a contractor is assigned (their active agreement at that moment) and finalized at completion. Jobs completed before per-job fee terms existed are marked "legacy" — their contractor net is the invoice minus any referral commission, with no platform fee assumed.
      </p>
    </div>
  );
}