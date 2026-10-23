import { useState } from "react";
import { X, Landmark, Wallet } from "lucide-react";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);

// Record payments for a completed job.
// - Platform: marks the customer invoice paid through the platform.
// - External: the customer paid outside Recycling OS (cash, e-transfer, the
//   contractor's own checkout). Creates NO platform transaction and NO
//   financial accounting record — only the operational booking fields change,
//   so financial reconciliation can happen later without duplicates.
// - Reconcile: for a booking already marked paid_externally, confirm the
//   external payment against the books.
export default function PaidModal({ booking, onClose, onPaid }) {
  const outstanding = Math.max(0, (Number(booking.commission_earned) || 0) - (Number(booking.commission_paid) || 0));
  const externallyPaid = booking.payment_status === "paid_externally";
  const [settlement, setSettlement] = useState(externallyPaid ? "external" : "platform");
  const [customerPaid, setCustomerPaid] = useState(booking.payment_status === "paid");
  const [externalMethod, setExternalMethod] = useState(booking.external_payment_method || "");
  const [externalNote, setExternalNote] = useState(booking.external_payment_note || "");
  const [reconcileReminder, setReconcileReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState("");
  const [verifyNow, setVerifyNow] = useState(false);
  const [commissionAmt, setCommissionAmt] = useState(outstanding ? String(outstanding) : "");
  const [busy, setBusy] = useState(false);

  const commissionPayload = Number(commissionAmt) > 0 ? { commission_paid_amount: Number(commissionAmt) } : {};

  const submit = async () => {
    setBusy(true);
    if (externallyPaid) {
      await onPaid({ reconcile: verifyNow, ...commissionPayload });
    } else if (settlement === "external") {
      await onPaid({
        external: true,
        external_method: externalMethod.trim() || "external",
        external_note: externalNote.trim(),
        reconcile_reminder: reconcileReminder,
        reconcile_reminder_date: reconcileReminder && reminderDate ? reminderDate : "",
        ...commissionPayload,
      });
    } else {
      await onPaid({ customer_paid: customerPaid, ...commissionPayload });
    }
    setBusy(false);
  };

  const canSave = externallyPaid
    ? !busy
    : settlement === "external"
      ? !busy && !!externalMethod.trim()
      : !busy && (customerPaid || Number(commissionAmt) > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#102B2A]/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#102B2A]">{externallyPaid ? "Reconcile external payment" : "Record payments"}</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">{booking.name} · invoice {booking.final_invoice ? money(booking.final_invoice) : "—"}</p>
        <div className="space-y-3">
          {externallyPaid ? (
            <>
              <div className="rounded-xl bg-[#f6f8f7] p-3 text-xs text-slate-600">
                <span className="block font-bold text-[#102B2A] mb-0.5">Paid externally — outside Recycling OS</span>
                Method: <span className="font-semibold">{booking.external_payment_method || "not recorded"}</span>
                {booking.external_payment_note ? <span className="block mt-1">Note: {booking.external_payment_note}</span> : null}
                {booking.external_payment_verified ? (
                  <span className="block mt-1 font-bold text-[#187B65]">Already reconciled.</span>
                ) : null}
              </div>
              {!booking.external_payment_verified && (
                <label className="flex items-start gap-2 rounded-xl bg-[#f6f8f7] p-3 cursor-pointer">
                  <input type="checkbox" checked={verifyNow} onChange={(e) => setVerifyNow(e.target.checked)} className="mt-0.5" />
                  <span className="text-xs font-semibold text-[#102B2A]">
                    Mark external payment as verified
                    <span className="block text-[11px] font-normal text-slate-500">Confirms the payment against the books. No platform transaction is created or duplicated.</span>
                  </span>
                </label>
              )}
            </>
          ) : (
            <>
              <div>
                <span className="block text-xs font-semibold text-[#102B2A] mb-1.5">How was the customer invoice settled?</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button type="button" onClick={() => setSettlement("platform")} className={`rounded-xl border p-3 text-left ${settlement === "platform" ? "border-[#187B65] bg-[#187B65]/5" : "border-slate-200"}`}>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#102B2A]"><Landmark className="w-3.5 h-3.5 text-[#187B65]" /> Platform</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">Recorded as paid through the platform.</span>
                  </button>
                  <button type="button" onClick={() => setSettlement("external")} className={`rounded-xl border p-3 text-left ${settlement === "external" ? "border-[#187B65] bg-[#187B65]/5" : "border-slate-200"}`}>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#102B2A]"><Wallet className="w-3.5 h-3.5 text-[#187B65]" /> Paid externally</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">Cash, e-transfer or contractor's own checkout. No platform transaction.</span>
                  </button>
                </div>
              </div>
              {settlement === "platform" ? (
                <label className="flex items-start gap-2 rounded-xl bg-[#f6f8f7] p-3 cursor-pointer">
                  <input type="checkbox" checked={customerPaid} onChange={(e) => setCustomerPaid(e.target.checked)} className="mt-0.5" />
                  <span className="text-xs font-semibold text-[#102B2A]">
                    Customer invoice paid
                    <span className="block text-[11px] font-normal text-slate-500">Marks the job paid on the customer side.</span>
                  </span>
                </label>
              ) : (
                <>
                  <label className="block">
                    <span className="block text-xs font-semibold text-[#102B2A] mb-1">External payment method <span className="font-normal text-slate-500">(cash, e-transfer, contractor POS…)</span></span>
                    <input type="text" value={externalMethod} onChange={(e) => setExternalMethod(e.target.value)} placeholder="e.g. e-transfer" className="input py-2.5" />
                  </label>
                  <label className="block">
                    <span className="block text-xs font-semibold text-[#102B2A] mb-1">Note <span className="font-normal text-slate-500">(optional)</span></span>
                    <input type="text" value={externalNote} onChange={(e) => setExternalNote(e.target.value)} placeholder="Reference, who collected it…" className="input py-2.5" />
                  </label>
                  <label className="flex items-start gap-2 rounded-xl bg-[#f6f8f7] p-3 cursor-pointer">
                    <input type="checkbox" checked={reconcileReminder} onChange={(e) => setReconcileReminder(e.target.checked)} className="mt-0.5" />
                    <span className="text-xs font-semibold text-[#102B2A]">
                      Remind me to reconcile this later
                      <span className="block text-[11px] font-normal text-slate-500">Optional. The job stays flagged on dispatch until the external payment is verified.</span>
                    </span>
                  </label>
                  {reconcileReminder && (
                    <label className="block">
                      <span className="block text-xs font-semibold text-[#102B2A] mb-1">Reminder date <span className="font-normal text-slate-500">(optional)</span></span>
                      <input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} className="input py-2.5" />
                    </label>
                  )}
                </>
              )}
            </>
          )}
          {booking.referred_by_admin && (
            <label className="block">
              <span className="block text-xs font-semibold text-[#102B2A] mb-1">
                Commission paid $ {outstanding > 0 && <span className="font-normal text-slate-500">(outstanding: {money(outstanding)})</span>}
              </span>
              <input type="number" min="0" value={commissionAmt} onChange={(e) => setCommissionAmt(e.target.value)} className="input py-2.5" />
            </label>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={submit} disabled={!canSave} className="flex-1 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-5 py-3 disabled:opacity-50">
              {busy ? "Saving…" : externallyPaid ? "Save" : "Save payments"}
            </button>
            <button onClick={onClose} className="rounded-full border border-slate-200 text-slate-600 font-bold px-5 py-3">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}