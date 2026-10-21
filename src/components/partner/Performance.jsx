import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Target, TrendingUp } from "lucide-react";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-CA");
const panel = "relative overflow-hidden rounded-2xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm";
const label = "text-[10px] font-bold uppercase tracking-[0.25em] text-[#187B65]/90";

// Contractor performance report: qualified leads, acceptance, completions,
// gross value and effective acquisition cost — from live records only.
export default function Performance() {
  const [data, setData] = useState(null); // null = loading, false = unavailable

  useEffect(() => {
    base44.functions.invoke("partnerPortal", { action: "reporting" })
      .then((r) => setData(r.data?.error ? false : r.data))
      .catch(() => setData(false));
  }, []);

  if (data === null) {
    return <div className={`${panel} p-8 text-center`}><Loader2 className="w-6 h-6 text-[#187B65] animate-spin mx-auto" /></div>;
  }
  if (!data) return null;

  const cards = [
    { icon: <Target className="w-4 h-4 text-[#187B65]" />, label: "Qualified leads in your area", value: data.qualified_leads_in_area, sub: "open requests awaiting a contractor" },
    { icon: <TrendingUp className="w-4 h-4 text-[#187B65]" />, label: "Jobs offered to you", value: data.jobs_offered, sub: `${data.declined} declined · ${data.acceptance_rate === null ? "no rate yet" : `${data.acceptance_rate}% accepted`}` },
    { icon: <TrendingUp className="w-4 h-4 text-[#187B65]" />, label: "Completed jobs", value: data.completed_jobs, sub: `${data.platform_completed_jobs} from the platform` },
    { icon: <TrendingUp className="w-4 h-4 text-[#187B65]" />, label: "Gross job value", value: money(data.gross_job_value), sub: "completed and paid jobs" },
    { icon: <TrendingUp className="w-4 h-4 text-[#187B65]" />, label: "Effective acquisition cost", value: data.effective_acquisition_cost === null ? "Not measurable yet" : `${money(data.effective_acquisition_cost)} / job`, sub: "fees + membership ÷ platform jobs completed" },
  ];

  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold text-white tracking-tight mb-2">Your performance</h2>
      <p className="text-xs text-emerald-100/40 mb-4">Live figures from your own jobs. Acquisition cost shows only after a platform-generated job completes.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.label} className={`${panel} p-4`}>
            <div className={label}>{c.label}</div>
            <div className="text-lg font-bold text-white mt-2 tabular-nums flex items-center gap-1.5">{c.icon}{c.value}</div>
            <p className="text-[11px] text-emerald-100/40 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}