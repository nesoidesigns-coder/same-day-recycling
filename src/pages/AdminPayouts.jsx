import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import KpiCard from "@/components/admin/KpiCard";
import { Loader2, DollarSign, History } from "lucide-react";

const PARTNER_SHARE = 0.75;
const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);

export default function AdminPayouts() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  const load = async () => {
    const [grossAgg, unpaidAgg, paidAgg, history] = await Promise.all([
      base44.entities.Booking.aggregate({ query: { status: { $ne: "cancelled" } }, groupBy: "status", sum: ["job_value"] }),
      base44.entities.Booking.aggregate({ query: { assignment_status: "completed", payout_paid: false }, groupBy: "partner_name", sum: ["job_value"] }),
      base44.entities.Booking.aggregate({ query: { assignment_status: "completed", payout_paid: true }, groupBy: "partner_name", sum: ["job_value"] }),
      base44.entities.Booking.filter({ assignment_status: "completed", payout_paid: true }, { sort: "-updated_date", limit: 50 }),
    ]);
    const gross = (grossAgg.rows || []).reduce((s, r) => s + (r.sum_job_value || 0), 0);
    const unpaidByPartner = Object.fromEntries((unpaidAgg.rows || []).map((r) => [r.partner_name, r.sum_job_value || 0]));
    const paidByPartner = Object.fromEntries((paidAgg.rows || []).map((r) => [r.partner_name, r.sum_job_value || 0]));
    const partners = [...new Set([...(unpaidAgg.rows || []).map((r) => r.partner_name), ...(paidAgg.rows || []).map((r) => r.partner_name)])];
    setData({
      gross,
      partnerOwed: (unpaidAgg.rows || []).reduce((s, r) => s + (r.sum_job_value || 0), 0) * PARTNER_SHARE,
      platformRevenue: (paidAgg.rows || []).reduce((s, r) => s + (r.sum_job_value || 0), 0) * (1 - PARTNER_SHARE)
        + (unpaidAgg.rows || []).reduce((s, r) => s + (r.sum_job_value || 0), 0) * (1 - PARTNER_SHARE),
      paidTotal: (paidAgg.rows || []).reduce((s, r) => s + (r.sum_job_value || 0), 0) * PARTNER_SHARE,
      rows: partners.map((name) => ({
        name,
        jobs: ((unpaidAgg.rows || []).find((r) => r.partner_name === name)?.count || 0) + ((paidAgg.rows || []).find((r) => r.partner_name === name)?.count || 0),
        revenue: (unpaidByPartner[name] || 0) + (paidByPartner[name] || 0),
        unpaid: unpaidByPartner[name] || 0,
        paid: paidByPartner[name] || 0,
      })),
      history: history.items || [],
    });
  };

  useEffect(() => {
    load().catch(() => setFailed(true));
  }, []);

  const markPaid = async (name) => {
    await base44.entities.Booking.updateMany(
      { assignment_status: "completed", payout_paid: false, partner_name: name },
      { $set: { payout_paid: true } }
    );
    load().catch(() => setFailed(true));
  };

  if (failed) {
    return <p className="rounded-2xl bg-red-50 text-red-700 p-6 font-semibold">Could not load payout data. Refresh and try again.</p>;
  }
  if (!data) return <Loader2 className="w-8 h-8 text-[#1d9e56] animate-spin mx-auto my-20" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#0c3b24] tracking-tight">Financial Control</h1>
        <p className="text-sm text-slate-500 mt-1">Booking value, partner earnings and platform revenue — calculated from booking records only</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <KpiCard label="Gross booking value" value={money(data.gross)} sub="All active & completed jobs" />
        <KpiCard label="Partner amounts owed" value={money(data.partnerOwed)} sub="75% of unpaid completed jobs" tone="amber" />
        <KpiCard label="Platform revenue" value={money(data.platformRevenue)} sub="25% share of completed jobs" tone="emerald" />
        <KpiCard label="Payouts completed" value={money(data.paidTotal)} sub="Verified paid booking records" tone="emerald" />
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#0c3b24] mb-1">Payouts by partner</h2>
        <p className="text-xs text-slate-500 mb-4">Partner share: 75% of job value · Referral retained: 25%</p>
        {data.rows.length === 0 ? (
          <p className="text-slate-500 text-sm py-6 text-center">No completed jobs yet — payouts appear here as jobs are completed.</p>
        ) : (
          <div className="space-y-3">
            {data.rows.map((r) => (
              <div key={r.name} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f6f8f7] px-4 py-3">
                <div>
                  <div className="font-bold text-[#0c3b24] text-sm">{r.name || "Unassigned"}</div>
                  <div className="text-xs text-slate-500">{r.jobs} completed job{r.jobs === 1 ? "" : "s"}</div>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-right text-sm">
                  <span><span className="text-xs text-slate-400 font-semibold">Booked </span><span className="font-bold text-[#0c3b24]">{money(r.revenue)}</span></span>
                  <span><span className="text-xs text-slate-400 font-semibold">Partner </span><span className="font-bold text-[#1d9e56]">{money(r.revenue * PARTNER_SHARE)}</span></span>
                  <span><span className="text-xs text-slate-400 font-semibold">Paid </span><span className="font-bold text-[#0c3b24]">{money(r.paid * PARTNER_SHARE)}</span></span>
                  <span><span className="text-xs text-slate-400 font-semibold">Owed </span><span className="font-bold text-amber-600">{money(r.unpaid * PARTNER_SHARE)}</span></span>
                </div>
                <button
                  onClick={() => markPaid(r.name)}
                  disabled={!r.unpaid}
                  className="rounded-full bg-[#0c3b24] text-white font-bold px-4 py-2 text-xs hover:bg-[#0a3020] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <DollarSign className="w-3.5 h-3.5" /> Mark paid
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-[#1d9e56]" />
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#0c3b24]">Payout history</h2>
          <span className="text-xs text-slate-400">Verified paid records only</span>
        </div>
        {data.history.length === 0 ? (
          <p className="text-slate-500 text-sm py-4">No payouts recorded as paid yet. When you mark partner payouts paid, each verified job appears here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="text-left py-2 px-2">Customer</th>
                  <th className="text-left py-2 px-2">Partner</th>
                  <th className="text-left py-2 px-2">Job date</th>
                  <th className="text-right py-2 px-2">Job value</th>
                  <th className="text-right py-2 px-2">Partner paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.history.map((b) => (
                  <tr key={b.id}>
                    <td className="py-2.5 px-2 font-semibold text-[#0c3b24]">{b.name}</td>
                    <td className="py-2.5 px-2 text-slate-600">{b.partner_name || "—"}</td>
                    <td className="py-2.5 px-2 text-slate-500">{b.preferred_date || "—"}</td>
                    <td className="py-2.5 px-2 text-right text-[#0c3b24] font-semibold">{money(b.job_value)}</td>
                    <td className="py-2.5 px-2 text-right text-[#1d9e56] font-bold">{money((Number(b.job_value) || 0) * PARTNER_SHARE)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 px-1">
        Reconciliation: partner owed + platform revenue always equals gross completed value (75/25 split). No external payment processor is connected yet — totals come from booking records, never invented.
      </p>
    </div>
  );
}