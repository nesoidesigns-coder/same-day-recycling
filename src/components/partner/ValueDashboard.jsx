import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Briefcase, CheckCircle2, DollarSign, Receipt, Tag, Calculator, Network, UserCheck, TrendingUp } from "lucide-react";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-CA");
const panel = "relative overflow-hidden rounded-2xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm";
const label = "text-[10px] font-bold uppercase tracking-[0.25em] text-[#187B65]/90";

// Contractor value dashboard: what the network is actually worth to you,
// computed from your own job records. Every figure marked "actual" comes
// straight from recorded jobs and your agreement — projections are labelled.
export default function ValueDashboard() {
  const [data, setData] = useState(null); // null = loading, false = unavailable

  useEffect(() => {
    Promise.all([
      base44.functions.invoke("partnerPortal", { action: "reporting" }),
      base44.functions.invoke("partnerPortal", { action: "earnings" }),
    ])
      .then(([r, e]) => setData(r.data?.error ? false : { rep: r.data, earn: e.data?.error ? null : e.data }))
      .catch(() => setData(false));
  }, []);

  if (data === null) {
    return <div className={`${panel} p-8 mb-10 text-center`}><Loader2 className="w-6 h-6 text-[#187B65] animate-spin mx-auto" /></div>;
  }
  if (!data) return null;

  const rep = data.rep || {};
  const earn = data.earn || {};
  const networkRevenue = Number(earn.revenue_platform_generated) || 0;
  const ownRevenue = (Number(earn.revenue_independent) || 0) + (Number(earn.revenue_other_referrals) || 0);
  const total = networkRevenue + ownRevenue;

  const cards = [
    { icon: <Briefcase className="w-4 h-4 text-[#187B65]" />, tone: "actual", label: "Job opportunities received", value: Number(rep.jobs_offered) || 0, sub: "jobs dispatch offered to you" },
    { icon: <CheckCircle2 className="w-4 h-4 text-[#187B65]" />, tone: "actual", label: "Jobs accepted & completed", value: `${rep.acceptance_rate === null ? "—" : rep.acceptance_rate + "% accepted"} · ${rep.completed_jobs} completed`, sub: "from your own job records" },
    { icon: <DollarSign className="w-4 h-4 text-[#187B65]" />, tone: "actual", label: "Gross job revenue (reported)", value: money(rep.gross_job_value), sub: "completed and paid jobs" },
    { icon: <Receipt className="w-4 h-4 text-[#187B65]" />, tone: "actual", label: "Membership cost", value: `${money(rep.membership_mrr)}/mo`, sub: "your active agreement's monthly rate" },
    { icon: <Tag className="w-4 h-4 text-[#187B65]" />, tone: "actual", label: "Referral & dispatch fees", value: money(rep.platform_fees_paid), sub: "fees paid on completed jobs" },
    { icon: <Calculator className="w-4 h-4 text-[#187B65]" />, tone: "estimate", label: "Est. customer acquisition cost", value: rep.effective_acquisition_cost === null ? "Not measurable yet" : `${money(rep.effective_acquisition_cost)} / job`, sub: "(fees + membership) ÷ platform jobs completed" },
    { icon: <Network className="w-4 h-4 text-[#187B65]" />, tone: "actual", label: "Revenue from network bookings", value: money(networkRevenue), sub: "jobs the platform generated for you" },
  ];

  const totalValue = total > 0 ? Math.max(Math.round((networkRevenue / total) * 100), 1) : 0;

  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-white tracking-tight mb-1">Network value</h2>
      <p className="text-xs text-emerald-100/40 mb-4">
        Verified actuals from your own job records and agreement. Nothing here is a projection or promise of future work.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.label} className={`${panel} p-4`}>
            <div className="flex items-center justify-between gap-2">
              <span className={label}>{c.label}</span>
              <span className={`shrink-0 rounded-full border px-1.5 py-px text-[8px] font-bold uppercase tracking-wider ${c.tone === "actual" ? "bg-[#187B65]/10 border-[#187B65]/40 text-[#187B65]" : "bg-amber-400/10 border-amber-400/30 text-amber-300"}`}>
                {c.tone === "actual" ? "Actual" : "Estimate"}
              </span>
            </div>
            <div className="text-lg font-bold text-white mt-2 tabular-nums flex items-center gap-1.5">{c.icon}{c.value}</div>
            <p className="text-[11px] text-emerald-100/40 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className={`${panel} p-5 mt-3`}>
        <div className="flex items-center gap-2 mb-3">
          <UserCheck className="w-4 h-4 text-[#187B65]" />
          <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-white">Your customers: self-generated vs network-generated</h3>
        </div>
        {total > 0 ? (
          <>
            <div className="flex h-3 rounded-full overflow-hidden bg-[#0a2b1e]">
              <div className="h-full bg-[#187B65]" style={{ width: `${totalValue}%` }} />
              <div className="h-full bg-emerald-100/30" style={{ width: `${100 - totalValue}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-emerald-100/50 text-xs">Self-generated (yours to keep)</span>
                <div className="font-bold text-white tabular-nums">{money(ownRevenue)} <span className="text-emerald-100/40 text-xs">({100 - totalValue}%)</span></div>
              </div>
              <div>
                <span className="text-emerald-100/50 text-xs">Network-generated</span>
                <div className="font-bold text-[#187B65] tabular-nums">{money(networkRevenue)} <span className="text-emerald-100/40 text-xs">({totalValue}%)</span></div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-emerald-100/50">No completed jobs recorded yet — the split appears after your first completed job.</p>
        )}
        <p className="text-[11px] text-emerald-100/40 mt-3">
          Revenue attributed to network bookings counts platform-generated jobs; self-generated includes customers you acquired
          yourself and your own referrals. Estimates are labelled; every other figure is an actual from recorded jobs.
        </p>
      </div>

      {earn.net_earnings !== undefined && (
        <div className={`${panel} px-5 py-4 mt-3 flex items-center justify-between gap-3`}>
          <span className="flex items-center gap-2 text-sm font-bold text-white"><TrendingUp className="w-4 h-4 text-[#187B65]" /> Net earnings after fees &amp; refunds</span>
          <span className="font-bold text-[#187B65] tabular-nums holo-glow-text">{money(earn.net_earnings)}</span>
        </div>
      )}
    </div>
  );
}