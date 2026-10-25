import { useState } from "react";
import { X } from "lucide-react";
import { SOURCE_LABELS } from "@/lib/feeRules";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);

// Platform fee comes only from the terms snapshot recorded when the contractor
// was assigned (their active agreement), never from the source label alone.
function feeFromSnapshot(booking, invoiceNum) {
  const rule = booking.fee_terms_snapshot?.rule || "";
  if (rule.startsWith("percentage_")) {
    const pct = Number(rule.split("_")[1]) || 0;
    return Math.round(invoiceNum * pct) / 100;
  }
  if (rule.startsWith("fixed_")) return Number(rule.split("_")[1]) || 0;
  return 0;
}

export default function CompleteModal({ booking, onClose, onComplete }) {
  const [invoice, setInvoice] = useState(String(booking.final_invoice || booking.job_value || ""));
  const [busy, setBusy] = useState(false);
  const rate = booking.referred_by_admin ? Number(booking.commission_rate) || 0 : 0;
  const invoiceNum = Number(invoice) || 0;
  const commission = booking.referred_by_admin ? (invoiceNum * rate) / 100 : 0;
  // A job carries one fee, never two: a personal-referral commission replaces any agreement fee.
  const platformFee = booking.referred_by_admin ? 0 : feeFromSnapshot(booking, invoiceNum);
  const net = invoiceNum - platformFee - commission;

  const submit = async () => {
    setBusy(true);
    await onComplete({
      final_invoice: invoiceNum,
      commission_earned: commission,
      platform_fee_amount: platformFee,
      contractor_net_amount: Math.max(0, net),
    });
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#102B2A]/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#102B2A]">Complete job</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-1">{booking.name} · {booking.city || "unknown city"}</p>
        <p className="text-xs text-slate-400 mb-4">Source: {SOURCE_LABELS[booking.job_source] || "Not recorded"}</p>
        <div className="space-y-3">
          <label className="block">
            <span className="block text-xs font-semibold text-[#102B2A] mb-1">Final invoice $</span>
            <input type="number" min="0" value={invoice} onChange={(e) => setInvoice(e.target.value)} className="input py-2.5" />
          </label>
          {booking.referred_by_admin ? (
            <div className="rounded-xl bg-[#f6f8f7] p-3 text-xs font-semibold text-[#102B2A]">
              Personal referral commission: {rate}% of {money(invoiceNum)} = <span className="text-[#187B65]">{money(commission)}</span>
              <span className="block text-[11px] font-normal text-slate-500">Earned when the job completes; recorded as outstanding until you mark commission paid.</span>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Not a personal referral — no referral commission is recorded.</p>
          )}
          <div className="rounded-xl bg-[#f6f8f7] p-3 text-xs font-semibold text-[#102B2A]">
            Agreement platform fee: <span className="text-[#187B65]">{money(platformFee)}</span>
            <span className="block text-[11px] font-normal text-slate-500">
              {booking.fee_terms_snapshot?.disclosure || "No platform fee applies to this job."}
            </span>
            <span className="block text-[11px] font-normal text-slate-500 mt-1">Contractor net after fees: {money(Math.max(0, net))}</span>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={submit} disabled={busy || !invoice} className="flex-1 rounded-full bg-li-btn text-white font-bold px-5 py-3 disabled:opacity-50">
              {busy ? "Saving…" : "Mark complete"}
            </button>
            <button onClick={onClose} className="rounded-full border border-slate-200 text-slate-600 font-bold px-5 py-3">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}