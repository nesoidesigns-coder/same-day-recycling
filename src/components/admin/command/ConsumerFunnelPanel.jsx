import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MousePointerClick, FileText, ClipboardList, CheckCircle2, Truck, CreditCard, ArrowRight } from "lucide-react";

const STAGES = [
  { key: "visits", label: "Visitor sessions", icon: MousePointerClick, pick: (f) => f.visits.visitor_sessions, note: "Distinct anonymous sessions, human traffic only" },
  { key: "leads", label: "Quote requests", icon: FileText, pick: (f) => f.quote_leads.current, note: "Captured quote leads" },
  { key: "requests", label: "Booking requests", icon: ClipboardList, pick: (f) => f.booking_requests.current, note: "Cancelled requests excluded" },
  { key: "confirmed", label: "Confirmed bookings", icon: CheckCircle2, pick: (f) => f.confirmed.current, note: "Accepted and scheduled" },
  { key: "completed", label: "Completed jobs", icon: Truck, pick: (f) => f.completed.current, note: "Finished pickups" },
  { key: "paid", label: "Verified payments", icon: CreditCard, pick: (f) => f.paid.platform + f.paid.external - f.paid.external_unverified, note: "Platform-captured + owner-verified external" },
];

const fmtPct = (v) => (v === null || v === undefined ? "—" : `${v}%`);

// Consumer funnel — served by the existing verified conversionFunnel layer
// (visits → quote → booking → completed → paid). Observed records only.
export default function ConsumerFunnelPanel({ days }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    setData(null);
    setError(null);
    base44.functions.invoke("conversionFunnel", { days })
      .then((res) => { if (live) setData(res.data); })
      .catch((e) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [days]);

  if (error) {
    return <div className="mt-6 rounded-2xl bg-white border border-red-200 px-5 py-4 text-sm text-red-700">{error}</div>;
  }
  if (!data) {
    return <div className="flex items-center justify-center py-20 text-slate-500"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading consumer funnel…</div>;
  }

  const rateRows = [
    { label: "Visit → quote request", value: fmtPct(data.rates.visit_to_lead_pct), prev: fmtPct(data.rates_prev.visit_to_lead_pct) },
    { label: "Quote → booking", value: fmtPct(data.rates.lead_to_booking_pct), prev: fmtPct(data.rates_prev.lead_to_booking_pct) },
    { label: "Booking → confirmed", value: fmtPct(data.rates.booking_to_confirmed_pct), prev: fmtPct(data.rates_prev.booking_to_confirmed_pct) },
    { label: "Confirmed → completed", value: fmtPct(data.rates.confirmed_to_completed_pct), prev: fmtPct(data.rates_prev.confirmed_to_completed_pct) },
  ];

  return (
    <div className="mt-6">
      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">Consumer funnel — observed from records</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {STAGES.map((s, i) => (
            <div key={s.key} className="rounded-2xl border border-slate-100 bg-[#f4f7f5] px-4 py-3.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <s.icon className="w-3.5 h-3.5 text-[#187B65]" /> {s.label}
                </span>
                {i < STAGES.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-300" />}
              </div>
              <div className="mt-1 text-2xl font-extrabold text-[#102B2A]">{s.pick(data.funnel)}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{s.note}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid md:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">Conversion rates (current vs previous period)</h2>
          <table className="w-full text-sm">
            <tbody>
              {rateRows.map((r) => (
                <tr key={r.label} className="border-t border-slate-100">
                  <td className="py-2.5 pr-4 text-slate-600">{r.label}</td>
                  <td className="py-2.5 pr-4 font-bold text-[#102B2A]">{r.value}</td>
                  <td className="py-2.5 text-slate-400">{r.prev}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[11px] text-slate-500">
            Small windows are labelled low-confidence in the full funnel view — rates on tiny samples are never over-read.
          </p>
          <a href="/admin/conversion" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#187B65] hover:underline">
            Open the full Conversion Funnel dashboard
          </a>
        </div>

        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">Verified money (excludes taxes &amp; test records)</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">Completed job value</span><span className="font-bold text-[#102B2A]">${Math.round(data.money.completed_job_value).toLocaleString("en-CA")}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Platform-collected payments</span><span className="font-bold text-[#102B2A]">${Math.round(data.money.platform_paid_value).toLocaleString("en-CA")}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">External settled (owner-verified)</span><span className="font-bold text-[#102B2A]">${Math.round(data.money.external_paid_value - data.money.external_unverified_value).toLocaleString("en-CA")}</span></div>
            {data.money.external_unverified_value > 0 && (
              <div className="flex justify-between"><span className="text-slate-600">External awaiting verification</span><span className="font-bold text-amber-600">${Math.round(data.money.external_unverified_value).toLocaleString("en-CA")}</span></div>
            )}
            <div className="flex justify-between border-t border-slate-100 pt-2.5"><span className="text-slate-600">Commission earned</span><span className="font-bold text-[#187B65]">${Math.round(data.money.commission_earned).toLocaleString("en-CA")}</span></div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            {data.funnel.paid.external_unverified} external payments are pending owner reconciliation and are labelled, never counted as verified revenue.
          </p>
        </div>
      </div>
    </div>
  );
}