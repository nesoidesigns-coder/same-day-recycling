import { useEffect, useState } from "react";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { provinceName, SERVICE_TYPES } from "@/lib/geo";

const STATUSES = ["new", "provider_matching", "recruiting", "matched", "confirmed", "completed", "cancelled"];

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

  const load = async () => {
    const query = filter === "all" ? {} : filter === "open" ? { status: { $in: ["new", "provider_matching", "recruiting", "matched"] } } : { status: filter };
    const page = await base44.entities.NationalRequest.filter(query, { sort: "-created_date", limit: 50 });
    setRequests(page.items || page);
    const provPage = await base44.entities.ProviderRecruit.filter({ verified: true }, { limit: 200 });
    setProviders((provPage.items || provPage));
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
                  <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} className="text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                  </select>
                  <button onClick={() => { setOpenId(openId === r.id ? null : r.id); setEdit({ partner_id: r.partner_id, quote_amount: r.quote_amount ?? "", appointment_date: r.appointment_date || "" }); }} className="p-1.5 text-slate-400 hover:text-[#187B65]">
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
                  <p className="text-[11px] text-slate-500">Confirm an appointment only after the provider accepts the job — the system never auto-confirms.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}