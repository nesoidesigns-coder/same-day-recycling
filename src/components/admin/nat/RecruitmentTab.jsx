import { useEffect, useState } from "react";
import { Loader2, Plus, BadgeCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { REGIONS, provinceName, SERVICE_TYPES } from "@/lib/geo";

const OUTREACH = ["not_contacted", "contacted", "callback_scheduled", "in_discussion", "proposal_sent", "no_response"];
const PARTNERSHIP = ["prospect", "applying", "verifying", "verified", "declined"];

export default function RecruitmentTab() {
  const [recruits, setRecruits] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newP, setNewP] = useState({ company: "", contact_name: "", email: "", phone: "", province_code: "BC", territory: "", services: [] });
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState({});

  const load = async () => {
    const page = await base44.entities.ProviderRecruit.filter({}, { sort: "-created_date", limit: 100 });
    setRecruits(page.items || page);
  };
  useEffect(() => { load(); }, []);

  const createProvider = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await base44.entities.ProviderRecruit.create({ ...newP, source: "admin" });
      setNewP({ company: "", contact_name: "", email: "", phone: "", province_code: "BC", territory: "", services: [] });
      setShowForm(false);
      await load();
    } finally { setSaving(false); }
  };

  const update = async (id, data) => {
    setSaving(true);
    try { await base44.entities.ProviderRecruit.update(id, data); await load(); } finally { setSaving(false); }
  };

  const toggleVerified = (r) => update(r.id, { verified: !r.verified, partnership_status: !r.verified ? "verified" : r.partnership_status === "verified" ? "verifying" : r.partnership_status });

  const select = (label, value, onChange) => (
    <label className="block">
      <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">{label}</span>
      <select value={value} onChange={onChange} className="text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1.5 bg-white w-full">
        {label === "Outreach" ? OUTREACH.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>) : PARTNERSHIP.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </label>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">Independent directory facilities are kept separate — only records here are contracted service providers.</p>
        <button onClick={() => setShowForm(!showForm)} className="rounded-full bg-[#102B2A] text-white text-xs font-bold px-4 py-2.5 hover:bg-[#0a3020] flex items-center gap-1.5 shrink-0">
          <Plus className="w-4 h-4" /> New provider
        </button>
      </div>

      {showForm && (
        <form onSubmit={createProvider} className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input required value={newP.company} onChange={(e) => setNewP((p) => ({ ...p, company: e.target.value }))} className="input" placeholder="Company name *" />
            <input value={newP.contact_name} onChange={(e) => setNewP((p) => ({ ...p, contact_name: e.target.value }))} className="input" placeholder="Contact name" />
            <input type="email" value={newP.email} onChange={(e) => setNewP((p) => ({ ...p, email: e.target.value }))} className="input" placeholder="Email" />
            <input value={newP.phone} onChange={(e) => setNewP((p) => ({ ...p, phone: e.target.value }))} className="input" placeholder="Phone" />
            <select value={newP.province_code} onChange={(e) => setNewP((p) => ({ ...p, province_code: e.target.value }))} className="input" required>
              {REGIONS.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
            </select>
            <input value={newP.territory} onChange={(e) => setNewP((p) => ({ ...p, territory: e.target.value }))} className="input" placeholder="Service territory (city / cities)" />
          </div>
          <div className="flex flex-wrap gap-2">
            {SERVICE_TYPES.map((s) => (
              <button
                type="button"
                key={s.value}
                onClick={() => setNewP((p) => ({ ...p, services: p.services.includes(s.value) ? p.services.filter((x) => x !== s.value) : [...p.services, s.value] }))}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition-colors ${newP.services.includes(s.value) ? "bg-[#187B65] text-[#102B2A] border-[#187B65]" : "bg-white text-slate-600 border-slate-200"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button disabled={saving} className="rounded-full bg-[#187B65] text-[#102B2A] text-sm font-bold px-5 py-2.5 hover:bg-[#125C4E] flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add provider
          </button>
        </form>
      )}

      {recruits === null ? (
        <div className="flex items-center gap-2 text-slate-500 py-10"><Loader2 className="w-5 h-5 animate-spin" /> Loading recruitment pipeline…</div>
      ) : recruits.length === 0 ? (
        <p className="text-sm text-slate-500 py-6">No providers in the recruitment pipeline yet. Recruitment tasks appear here automatically when national requests arrive from uncovered markets.</p>
      ) : (
        <div className="space-y-3">
          {recruits.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-[#102B2A] flex items-center gap-1.5">
                    {r.company}
                    {r.verified && <BadgeCheck className="w-4 h-4 text-[#187B65]" />}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {provinceName(r.province_code) || r.province_code}{r.territory ? ` · ${r.territory}` : ""}{r.assigned_lead_count ? ` · ${r.assigned_lead_count} assigned lead${r.assigned_lead_count > 1 ? "s" : ""}` : ""}
                  </div>
                  {r.next_followup_date && <div className="text-xs text-amber-700 font-semibold mt-0.5">Follow up: {r.next_followup_date}</div>}
                </div>
                <button onClick={() => toggleVerified(r)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${r.verified ? "bg-[#187B65] text-[#102B2A]" : "border border-slate-200 text-slate-600 hover:border-[#187B65]"}`}>
                  {r.verified ? "Verified" : "Mark verified"}
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
                {select("Outreach", r.outreach_status, (e) => update(r.id, { outreach_status: e.target.value }))}
                {select("Partnership", r.partnership_status, (e) => update(r.id, { partnership_status: e.target.value, verified: e.target.value === "verified" ? true : r.verified }))}
                <label className="block">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">Next follow-up</span>
                  <input type="date" value={r.next_followup_date || ""} onChange={(e) => update(r.id, { next_followup_date: e.target.value })} className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white w-full" />
                </label>
                <button onClick={() => { setOpenId(openId === r.id ? null : r.id); setDetail({ pricing_model: r.pricing_model || "", capacity: r.capacity || "", verification_notes: r.verification_notes || "", notes: r.notes || "" }); }} className="text-xs font-bold text-[#187B65] hover:underline text-left">
                  {openId === r.id ? "Hide details" : "Details / verification"}
                </button>
              </div>
              {openId === r.id && (
                <div className="mt-3 rounded-xl bg-[#f4f7f5] border border-slate-100 p-4 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <input value={detail.pricing_model} onChange={(e) => setDetail((d) => ({ ...d, pricing_model: e.target.value }))} className="input text-sm" placeholder="Pricing model (e.g. volume-based, flat rate)" />
                    <input value={detail.capacity} onChange={(e) => setDetail((d) => ({ ...d, capacity: e.target.value }))} className="input text-sm" placeholder="Service capacity (jobs/week)" />
                  </div>
                  <textarea value={detail.verification_notes} onChange={(e) => setDetail((d) => ({ ...d, verification_notes: e.target.value }))} rows={2} className="input text-sm resize-none" placeholder="Verification records (licence, insurance, WCB references)" />
                  <textarea value={detail.notes} onChange={(e) => setDetail((d) => ({ ...d, notes: e.target.value }))} rows={2} className="input text-sm resize-none" placeholder="Internal notes" />
                  <button onClick={() => update(r.id, detail)} disabled={saving} className="rounded-full bg-[#187B65] text-[#102B2A] text-xs font-bold px-4 py-2 hover:bg-[#125C4E]">Save details</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}