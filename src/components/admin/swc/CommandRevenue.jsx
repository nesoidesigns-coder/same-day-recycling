import { TrendingUp, DollarSign, CreditCard, Receipt } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { money, statusBadge, NotTracked } from "./shared";

const purposeLabel = { license_setup: "Setup fee", license_subscription: "Subscription", booking_quote: "Booking quote", white_label_setup: "White label setup", white_label_subscription: "White label sub" };

export default function CommandRevenue({ licenses, transactions }) {
  const active = licenses.filter((l) => l.status === "active");
  const mrr = active.reduce((s, l) => s + (Number(l.monthly_fee) || 0), 0);
  const setupRevenue = transactions.filter((t) => t.purpose === "license_setup" && t.status === "paid").reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const annualRunRate = mrr * 12;

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { icon: TrendingUp, label: "Monthly recurring", value: money(mrr), sub: `${active.length} active license${active.length === 1 ? "" : "s"}` },
          { icon: DollarSign, label: "Annual run rate", value: money(annualRunRate), sub: "MRR × 12" },
          { icon: CreditCard, label: "Setup revenue", value: money(setupRevenue), sub: "All-time paid setups" },
          { icon: Receipt, label: "Transactions", value: String(transactions.length), sub: "All PayPal activity" },
        ].map((g) => (
          <div key={g.label} className="holo-panel-deep rounded-2xl border border-[#187B65]/20 p-5">
            <div className="flex items-center gap-2">
              <g.icon className="w-4 h-4 text-[#187B65]" />
              <div className="text-xs font-bold tracking-wide text-emerald-100/60 uppercase">{g.label}</div>
            </div>
            <div className="text-2xl font-bold text-[#54D9AE] mt-2 holo-glow-text">{g.value}</div>
            <div className="text-xs text-emerald-100/50 mt-1">{g.sub}</div>
          </div>
        ))}
      </div>

      <div className="holo-panel-deep rounded-2xl border border-[#187B65]/20 p-6 mb-8">
        <div className="text-sm font-bold text-[#54D9AE] mb-4">Transaction volume by day</div>
        {(() => {
          const byDay = {};
          transactions.forEach((t) => {
            const day = (t.created_date || "").slice(0, 10);
            if (day) byDay[day] = (byDay[day] || 0) + (Number(t.amount) || 0);
          });
          const data = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([day, total]) => ({ day: day.slice(5), total: Math.round(total * 100) / 100 }));
          if (!data.length) return <p className="text-sm text-emerald-100/50 py-6 text-center">No transactions in this period.</p>;
          return (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data}>
                <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} stroke="#1c4a3a" />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} stroke="#1c4a3a" width={56} />
                <Tooltip contentStyle={{ background: "#06251b", border: "1px solid rgba(24,123,101,0.4)", borderRadius: 12, color: "#e2f5ec" }} formatter={(v) => [money(v) + " CAD", "Volume"]} />
                <Bar dataKey="total" fill="#187B65" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          );
        })()}
      </div>

      <h2 className="text-sm font-bold tracking-wide text-emerald-100/60 uppercase mb-3">PayPal transactions</h2>
      <div className="space-y-2">
        {transactions.length === 0 && (
          <div className="holo-panel-deep rounded-2xl border border-[#187B65]/20 p-10 text-center text-emerald-100/50">
            No payment transactions yet.
          </div>
        )}
        {transactions.map((t) => (
          <div key={t.id} className="holo-panel-deep rounded-xl border border-[#187B65]/20 px-5 py-3.5 flex flex-wrap items-center gap-3">
            <span className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 ${statusBadge(t.status === "active" ? "active" : t.status === "paid" ? "active" : "")}`}>{t.status}</span>
            <span className="text-sm font-bold text-[#54D9AE]">{purposeLabel[t.purpose] || t.purpose}</span>
            <span className="text-sm text-emerald-100/60">{t.customer_email || t.paypal_payer_email || <NotTracked label="no payer" />}</span>
            <span className="ml-auto text-sm font-bold text-[#54D9AE]">{money(t.amount)} {t.currency || "CAD"}</span>
            <span className="text-xs text-emerald-100/40 w-24 text-right">{(t.created_date || "").slice(0, 10) || ""}</span>
          </div>
        ))}
      </div>
    </>
  );
}