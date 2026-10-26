import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, DollarSign, Receipt, TrendingUp } from "lucide-react";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-CA");
const panel = "relative overflow-hidden rounded-2xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm";
const label = "text-[10px] font-bold uppercase tracking-[0.25em] text-[#187B65]/90";

// Contractor financial transparency — scoped to this partner's own jobs only.
export default function Financials() {
  const [data, setData] = useState(null); // null = loading, false = unavailable

  useEffect(() => {
    base44.functions.invoke("partnerPortal", { action: "earnings" })
      .then((r) => setData(r.data))
      .catch(() => setData(false));
  }, []);

  if (data === null) {
    return (
      <div className={`${panel} p-8 text-center`}>
        <Loader2 className="w-6 h-6 text-[#187B65] animate-spin mx-auto" />
      </div>
    );
  }
  if (!data) return null;

  const cards = [
    { icon: <Receipt className="w-4 h-4 text-[#187B65]" />, label: "Completed jobs", value: data.completed_jobs, sub: "assigned to you" },
    { icon: <TrendingUp className="w-4 h-4 text-[#187B65]" />, label: "Revenue from customers you sourced", value: money(data.revenue_independent), sub: "100% yours" },
    { icon: <DollarSign className="w-4 h-4 text-[#187B65]" />, label: "Revenue from platform-generated jobs", value: money(data.revenue_platform_generated), sub: "before fees" },
    { icon: <DollarSign className="w-4 h-4 text-[#187B65]" />, label: "Platform fees applied", value: money(data.platform_fees), sub: "per your agreement" },
    { icon: <DollarSign className="w-4 h-4 text-[#187B65]" />, label: "Subscription charges", value: money(data.membership_charges_monthly), sub: "monthly, if applicable" },
    { icon: <DollarSign className="w-4 h-4 text-[#187B65]" />, label: "Refunds / adjustments", value: money(data.refunds), sub: "recorded refunds" },
  ];

  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-white tracking-tight mb-2">Your financials</h2>
      <p className="text-xs text-emerald-100/40 mb-4">
        {data.agreement?.disclosure || "No platform fee applies to your jobs unless agreed in writing."}
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        {cards.map((c) => (
          <div key={c.label} className={`${panel} p-4`}>
            <div className={label}>{c.label}</div>
            <div className="text-xl font-bold text-white mt-2 tabular-nums flex items-center gap-1.5">{c.icon}{c.value}</div>
            <p className="text-[11px] text-emerald-100/40 mt-1">{c.sub}</p>
          </div>
        ))}
        <div className={`${panel} p-4 border-[#187B65]/50`}>
          <div className={label}>Net earnings after platform fees</div>
          <div className="text-xl font-bold text-[#187B65] holo-glow-text mt-2 tabular-nums">{money(data.net_earnings)}</div>
          <p className="text-[11px] text-emerald-100/40 mt-1">Gross job revenue − fees − refunds</p>
        </div>
      </div>
      <div className={`${panel} p-4`}>
        <div className={label} style={{ marginBottom: 10 }}>Payment history</div>
        {(data.payments || []).length === 0 ? (
          <p className="text-xs text-emerald-100/40">No completed jobs recorded yet — financial rows appear as jobs finish.</p>
        ) : (
          <div className="space-y-2">
            {data.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#0a2b1e]/50 px-3 py-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{p.customer}</div>
                  <div className="text-[10px] text-emerald-100/40">{p.date || "—"} · {String(p.source).replace(/_/g, " ")}</div>
                </div>
                <div className="text-right shrink-0 tabular-nums">
                  <div className="text-xs font-bold text-[#187B65]">{money(p.net)}</div>
                  <div className={`text-[10px] font-bold ${p.paid ? "text-[#187B65]" : "text-amber-300"}`}>{p.paid ? "Paid" : "Unpaid"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}