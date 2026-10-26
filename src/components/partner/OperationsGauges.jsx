import OSIntelligenceGauge from "@/components/os/OSIntelligenceGauge";
import { OS_COLORS } from "@/components/os/gaugeCore";

// Contractor operations instruments — the shared OSIntelligenceGauge family,
// same geometry and ring styling as the Live Intelligence radar. Every gauge
// is computed from this contractor's own real records; when no data exists
// the instrument shows an honest empty state, never an invented percentage.
const jobNet = (b) => {
  const v = Number(b.job_value) || 0;
  const rule = String(b.fee_terms_snapshot?.rule || "");
  let fee = 0;
  if (rule.startsWith("percentage_")) fee = (v * (Number(rule.split("_")[1]) || 0)) / 100;
  else if (rule.startsWith("fixed_")) fee = Number(rule.split("_")[1]) || 0;
  else if (b.referred_by_admin) fee = (v * (Number(b.commission_rate) || 0)) / 100;
  return Math.max(0, v - fee - (Number(b.refund_amount) || 0));
};

const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : null);
const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-CA");

export default function OperationsGauges({ jobs = [], history = [], offers = [] }) {
  // Offer acceptance — from resolved dispatch offers only.
  const resolved = offers.filter((o) => o.status === "accepted" || o.status === "declined");
  const accepted = resolved.filter((o) => o.status === "accepted").length;
  const acceptance = pct(accepted, resolved.length);

  // Dispatch punctuality — arrival status recorded at job completion.
  const withArrival = history.filter((b) => b.arrival_status);
  const onTime = withArrival.filter((b) => b.arrival_status === "on_time").length;
  const onTimeRate = pct(onTime, withArrival.length);

  // Collected vs outstanding payouts — completed jobs only.
  const paidSum = history.filter((b) => b.payout_paid).reduce((s, b) => s + jobNet(b), 0);
  const pendingSum = history.filter((b) => !b.payout_paid).reduce((s, b) => s + jobNet(b), 0);
  const collected = pct(paidSum, paidSum + pendingSum);

  const gauges = [
    {
      key: "acceptance",
      label: "Job acceptance rate",
      value: acceptance != null ? `${acceptance}%` : "",
      span: acceptance,
      color: OS_COLORS.green,
      caption: acceptance != null
        ? `${accepted} of ${resolved.length} resolved offer${resolved.length === 1 ? "" : "s"} accepted`
        : "No resolved offers yet — measured once offers are accepted or declined.",
    },
    {
      key: "punctuality",
      label: "On-time arrivals",
      value: onTimeRate != null ? `${onTimeRate}%` : "",
      span: onTimeRate,
      color: OS_COLORS.cyan,
      caption: onTimeRate != null
        ? `${onTime} of ${withArrival.length} completed job${withArrival.length === 1 ? "" : "s"} on time`
        : "Not yet measured — recorded as completed jobs are marked with arrival status.",
    },
    {
      key: "collected",
      label: "Payouts collected",
      value: collected != null ? `${collected}%` : "",
      span: collected,
      color: OS_COLORS.blue,
      caption: `${money(paidSum)} paid · ${money(pendingSum)} outstanding`,
    },
    {
      key: "csat",
      label: "Customer satisfaction",
      value: "",
      span: null,
      color: OS_COLORS.silver,
      caption: "No verified customer ratings on file yet — this gauge stays empty until reviews are recorded.",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {gauges.map((g) => (
        <div key={g.key} className="rounded-2xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm p-4 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#187B65]/90">{g.label}</div>
          <div className="mt-2">
            <OSIntelligenceGauge
              size="compact"
              ariaLabel={g.label}
              center={{ value: g.value }}
              layers={[
                { type: "ring", radius: 0.92, opacity: 0.14 },
                ...(g.span != null
                  ? [{ type: "arc", r0: 0.74, r1: 0.9, spanDeg: Math.max(10, (g.span / 100) * 340), color: g.color, title: `${g.label}: ${g.span}%` }]
                  : []),
              ]}
            />
          </div>
          <p className="mt-1 text-[10px] leading-snug text-emerald-100/40">{g.caption}</p>
        </div>
      ))}
    </div>
  );
}