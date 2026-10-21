import { useState } from "react";
import { X } from "lucide-react";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);

export default function PaidModal({ booking, onClose, onPaid }) {
  const outstanding = Math.max(0, (Number(booking.commission_earned) || 0) - (Number(booking.commission_paid) || 0));
  const [commissionAmt, setCommissionAmt] = useState(outstanding ? String(outstanding) : "");
  const [customerPaid, setCustomerPaid] = useState(booking.payment_status !== "paid");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    await onPaid({
      customer_paid: customerPaid,
      commission_paid_amount: Number(commissionAmt) || 0,
    });
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#102B2A]/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#102B2A]">Record payments</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">{booking.name} · invoice {booking.final_invoice ? money(booking.final_invoice) : "—"}</p>
        <div className="space-y-3">
          <label className="flex items-start gap-2 rounded-xl bg-[#f6f8f7] p-3 cursor-pointer">
            <input type="checkbox" checked={customerPaid} onChange={(e) => setCustomerPaid(e.target.checked)} className="mt-0.5" />
            <span className="text-xs font-semibold text-[#102B2A]">
              Customer invoice paid
              <span className="block text-[11px] font-normal text-slate-500">Marks the job paid on the customer side.</span>
            </span>
          </label>
          {booking.referred_by_admin && (
            <label className="block">
              <span className="block text-xs font-semibold text-[#102B2A] mb-1">
                Commission paid $ {outstanding > 0 && <span className="font-normal text-slate-500">(outstanding: {money(outstanding)})</span>}
              </span>
              <input type="number" min="0" value={commissionAmt} onChange={(e) => setCommissionAmt(e.target.value)} className="input py-2.5" />
            </label>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={submit} disabled={busy || (!customerPaid && !Number(commissionAmt))} className="flex-1 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-5 py-3 disabled:opacity-50">
              {busy ? "Saving…" : "Save payments"}
            </button>
            <button onClick={onClose} className="rounded-full border border-slate-200 text-slate-600 font-bold px-5 py-3">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}