import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

// Explains how every gauge and KPI on the Overview is computed, and whether
// the figure is an exact count of real records or an estimate. These are
// internal platform measurements — never official third-party metrics.
const EXPLANATIONS = [
  { name: "Total bookings", calc: "Count of live Booking records; internal_test records are excluded and shown separately.", basis: "Exact count" },
  { name: "New leads", calc: "Live bookings with status 'new' plus unworked quote leads (QuoteLead status 'new').", basis: "Exact count" },
  { name: "Completion rate", calc: "Completed jobs ÷ closed jobs (completed + cancelled), live records only.", basis: "Exact count" },
  { name: "Contractor acceptance", calc: "Jobs accepted (accepted or completed) ÷ jobs dispatched (assigned, accepted, completed or declined).", basis: "Exact count" },
  { name: "Dispatch success", calc: "Jobs completed ÷ jobs dispatched. A dispatch that was declined or is still pending counts against it.", basis: "Exact count" },
  { name: "Average rating", calc: "Mean star rating across approved customer reviews only; unapproved reviews are never counted.", basis: "Exact count" },
  { name: "Pending / paid payouts", calc: "Completed, unpaid (or paid) job value × a fixed 75% partner share estimate. Actual payouts follow each job's own recorded fee terms in Payouts.", basis: "Estimate (75% share)" },
  { name: "AI search referrals", calc: "Visits whose referrer is an AI assistant (ChatGPT, Perplexity, Gemini, Copilot, Claude, etc.), 30 days, real traffic only.", basis: "Exact count" },
  { name: "Traffic classification", calc: "Owner testing and bot crawls are recorded but excluded from every visitor and conversion figure.", basis: "Verified records" },
];

export default function ScoreExplainer() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left">
        <span className="flex items-center gap-2 text-sm font-bold text-[#102B2A]">
          <Info className="w-4 h-4 text-[#187B65]" /> How these figures are calculated
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#187B65]">{open ? "Hide" : "Show"}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 grid md:grid-cols-2 gap-2.5">
          {EXPLANATIONS.map((e) => (
            <div key={e.name} className="rounded-xl bg-[#f4f7f5] border border-slate-100 px-3.5 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#102B2A]">{e.name}</span>
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${e.basis.startsWith("Exact") || e.basis.startsWith("Verified") ? "bg-[#187B65]/10 text-[#187B65] border-[#187B65]/25" : "bg-amber-50 text-amber-700 border-amber-200"}`}>{e.basis}</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-snug">{e.calc}</p>
            </div>
          ))}
          <p className="md:col-span-2 text-[11px] text-slate-500">
            All figures are internal Same Day Recycling platform measurements — not official Google, Bing or any third-party authority scores.
          </p>
        </div>
      )}
    </div>
  );
}