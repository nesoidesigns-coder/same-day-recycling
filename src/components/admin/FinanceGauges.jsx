import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import KpiCard from "@/components/admin/KpiCard";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);

// Financial gauges sourced from real records only. A metric with no
// underlying records renders as $0.00 / unavailable — never fabricated.
export default function FinanceGauges() {
  const [f, setF] = useState(null);

  useEffect(() => {
    (async () => {
      const [txAgg, revAgg, subAgg, refundAgg, disputesOpen] = await Promise.all([
        base44.entities.PaypalTransaction.aggregate({ query: { status: { $in: ["paid", "active"] } }, sum: ["amount"] }),
        base44.entities.RevenueLedger.aggregate({ query: { direction: "revenue" }, sum: ["amount"] }),
        base44.entities.RevenueLedger.aggregate({ query: { direction: "revenue", category: { $in: ["membership", "software_subscription", "software_setup"] } }, sum: ["amount"] }),
        base44.entities.Booking.aggregate({ query: { record_type: "service" }, sum: ["refund_amount"] }),
        base44.entities.Dispute.count({ status: { $in: ["open", "under_review", "awaiting_customer"] } }),
      ]);
      setF({
        gross: txAgg.rows?.reduce((s, r) => s + (r.sum_amount || 0), 0) || 0,
        platform: revAgg.rows?.reduce((s, r) => s + (r.sum_amount || 0), 0) || 0,
        subscriptions: subAgg.rows?.reduce((s, r) => s + (r.sum_amount || 0), 0) || 0,
        refunds: refundAgg.rows?.reduce((s, r) => s + (r.sum_refund_amount || 0), 0) || 0,
        openDisputes: Number(disputesOpen) || 0,
      });
    })().catch(() => setF(false));
  }, []);

  if (!f) return null;

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
      <KpiCard label="Gross transaction volume" value={money(f.gross)} sub="Verified PayPal payments & active subscriptions" href="/admin/payouts" />
      <KpiCard label="Platform revenue" value={money(f.platform)} sub="Recorded in the revenue ledger" tone="emerald" href="/admin/revenue" />
      <KpiCard label="Subscription revenue" value={money(f.subscriptions)} sub="Memberships, licenses & white-label" tone="emerald" href="/admin/revenue" />
      <KpiCard
        label="Refunds & disputes"
        value={money(f.refunds)}
        sub={f.openDisputes ? `${f.openDisputes} open dispute${f.openDisputes === 1 ? "" : "s"}` : "No open disputes"}
        tone={f.refunds > 0 || f.openDisputes > 0 ? "amber" : "forest"}
        href="/admin/disputes"
      />
    </div>
  );
}