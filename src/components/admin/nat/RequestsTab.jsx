import { useEffect, useState } from "react";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { provinceName, SERVICE_TYPES } from "@/lib/geo";
import DispatchSettingsCard from "@/components/admin/nat/DispatchSettingsCard";

const STATUSES = ["new", "provider_matching", "recruiting", "matched", "confirmed", "completed", "cancelled"];

const DISPATCH_STATUSES = ["awaiting_contractor", "contractor_contacted", "contractor_accepted", "pickup_scheduled", "job_completed", "unable_to_fulfill"];

const DISPATCH_LABEL = {
  awaiting_contractor: "Awaiting contractor",
  contractor_contacted: "Contractor contacted",
  contractor_accepted: "Contractor accepted",
  pickup_scheduled: "Pickup scheduled",
  job_completed: "Job completed",
  unable_to_fulfill: "Unable to fulfill",
};

const STATUS_STYLE = {
  verified: "bg-[#187B65]/10 text-[#187B65]",
  onboarding: "bg-amber-50 text-amber-700",
  unverified: "bg-slate-100 text-slate-600",
};

export default function RequestsTab() {
  const [filter, setFilter] = useState("open");
  const [requests, setRequests] = useState(null);
  const [providers, setProviders] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [edit, setEdit] = useState({});
  const [saving, setSaving] = useState(false);
  const [tasks, setTasks] = useState({});
  const [offers, setOffers] = useState({});
  const [matching, setMatching] = useState(false);

  const loadOffers = async (id) => {
    const page = await base44.entities.LeadOffer.filter({ request_id: id }, { sort: "-created_date", limit: 20 });
    setOffers((o) => ({ ...o, [id]: page.items || page }));
  };

  const runMatch = async (r) => {
    setMatching(true);
    try {
      await base44.functions.invoke("dispatchEngine", { action: "admin_match", request_id: r.id });
      await Promise.all([load(), loadOffers(r.id)]);
    } finally {
      setMatching(false);
    }
  };

  const load = async () => {
    const query = filter === "all" ? {} : filter === "open" ? { status: { $in: ["new", "provider_matching", "recruiting", "matched"] } } : { status: filter };
    const page = await base44.entities.NationalRequest.filter(query, { sort: "-created_date", limit: 50 });
    setRequests(page.items || page);
    const provPage = await base44.entities.ProviderRecruit.filter({ verified: true }, { limit: 200 });
    setProviders((provPage.items || provPage));
    const taskPage = await base44.entities.DispatchTask.filter({}, { limit: 500 });
    const byRequest = {};
    ((taskPage.items || taskPage) || []).forEach((t) => { byRequest[t.request_id] = t; });
    setTasks(byRequest);
  };

  useEffect(() => { load(); }, [filter]);

  const setStatus = async (id, status) => {
    setSaving(true);
    try { await base44.entities.NationalRequest.update(id, { status }); await load(); } finally { setSaving(false); }
  };

  const saveMatch = async (r) => {
    setSaving(true);
    try {
      const partner = providers.find((p) => p.id === edit.partner_id);
      await base44.entities.NationalRequest.update(r.id, {
        partner_id: edit.partner_id || r.partner_id || "",
        partner_name: partner?.company || r.partner_name || "",
        status: edit.partner_id ? "matched" : r.status,
        quote_status: edit.partner_id ? "pending_provider" : r.quote_status,
        quote_amount: edit.quote_amount !== undefined && edit.quote_amount !== "" ? Number(edit.quote_amount) : r.quote_amount,
        appointment_date: edit.appointment_date || r.appointment_date || "",
      });
      setOpenId(null);
      await load();
    } finally { setSaving(false); }
  };

  const setDispatch = async (r, dispatch_status) => {
    setSaving(true);
    try {
      const task = tasks[r.id];
      await base44.entities.NationalRequest.update(r.id, { dispatch_status });
      if (task) await base44.entities.DispatchTask.update(task.id, { status: dispatch_status });
      await load();
    } finally { setSaving(false); }
  };

  const saveDispatch = async (r) => {
    setSaving(true);
    try {
      const logEntry = (edit.contact || edit.note)
        ? { date: new Date().toISOString(), contact: String(edit.contact || "").slice(0, 80), note: String(edit.note || "").slice(0, 300) }
        : null;
      const payload = {
        dispatch_status: edit.dispatch_status || r.dispatch_status || "awaiting_contractor",
        contacted_contractor: String(edit.contacted_contractor ?? r.contacted_contractor ?? "").slice(0, 200),
      };
      if (logEntry) payload.dispatch_contact_log = [...(r.dispatch_contact_log || []), logEntry];
      const task = tasks[r.id];
      if (task) {
        const taskUpdate = { status: payload.dispatch_status };
        if (payload.contacted_contractor) taskUpdate.assigned_provider = payload.contacted_contractor;
        if (logEntry) taskUpdate.contact_log = [...(task.contact_log || []), logEntry];
        await base44.entities.DispatchTask.update(task.id, taskUpdate);
      }
      await base44.entities.NationalRequest.update(r.id, payload);
      setOpenId(null);
      await load();
    } finally { setSaving(false); }
  };

  const quoteSent = async (r) => {
    setSaving(true);
    try { await base44.entities.NationalRequest.update(r.id, { quote_status: "sent", quote_amount: Number(edit.quote_amount ?? r.quote_amount ?? 0) || r.quote_amount }); await load(); } finally { setSaving(false); }
  };

  const serviceLabel = (v) => SERVICE_TYPES.find((s) => s.value === v)?.label || v;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input max-w-48">
          <option value="open">Open requests</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          <option value="all">All statuses</option>
        </select>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-[#187B65] self-center" />}
      </div>
      <DispatchSettingsCard />

      {requests === null ? (
        <div className="flex items-center gap-2 text-slate-500 py-10"><Loader2 className="w-5 h-5 animate-spin" /> Loading requests…</div>
      ) : requests.length === 0 ? (
        <p className="text-sm text-slate-500 py-6">No requests match this filter.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-[#102B2A]">{r.name} · {r.city}{r.province_code ? `, ${r.province_code}` : ""}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{serviceLabel(r.service_type)} — {r.items_description}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{r.phone}{r.email ? ` · ${r.email}` : ""}{r.reference_code ? ` · Ref ${r.reference_code}` : ""}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_STYLE[r.coverage_status] || ""}`}>
                    {r.coverage_status === "verified" ? "Verified" : "Confirmation required"}
                  </span>
                  <select value={r.dispatch_status || "awaiting_contractor"} onChange={(e) => setDispatch(r, e.target.value)} className="text-xs font-semibold border border-[#187B65]/40 rounded-lg px-2 py-1.5 bg-[#f4f7f5] text-[#102B2A]">
                    {DISPATCH_STATUSES.map((s) => <option key={s} value={s}>{DISPATCH_LABEL[s]}</option>)}
                  </select>
                  <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} className="text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                  </select>
                  <button onClick={() => { const next = openId === r.id ? null : r.id; setOpenId(next); if (next) loadOffers(r.id); setEdit({ partner_id: r.partner_id, quote_amount: r.quote_amount ?? "", appointment_date: r.appointment_date || "", dispatch_status: r.dispatch_status || "awaiting_contractor", contacted_contractor: r.contacted_contractor || "" }); }} className="p-1.5 text-slate-400 hover:text-[#187B65]">
                    {openId === r.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {(r.partner_name || r.quote_status !== "none") && (
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
                  {r.partner_name && <span className="rounded-full bg-[#f4f7f5] px-2.5 py-1 text-[#187B65]">Provider: {r.partner_name}</span>}
                  {r.quote_status !== "none" && <span className="rounded-full bg-[#f4f7f5] px-2.5 py-1 text-slate-600">Quote: {r.quote_status.replace(/_/g, " ")}{r.quote_amount ? ` · $${r.quote_amount}` : ""}</span>}
                  {r.appointment_date && <span className="rounded-full bg-[#f4f7f5] px-2.5 py-1 text-slate-600">Appt: {r.appointment_date}</span>}
                </div>
              )}
              {openId === r.id && (
                <div className="mt-4 rounded-xl bg-[#f4f7f5] border border-slate-100 p-4 space-y-3">
                  <div className="grid sm:grid-cols-3 gap-3">
                    <label className="block">
                      <span className="block text-xs font-semibold text-[#102B2A] mb-1">Assign verified provider</span>
                      <select value={edit.partner_id || ""} onChange={(e) => setEdit((p) => ({ ...p, partner_id: e.target.value }))} className="input text-sm">
                        <option value="">— none —</option>
                        {providers.map((p) => <option key={p.id} value={p.id}>{p.company}{p.territory ? ` (${p.territory})` : ""}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="block text-xs font-semibold text-[#102B2A] mb-1">Quote amount (CAD)</span>
                      <input type="number" value={edit.quote_amount ?? ""} onChange={(e) => setEdit((p) => ({ ...p, quote_amount: e.target.value }))} className="input text-sm" placeholder="e.g. 249" />
                    </label>
                    <label className="block">
                      <span className="block text-xs font-semibold text-[#102B2A] mb-1">Appointment date</span>
                      <input type="date" value={edit.appointment_date || ""} onChange={(e) => setEdit((p) => ({ ...p, appointment_date: e.target.value }))} className="input text-sm" />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => saveMatch(r)} disabled={saving} className="rounded-full bg-[#187B65] text-[#102B2A] text-xs font-bold px-4 py-2 hover:bg-[#125C4E]">Save match</button>
                    <button onClick={() => quoteSent(r)} disabled={saving} className="rounded-full border border-[#187B65] text-[#187B65] text-xs font-bold px-4 py-2 hover:bg-[#187B65]/10">Mark quote sent</button>
                  </div>
                  <p className="text-[11px] text-slate-500">Confirm an appointment only after the contractor accepts the job — the system never auto-confirms.</p>
                  <div className="pt-3 border-t border-slate-200/70">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="text-xs font-bold text-[#102B2A]">Lead offers (auto-dispatch)</div>
                      <button onClick={() => runMatch(r)} disabled={matching} className="rounded-full border border-[#187B65] text-[#187B65] text-xs font-bold px-4 py-2 hover:bg-[#187B65]/10 flex items-center gap-1.5">
                        {matching && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Run smart match now
                      </button>
                    </div>
                    {((offers[r.id] || [])).length === 0 ? (
                      <p className="text-[11px] text-slate-500">No offers yet. Run smart match, or assign manually above.</p>
                    ) : (
                      <ul className="space-y-1">
                        {(offers[r.id] || []).map((o) => (
                          <li key={o.id} className="text-[11px] text-slate-600">
                            Round {o.round} · {o.partner_name} — <span className="font-bold">{o.status}</span>
                            {o.fee_amount ? ` · fee $${o.fee_amount}` : ""}
                            {o.expires_at && o.status === "offered" ? ` · expires ${String(o.expires_at).slice(0, 16).replace("T", " ")}` : ""}
                            {o.notes ? ` · ${o.notes}` : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="pt-3 border-t border-slate-200/70">
                    <div className="text-xs font-bold text-[#102B2A] mb-2">Dispatch fulfilment</div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="block text-xs font-semibold text-[#102B2A] mb-1">Contacted contractor (registered or newly sourced)</span>
                        <input value={edit.contacted_contractor || ""} onChange={(e) => setEdit((p) => ({ ...p, contacted_contractor: e.target.value }))} className="input text-sm" placeholder="e.g. NorthStar Hauling — 604-555-0123" />
                      </label>
                      <label className="block">
                        <span className="block text-xs font-semibold text-[#102B2A] mb-1">Dispatch status</span>
                        <select value={edit.dispatch_status || "awaiting_contractor"} onChange={(e) => setEdit((p) => ({ ...p, dispatch_status: e.target.value }))} className="input text-sm">
                          {DISPATCH_STATUSES.map((s) => <option key={s} value={s}>{DISPATCH_LABEL[s]}</option>)}
                        </select>
                      </label>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 mt-3">
                      <label className="block">
                        <span className="block text-xs font-semibold text-[#102B2A] mb-1">Contacted by</span>
                        <input value={edit.contact || ""} onChange={(e) => setEdit((p) => ({ ...p, contact: e.target.value }))} className="input text-sm" placeholder="Your name" />
                      </label>
                      <label className="block">
                        <span className="block text-xs font-semibold text-[#102B2A] mb-1">Contact note</span>
                        <input value={edit.note || ""} onChange={(e) => setEdit((p) => ({ ...p, note: e.target.value }))} className="input text-sm" placeholder="Outcome of the call, pricing discussed…" />
                      </label>
                    </div>
                    <button onClick={() => saveDispatch(r)} disabled={saving} className="mt-3 rounded-full bg-[#187B65] text-[#102B2A] text-xs font-bold px-4 py-2 hover:bg-[#125C4E]">Log contact &amp; save dispatch</button>
                    {((r.dispatch_contact_log?.length || 0) + (tasks[r.id]?.contact_log?.length || 0)) > 0 && (
                      <ul className="mt-3 space-y-1 text-[11px] text-slate-500">
                        {[...(r.dispatch_contact_log || []), ...((tasks[r.id]?.contact_log) || [])].map((c, i) => (
                          <li key={i}>{String(c.date || "").slice(0, 10)}{c.contact ? ` · ${c.contact}` : ""} — {c.note}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}