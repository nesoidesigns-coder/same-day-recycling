import { useState } from "react";
import { X } from "lucide-react";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);

export default function CompleteModal({ booking, onClose, onComplete }) {
  const [invoice, setInvoice] = useState(String(booking.final_invoice || booking.job_value || ""));
  const [busy, setBusy] = useState(false);
  const rate = booking.referred_by_admin ? Number(booking.commission_rate) || 0 : 0;
  const invoiceNum = Number(invoice) || 0;
  const commission = booking.referred_by_admin ? (invoiceNum * rate) / 100 : 0;

  const submit = async () => {
    setBusy(true);
    await onComplete({ final_invoice: invoiceNum, commission_earned: commission });
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
        <p className="text-sm text-slate-500 mb-4">{booking.name} · {booking.city || "unknown city"}</p>
        <div className="space-y-3">
          <label className="block">
            <span className="block text-xs font-semibold text-[#102B2A] mb-1">Final invoice $</span>
            <input type="number" min="0" value={invoice} onChange={(e) => setInvoice(e.target.value)} className="input py-2.5" />
          </label>
          {booking.referred_by_admin ? (
            <div className="rounded-xl bg-[#f6f8f7] p-3 text-xs font-semibold text-[#102B2A]">
              Referral commission: {rate}% of {money(invoiceNum)} = <span className="text-[#187B65]">{money(commission)}</span>
              <span className="block text-[11px] font-normal text-slate-500">Earned when the job completes; recorded as outstanding until you mark commission paid.</span>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Not a referral job — no commission is recorded.</p>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={submit} disabled={busy || !invoice} className="flex-1 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-5 py-3 disabled:opacity-50">
              {busy ? "Saving…" : "Mark complete"}
            </button>
            <button onClick={onClose} className="rounded-full border border-slate-200 text-slate-600 font-bold px-5 py-3">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}