import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Scale, FileText, Sparkles, Plus, Search } from "lucide-react";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-CA");

const STATUS_STYLES = {
  open: "bg-amber-50 text-amber-700 border-amber-200",
  under_review: "bg-blue-50 text-blue-700 border-blue-200",
  awaiting_customer: "bg-purple-50 text-purple-700 border-purple-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-500 border-slate-200",
};

// Admin dispute centre: every complaint with its full evidence case file —
// original estimate, approved quote, change orders, payments, resolution.
export default function AdminDisputes() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // full case file
  const [caseLoading, setCaseLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [saving, setSaving] = useState(false);
  // New-dispute form
  const [showNew, setShowNew] = useState(false);
  const [refCode, setRefCode] = useState("");
  const [foundBooking, setFoundBooking] = useState(null);
  const [complaint, setComplaint] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const loadList = async () => {
    setLoading(true);
    const res = await base44.entities.Dispute.list({ sort: "-created_date", limit: 100 });
    setDisputes(res.items || []);
    setLoading(false);
  };

  useEffect(() => { loadList(); }, []);

  const openCase = async (d) => {
    setCaseLoading(true);
    try {
      const res = await base44.functions.invoke("disputeCase", { action: "load", dispute_id: d.id });
      setSelected(res.data);
    } catch {
      setSelected(null);
    } finally {
      setCaseLoading(false);
    }
  };

  const assembleSummary = async () => {
    if (!selected?.dispute) return;
    setSummarizing(true);
    try {
      const res = await base44.functions.invoke("disputeCase", { action: "summary", dispute_id: selected.dispute.id });
      setSelected((s) => ({ ...s, dispute: { ...s.dispute, case_summary: res.data.case_summary } }));
    } catch {} finally { setSummarizing(false); }
  };

  const saveDispute = async (changes) => {
    if (!selected?.dispute) return;
    setSaving(true);
    try {
      const history = [...(selected.dispute.history || []), { date: new Date().toISOString().slice(0, 10), event: "updated", note: `Updated: ${Object.keys(changes).join(", ")}` }];
      const updated = await base44.entities.Dispute.update(selected.dispute.id, { ...changes, history });
      setSelected((s) => ({ ...s, dispute: { ...s.dispute, ...updated } }));
      await loadList();
    } catch {} finally { setSaving(false); }
  };

  const findBookingByRef = async () => {
    setFormError("");
    setFoundBooking(null);
    try {
      const res = await base44.entities.Booking.filter({ reference_code: refCode.trim().toUpperCase() }, { limit: 1 });
      const b = (res.items || [])[0];
      if (!b) { setFormError("No booking found with that reference code."); return; }
      setFoundBooking(b);
    } catch {
      setFormError("Couldn't look up that reference code.");
    }
  };

  const createDispute = async () => {
    if (!foundBooking || !complaint.trim()) { setFormError("Find the booking and describe the complaint first."); return; }
    setCreating(true);
    setFormError("");
    try {
      await base44.entities.Dispute.create({
        booking_id: foundBooking.id,
        job_ref: foundBooking.reference_code || "",
        customer_name: foundBooking.name || "",
        customer_email: foundBooking.email || "",
        complaint: complaint.trim(),
        created_by: "admin",
        history: [{ date: new Date().toISOString().slice(0, 10), event: "created", note: "Dispute opened by admin" }],
      });
      setShowNew(false);
      setRefCode(""); setFoundBooking(null); setComplaint("");
      await loadList();
    } catch (err) {
      setFormError(err?.response?.data?.error || "Couldn't create the dispute.");
    } finally { setCreating(false); }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#187B65] animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#102B2A]">Dispute Centre</h1>
          <p className="text-sm text-slate-500 mt-1">Every complaint with its full evidence file: original estimate, approved quote, change orders, payments and resolution.</p>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="rounded-full bg-[#187B65] text-white font-bold px-5 py-2.5 text-sm hover:bg-[#125C4E] transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> New dispute
        </button>
      </div>

      {showNew && (
        <div className="rounded-2xl bg-white border border-slate-200 p-5 space-y-4">
          <h2 className="font-bold text-[#102B2A] text-sm uppercase tracking-[0.15em]">Open a dispute</h2>
          <div className="flex gap-2">
            <input value={refCode} onChange={(e) => setRefCode(e.target.value)} placeholder="Booking reference code" className="input font-mono" />
            <button onClick={findBookingByRef} className="shrink-0 rounded-xl bg-[#102B2A] text-white font-bold px-4 text-sm hover:bg-[#0d201f] transition-colors flex items-center gap-2">
              <Search className="w-4 h-4" /> Find
            </button>
          </div>
          {foundBooking && (
            <div className="rounded-xl bg-[#f4f7f5] border border-slate-100 px-4 py-3 text-sm">
              <span className="font-bold text-[#102B2A]">{foundBooking.name}</span> · {foundBooking.city} · {foundBooking.items_description}
              <span className="text-slate-400 block text-xs mt-0.5">Quote: {foundBooking.quote_estimate || "—"} · Approved: {foundBooking.approved_quote_amount ? money(foundBooking.approved_quote_amount) : "not recorded"} · Final: {money(foundBooking.final_invoice || foundBooking.job_value || 0)}</span>
            </div>
          )}
          <textarea value={complaint} onChange={(e) => setComplaint(e.target.value)} rows={3} placeholder="The customer's complaint, in their words" className="input resize-none" />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <button onClick={createDispute} disabled={creating || !foundBooking || !complaint.trim()} className="rounded-full bg-[#187B65] text-white font-bold px-5 py-2.5 text-sm hover:bg-[#125C4E] transition-colors disabled:opacity-50">
            {creating ? "Opening…" : "Open dispute"}
          </button>
        </div>
      )}

      {disputes.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-10 text-center text-slate-500 text-sm">
          No disputes open. When a customer complains about a completed job, log it here (or Rex logs it in chat) and the full case file assembles automatically.
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <div key={d.id}>
              <button onClick={() => openCase(d)} className="w-full text-left rounded-2xl bg-white border border-slate-200 px-5 py-4 hover:border-[#187B65]/50 transition-colors">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-[#102B2A]">{d.customer_name || "Customer"} — {d.job_ref || d.booking_id.slice(-6)}</span>
                  <span className={`rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] border ${STATUS_STYLES[d.status] || STATUS_STYLES.open}`}>
                    {d.status.replace("_", " ")}
                  </span>
                  {d.case_summary && <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#187B65]">case file ready</span>}
                </div>
                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{d.complaint}</p>
                <p className="text-[11px] text-slate-400 mt-1">{(d.created_date || "").slice(0, 10)}</p>
              </button>

              {caseLoading && selected?.dispute?.id === d.id && (
                <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-[#187B65] animate-spin" /></div>
              )}

              {selected?.dispute?.id === d.id && !caseLoading && selected && (
                <CaseFile
                  caseData={selected}
                  summarizing={summarizing}
                  saving={saving}
                  onAssemble={assembleSummary}
                  onSave={saveDispute}
                  onClose={() => setSelected(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CaseFile({ caseData, summarizing, saving, onAssemble, onSave, onClose }) {
  const { dispute: d, booking, change_orders, payments } = caseData;
  const [notes, setNotes] = useState(d.resolution_notes || "");

  const Row = ({ label, value }) => (
    <div className="flex justify-between gap-3 text-sm py-1">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="font-semibold text-[#102B2A] text-right">{value ?? "—"}</span>
    </div>
  );

  return (
    <div className="mt-2 rounded-2xl border border-[#187B65]/30 bg-white p-5 space-y-5">
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#187B65] mb-2">Original scope & approval</h3>
          <div className="divide-y divide-slate-100">
            <Row label="Items" value={booking?.items_description} />
            <Row label="Estimate (preliminary)" value={booking?.quote_estimate} />
            <Row label="Approved quote" value={booking?.approved_quote_amount ? money(booking.approved_quote_amount) + ` (${booking.approval_method || "method n/a"}, ${booking.approval_date || "date n/a"})` : "No approval recorded"} />
            <Row label="Final invoice" value={money(booking?.final_invoice || booking?.job_value || 0)} />
            <Row label="Payment status" value={booking?.payment_status} />
            <Row label="Refunded" value={booking?.refund_amount ? money(booking.refund_amount) : "—"} />
          </div>
        </div>
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#187B65] mb-2">Change orders</h3>
          {change_orders.length === 0 ? (
            <p className="text-sm text-slate-400">No change orders on this job.</p>
          ) : (
            <div className="space-y-2">
              {change_orders.map((c) => (
                <div key={c.id} className="rounded-xl bg-[#f4f7f5] px-3 py-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-[#102B2A]">#{c.number} · {c.items}</span>
                    <span className="text-slate-500 shrink-0">{money(c.amount_delta)}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{c.status.replace("_", " ")}{c.approval_method ? ` · ${c.approval_method}` : ""}</div>
                </div>
              ))}
            </div>
          )}
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#187B65] mt-4 mb-2">Payments on record</h3>
          {payments.length === 0 ? (
            <p className="text-sm text-slate-400">No PayPal transactions linked to this booking.</p>
          ) : (
            payments.map((p, i) => (
              <div key={i} className="text-sm py-0.5 flex justify-between gap-2">
                <span className="text-slate-500">{p.purpose.replace(/_/g, " ")} · {(p.created_date || "").slice(0, 10)}</span>
                <span className="font-semibold text-[#102B2A]">{money(p.amount)} · {p.status}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#187B65] mb-2">Customer complaint</h3>
        <p className="text-sm text-slate-700 bg-[#f4f7f5] rounded-xl px-4 py-3">{d.complaint}</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#187B65]">Case summary</h3>
          <button onClick={onAssemble} disabled={summarizing} className="text-xs font-bold text-[#187B65] hover:underline flex items-center gap-1 disabled:opacity-50">
            <Sparkles className="w-3.5 h-3.5" /> {summarizing ? "Assembling…" : d.case_summary ? "Re-assemble" : "Assemble factual summary"}
          </button>
        </div>
        {d.case_summary ? (
          <div className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap flex gap-2">
            <FileText className="w-4 h-4 text-[#187B65] shrink-0 mt-0.5" /> {d.case_summary}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No summary yet. The assembler states facts from records only — it never invents approvals or legal conclusions.</p>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <label className="block">
          <span className="block text-xs font-bold text-[#102B2A] mb-1">Status</span>
          <select value={d.status} onChange={(e) => onSave({ status: e.target.value })} className="input text-sm py-2">
            {["open", "under_review", "awaiting_customer", "resolved", "closed"].map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-bold text-[#102B2A] mb-1">Outcome</span>
          <select value={d.resolution_outcome || ""} onChange={(e) => onSave({ resolution_outcome: e.target.value })} className="input text-sm py-2">
            {["", "refund_issued", "partial_credit", "goodwill_credit", "no_action", "revisit_required"].map((s) => (
              <option key={s} value={s}>{s ? s.replace(/_/g, " ") : "not set"}</option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button onClick={onClose} className="text-sm font-semibold text-slate-400 hover:text-[#102B2A]">Close case file</button>
        </div>
      </div>

      <label className="block">
        <span className="block text-xs font-bold text-[#102B2A] mb-1">Resolution notes</span>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input text-sm resize-none" placeholder="What was reviewed and decided, and why" />
      </label>
      <button
        onClick={() => onSave({ resolution_notes: notes })}
        disabled={saving || notes === (d.resolution_notes || "")}
        className="rounded-full bg-[#187B65] text-white font-bold px-5 py-2 text-sm hover:bg-[#125C4E] transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save resolution"}
      </button>
    </div>
  );
}