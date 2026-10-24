import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, XCircle, CheckCircle2, Clock, ShieldAlert, PlusCircle } from "lucide-react";
import { labelFor } from "@/lib/opsShared";
import CustodyPanel from "@/components/ops/CustodyPanel";

// Full lifecycle drawer for one job: the merged timeline (derived stages +
// witnessed events + exceptions), manual event recording, and the
// chain-of-custody panel.
const MANUAL_OPTIONS = [
  { group: "Field updates", stages: ["contractor_en_route", "contractor_arrived", "pickup_in_progress", "materials_loaded"] },
  { group: "Exceptions", stages: ["exception_rescheduled", "exception_payment_failed", "exception_price_adjusted", "exception_additional_items", "exception_cancelled", "exception_other"] },
];

export default function JobDrawer({ booking, onClose, onChanged }) {
  const [recordStage, setRecordStage] = useState("");
  const [recordNote, setRecordNote] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordMsg, setRecordMsg] = useState("");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const record = async () => {
    if (!recordStage) return;
    setRecording(true);
    setRecordMsg("");
    try {
      await base44.functions.invoke("jobTracking", { action: "record", booking_id: booking.id, stage: recordStage, note: recordNote });
      setRecordMsg("Event recorded.");
      setRecordStage("");
      setRecordNote("");
      onChanged?.();
    } catch (e) {
      setRecordMsg(e?.response?.data?.error || "Recording failed.");
    }
    setRecording(false);
  };

  const stageChip = booking.is_delayed
    ? { cls: "bg-amber-100 text-amber-800", label: "Delayed" }
    : booking.status === "completed"
      ? { cls: "bg-[#187B65]/10 text-[#187B65]", label: "Completed" }
      : { cls: "bg-slate-100 text-slate-600", label: booking.current_stage ? labelFor(booking.current_stage) : booking.status };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-[#102B2A]/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-lg bg-[#f6f8f7] h-full overflow-y-auto shadow-xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono font-bold text-[#102B2A] tracking-widest">{booking.reference_code || "—"}</p>
            <h3 className="text-lg font-bold text-[#102B2A] mt-0.5">{booking.name} · {booking.city || "—"}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full px-2.5 py-1 font-bold ${stageChip.cls}`}>{stageChip.label}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-600">{booking.assignment_status?.replace("_", " ") || booking.status}</span>
              {booking.partner_name && <span className="text-slate-500 font-semibold">{booking.partner_name}</span>}
              <span className="text-slate-400">{booking.preferred_date ? `Due ${booking.preferred_date}` : "No date"}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-[#102B2A]" aria-label="Close">✕</button>
        </div>

        <TimelinePanel bookingId={booking.id} onChanged={onChanged} />

        {/* Manual event / exception recording */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 mt-4">
          <h4 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><PlusCircle className="w-4 h-4 text-[#187B65]" /> Record an event</h4>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select value={recordStage} onChange={(e) => setRecordStage(e.target.value)} className="input py-2 text-xs" aria-label="Event stage">
              <option value="">Select an event…</option>
              {MANUAL_OPTIONS.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.stages.map((s) => <option key={s} value={s}>{labelFor(s)}</option>)}
                </optgroup>
              ))}
            </select>
            <input value={recordNote} onChange={(e) => setRecordNote(e.target.value)} className="input py-2 text-xs" placeholder="Note (e.g. customer rescheduled to Friday)" />
          </div>
          <button onClick={record} disabled={recording || !recordStage} className="mt-2 rounded-full bg-[#102B2A] px-4 py-2 text-xs font-bold text-white hover:bg-[#0a3020] transition-colors disabled:opacity-60">
            {recording ? "Recording…" : "Record event"}
          </button>
          {recordMsg && <p className="mt-1.5 text-xs text-slate-600">{recordMsg}</p>}
        </div>

        <div className="mt-4">
          <CustodyPanel booking={booking} onSaved={onChanged} />
        </div>
      </div>
    </div>
  );
}

function TimelinePanel({ bookingId, onChanged }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await base44.functions.invoke("jobTracking", { action: "timeline", booking_id: bookingId });
        if (live) setData(res.data);
      } catch {
        if (live) setError(true);
      }
    })();
    return () => { live = false; };
  }, [bookingId, onChanged]);

  if (error) return <p className="mt-4 text-sm text-red-600 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Timeline could not be loaded.</p>;
  if (!data) return <div className="flex items-center gap-2 mt-4 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin text-[#187B65]" /> Loading timeline…</div>;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 mt-4">
      <h4 className="text-sm font-bold text-[#102B2A]">Lifecycle timeline</h4>
      <ol className="mt-3 space-y-3.5">
        {data.timeline.map((t, i) => (
          <li key={i} className="flex gap-3">
            <span className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${t.exception ? "bg-red-100" : t.derived ? "bg-[#187B65]" : "bg-[#102B2A]"}`}>
              {t.exception ? <XCircle className="w-3.5 h-3.5 text-red-600" /> : <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#102B2A]">{t.label}{t.derived && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">from record</span>}</p>
              {t.note && <p className="text-xs text-slate-600 mt-0.5 break-words">{t.note}</p>}
              <p className="text-[11px] text-slate-400 mt-0.5">
                {t.occurred_at ? new Date(t.occurred_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : <Clock className="w-3 h-3 inline" />}
                {t.actor && t.actor !== "system" ? ` · ${t.actor}` : ""}{t.source ? ` · ${t.source}` : ""}
              </p>
            </div>
          </li>
        ))}
        {!data.timeline.length && <li className="text-sm text-slate-500">No stages recorded yet.</li>}
      </ol>
    </div>
  );
}