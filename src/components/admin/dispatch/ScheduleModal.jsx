import { useState } from "react";
import { X } from "lucide-react";

export default function ScheduleModal({ booking, onClose, onSchedule }) {
  const [date, setDate] = useState(booking.preferred_date || "");
  const [timeWindow, setTimeWindow] = useState(booking.time_window || "");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!date) return;
    setBusy(true);
    await onSchedule({ preferred_date: date, time_window: timeWindow, pickup_confirmed: true });
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#102B2A]/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#102B2A]">Confirm pickup date</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">{booking.name} · {booking.city || "unknown city"}</p>
        <div className="space-y-3">
          <label className="block">
            <span className="block text-xs font-semibold text-[#102B2A] mb-1">Confirmed pickup date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input py-2.5" />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-[#102B2A] mb-1">Arrival window (optional)</span>
            <input value={timeWindow} onChange={(e) => setTimeWindow(e.target.value)} placeholder="e.g. 1–3 PM" className="input py-2.5" />
          </label>
          <div className="flex gap-2 pt-1">
            <button onClick={submit} disabled={busy || !date} className="flex-1 rounded-full bg-li-btn text-white font-bold px-5 py-3 disabled:opacity-50">
              {busy ? "Saving…" : "Confirm pickup"}
            </button>
            <button onClick={onClose} className="rounded-full border border-slate-200 text-slate-600 font-bold px-5 py-3">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}