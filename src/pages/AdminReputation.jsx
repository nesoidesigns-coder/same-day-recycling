import { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Loader2, RefreshCw } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import RingGauge from "@/components/admin/RingGauge";
import KpiCard from "@/components/admin/KpiCard";

const NA = "Insufficient data";
const withSuffix = (v, s) => (v === null || v === undefined ? NA : `${v}${s}`);

function ContractorCard({ c }) {
  const badge = (ok, onText, offText) => (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${ok ? "bg-[#187B65]/10 text-[#187B65]" : "bg-slate-100 text-slate-400"}`}>
      {ok ? onText : offText}
    </span>
  );
  const stat = (k, v) => (
    <div key={k} className="rounded-xl bg-[#f6f8f7] px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{k}</div>
      <div className="text-sm font-bold text-[#102B2A] mt-0.5">{v}</div>
    </div>
  );
  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-bold text-[#102B2A]">{c.name}</div>
          <div className="text-xs text-slate-500">{c.city || "—"}</div>
        </div>
        <div className="flex gap-1.5">
          {badge(c.active, "Active", "Inactive")}
          {badge(c.verified, "Verified", "Unverified")}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
        {stat("Jobs offered", c.jobs_offered)}
        {stat("Accepted", c.jobs_accepted)}
        {stat("Completed", c.jobs_completed)}
        {stat("Declined", c.jobs_declined)}
        {stat("Acceptance rate", withSuffix(c.offer_acceptance_rate, "%"))}
        {stat("Completion rate", withSuffix(c.completion_rate, "%"))}
        {stat("Avg response", withSuffix(c.avg_response_hours, " h"))}
        {stat("Avg rating", withSuffix(c.avg_rating, ` (${c.review_count})`))}
        {stat("On-time rate", c.on_time_rate === null ? NA : `${c.on_time_rate}%`)}
        {stat("Receipt compliance", c.receipt_compliance === null ? NA : `${c.receipt_compliance}%`)}
        {stat("Verified complaints", c.verified_complaints)}
        {stat("Unverified complaints", c.unverified_complaints)}
      </div>
      {c.disputes.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Disputes on this contractor's jobs</div>
          {c.disputes.map((d) => (
            <div key={d.id} className="rounded-xl border border-slate-200 px-3 py-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-[#102B2A]">{d.job_ref || "Job"}</span>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] bg-slate-100 text-slate-500">{d.status}</span>
                {d.outcome && <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] bg-[#187B65]/10 text-[#187B65]">{d.outcome.replace(/_/g, " ")}</span>}
                {d.pricing_note && <span className="text-slate-400">pricing-related</span>}
              </div>
              <p className="text-slate-600 mt-1">{d.complaint}</p>
              {d.contractor_response && (
                <p className="mt-1 text-slate-500"><span className="font-bold text-[#187B65]">Contractor response ({d.contractor_response_date}):</span> {d.contractor_response}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminReputation() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("reputationEngine", {});
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not load reputation data.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const n = data?.network || {};
  const gauge = (label, value, max, sub, reason) => (
    <RingGauge value={value} max={max} label={label} sub={sub} unavailableReason={value === null || value === undefined ? reason : undefined} />
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#187B65] mb-1">
            <ShieldCheck className="w-4 h-4" /> Recycling OS Operating Standard
          </div>
          <h1 className="text-2xl font-bold text-[#102B2A] tracking-tight">Network Reputation &amp; Reliability</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Built from actual records only. Metrics without enough underlying data show "Insufficient data" — reviews, performance scores and testimonials are never fabricated, and unverified complaints never count against a contractor.
          </p>
        </div>
        <button onClick={load} disabled={loading} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#102B2A] hover:border-[#187B65] transition-colors flex items-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Refresh
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm px-4 py-3 mb-6">{error}</div>}

      {!data && !error && (
        <div className="flex items-center gap-3 text-slate-500 py-20 justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#187B65]" /> Computing from records…
        </div>
      )}

      {data && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {gauge("Verified customer satisfaction", n.verified_satisfaction, 5, `Average of ${n.verified_review_count} approved reviews`, "fewer than 3 approved reviews on record")}
            {gauge("On-time completion", n.on_time_completion_rate, 100, `${n.on_time_recorded} of ${n.total_completed_jobs} completed jobs with arrival recorded`, "no arrival times recorded yet")}
            {gauge("Quote approval compliance", n.quote_approval_compliance, 100, "Completed jobs with a recorded customer approval", "no completed jobs yet")}
            {gauge("Dispute resolution rate", n.dispute_resolution_rate, 100, `${n.total_disputes} dispute${n.total_disputes === 1 ? "" : "s"} on record`, "no disputes on record")}
            {gauge("Repeat customer rate", n.repeat_customer_rate, 100, "Customers with 2+ recorded bookings", "fewer than 3 distinct customers on record")}
            {gauge("Receipt completion", n.receipt_completion_rate, 100, `${n.receipt_recorded} of ${n.total_completed_jobs} completed jobs tracked`, "no completed jobs yet")}
          </div>

          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <KpiCard label="Total completed jobs" value={n.total_completed_jobs} sub="From actual booking records" />
            <KpiCard label="Avg contractor response" value={withSuffix(n.avg_contractor_response_hours, " h")} sub={n.avg_contractor_response_hours === null ? "No contractor responses recorded yet" : "Offer sent → contractor responded"} tone="emerald" />
            <KpiCard label="Offer acceptance rate" value={withSuffix(n.offer_acceptance_rate, "%")} sub={n.offer_acceptance_rate === null ? "No responses recorded yet" : "Accepted vs declined offers"} />
            <KpiCard label="Pricing dispute frequency" value={withSuffix(n.pricing_dispute_frequency, "%")} sub={n.pricing_dispute_frequency === null ? "No completed jobs yet" : "Completed jobs with a dispute"} tone={n.pricing_dispute_frequency > 0 ? "amber" : "forest"} />
          </div>

          <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5 mb-8">
            <h2 className="text-sm font-bold text-[#102B2A] mb-1">Job volume trend</h2>
            <p className="text-xs text-slate-500 mb-4">Bookings created vs jobs completed, last 8 weeks</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trend || []}>
                  <defs>
                    <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#187B65" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#187B65" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#102B2A" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#102B2A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="created" name="Bookings created" stroke="#187B65" fill="url(#gCreated)" strokeWidth={2} />
                  <Area type="monotone" dataKey="completed" name="Jobs completed" stroke="#102B2A" fill="url(#gDone)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#102B2A] tracking-tight">Contractor accountability records</h2>
            <span className="text-xs text-slate-400">{(data.contractors || []).length} contractors on file</span>
          </div>
          <div className="space-y-4">
            {(data.contractors || []).length === 0 && (
              <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-8 text-center text-sm text-slate-500">
                Insufficient data — no contractors on record yet.
              </div>
            )}
            {(data.contractors || []).map((c) => <ContractorCard key={c.id} c={c} />)}
          </div>
        </>
      )}
    </div>
  );
}