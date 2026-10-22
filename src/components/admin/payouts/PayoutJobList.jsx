import { DollarSign } from "lucide-react";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);

function feeLabel(rule) {
  if (!rule) return "No fee terms recorded (legacy job)";
  if (rule.startsWith("percentage_")) return Number(rule.split("_")[1]) + "% platform fee";
  if (rule.startsWith("fixed_")) return money(Number(rule.split("_")[1])) + " fixed platform fee";
  if (rule === "no_active_agreement") return "No platform fee (no active agreement)";
  if (rule === "source_not_covered") return "No platform fee (source not covered)";
  return "No platform fee";
}

// One completed job with its exact recorded fee terms.
export default function PayoutJobList({ jobs, paid, onMarkOne }) {
  if (!jobs.length) {
    return (
      <p className="text-slate-500 text-sm py-4">
        {paid ? "No payouts recorded as paid yet. When you mark partner payouts paid, each verified job appears here." : "No unpaid completed jobs — payouts appear here as jobs are completed."}
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {jobs.map((j) => (
        <div key={j.id} className="rounded-xl bg-[#f6f8f7] px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-bold text-[#102B2A] text-sm">{j.name}</div>
              <div className="text-xs text-slate-500">{j.partner_name || "Unassigned"} · {j.preferred_date || "no date"}</div>
            </div>
            {!paid && (
              <button
                onClick={() => onMarkOne(j)}
                className="rounded-full bg-[#102B2A] text-white font-bold px-3.5 py-2 text-xs hover:bg-[#0a3020] flex items-center gap-1.5"
              >
                <DollarSign className="w-3.5 h-3.5" /> Mark paid
              </button>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <span><span className="text-xs text-slate-400 font-semibold">Invoice </span><span className="font-bold text-[#102B2A]">{money(j.invoice)}</span></span>
            <span><span className="text-xs text-slate-400 font-semibold">Fee terms </span><span className="font-bold text-[#187B65]">{feeLabel(j.rule)} ({money(j.fee)})</span></span>
            {j.commission > 0 && <span><span className="text-xs text-slate-400 font-semibold">Referral commission </span><span className="font-bold text-[#102B2A]">{money(j.commission)}</span></span>}
            {j.refund > 0 && <span><span className="text-xs text-slate-400 font-semibold">Refunded </span><span className="font-bold text-red-600">-{money(j.refund)}</span></span>}
            <span><span className="text-xs text-slate-400 font-semibold">{paid ? "Paid to contractor" : "Owed to contractor"} </span><span className={"font-bold " + (paid ? "text-[#187B65]" : "text-amber-600")}>{money(j.owed)}</span></span>
          </div>
          {j.disclosure && <p className="mt-1.5 text-[11px] text-slate-400">Terms at assignment: {j.disclosure}</p>}
        </div>
      ))}
    </div>
  );
}