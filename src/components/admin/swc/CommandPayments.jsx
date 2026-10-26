import { useState } from "react";
import { CreditCard, CheckCircle2, Clock, XCircle, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUS_STYLE = {
  paid: { label: "Successful", cls: "bg-[#187B65]/15 text-[#54D9AE] border-[#187B65]/40", icon: CheckCircle2 },
  active: { label: "Active", cls: "bg-[#187B65]/15 text-[#54D9AE] border-[#187B65]/40", icon: CheckCircle2 },
  created: { label: "Pending", cls: "bg-amber-400/10 text-amber-300 border-amber-400/40", icon: Clock },
  failed: { label: "Failed", cls: "bg-red-500/10 text-red-300 border-red-500/40", icon: XCircle },
  cancelled: { label: "Cancelled", cls: "bg-white/5 text-emerald-100/50 border-white/10", icon: XCircle },
  refunded: { label: "Refunded", cls: "bg-white/10 text-slate-300 border-white/20", icon: RotateCcw },
};

const money = (n) => "$" + (Number(n) || 0).toLocaleString("en-CA", { minimumFractionDigits: 2 });

export default function CommandPayments({ transactions }) {
  const [refundingId, setRefundingId] = useState(null);
  const [note, setNote] = useState("");

  const refund = async (t) => {
    if (!window.confirm("Refund this payment in full via PayPal?")) return;
    setRefundingId(t.id);
    setNote("");
    try {
      const res = await base44.functions.invoke("paypalCheckout", { action: "refund", order_id: t.paypal_order_id });
      setNote(`Refund ${res?.data?.refund_status || "processed"} — refresh to see the updated log.`);
    } catch (e) {
      setNote("Refund failed: " + ((e && e.message) || "no details returned — check payment settings"));
    } finally {
      setRefundingId(null);
    }
  };

  const successful = transactions.filter((t) => t.status === "paid" || t.status === "active");
  const pending = transactions.filter((t) => t.status === "created");
  const failed = transactions.filter((t) => t.status === "failed" || t.status === "cancelled");
  const collected = successful.reduce((s, t) => s + (Number(t.amount) || 0), 0);

  const counts = [
    { label: "Successful", value: successful.length, sub: money(collected) + " collected", icon: CheckCircle2, cls: "text-[#54D9AE]" },
    { label: "Pending", value: pending.length, sub: "Awaiting buyer approval", icon: Clock, cls: "text-amber-300" },
    { label: "Failed / Cancelled", value: failed.length, sub: "Needs no action", icon: XCircle, cls: "text-red-300" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-3 gap-4">
        {counts.map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2">
              <c.icon className={`w-4 h-4 ${c.cls}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100/50">{c.label}</span>
            </div>
            <div className={`text-3xl font-bold mt-2 ${c.cls}`}>{c.value}</div>
            <div className="text-xs text-emerald-100/40 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      {note && (
        <div className="rounded-2xl border border-[#187B65]/40 bg-[#187B65]/10 px-5 py-3 text-sm font-semibold text-[#54D9AE]">{note}</div>
      )}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/10">
          <CreditCard className="w-4 h-4 text-[#187B65]" />
          <span className="font-bold text-sm">Transaction log</span>
          <span className="ml-auto text-xs text-emerald-100/40">{transactions.length} records</span>
        </div>
        {transactions.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-emerald-100/40">No PayPal transactions yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {transactions.map((t) => {
              const st = STATUS_STYLE[t.status] || STATUS_STYLE.created;
              return (
                <div key={t.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5">
                  <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${st.cls}`}>
                    <st.icon className="w-3 h-3" /> {st.label}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{t.ref_label || t.ref_id || t.purpose}</div>
                    <div className="text-[11px] text-emerald-100/40">
                      {t.kind === "subscription" ? "Subscription" : "One-time"} · {t.purpose.replace(/_/g, " ")}
                      {t.paypal_subscription_id ? ` · ${t.paypal_subscription_id}` : t.paypal_order_id ? ` · ${t.paypal_order_id}` : ""}
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-sm font-bold">{money(t.amount)} {t.currency}</div>
                    <div className="text-[11px] text-emerald-100/40">{(t.created_date || "").slice(0, 10)}</div>
                  </div>
                  {t.status === "paid" && t.kind === "order" && t.paypal_order_id && (
                    <button
                      onClick={() => refund(t)}
                      disabled={refundingId === t.id}
                      className="shrink-0 inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5 text-[11px] font-bold text-emerald-100/70 hover:text-white hover:border-[#187B65] transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-3 h-3" /> {refundingId === t.id ? "Refunding…" : "Refund"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}