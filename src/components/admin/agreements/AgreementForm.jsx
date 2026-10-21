import { useState } from "react";
import { base44 } from "@/api/base44Client";

const SOURCES = [
  { value: "platform_generated", label: "Platform-generated jobs" },
  { value: "personal_referral", label: "Personal referral jobs" },
  { value: "other_referral", label: "Other authorized referrals" },
];

const TYPES = [
  { value: "network_membership", label: "Contractor network membership" },
  { value: "private_commission", label: "Private commission agreement" },
  { value: "software_license_only", label: "Software license only (no job fees)" },
];

const blank = {
  partner_id: "", agreement_type: "network_membership", fee_model: "none", fee_percent: "",
  fee_fixed_amount: "", applies_to_sources: [], membership_fee_monthly: "", fee_disclosure: "",
};

export default function AgreementForm({ partners, onSaved }) {
  const [f, setF] = useState(blank);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const toggleSource = (v) => set("applies_to_sources", f.applies_to_sources.includes(v) ? f.applies_to_sources.filter((x) => x !== v) : [...f.applies_to_sources, v]);

  const autoDisclosure = () => {
    if (f.agreement_type === "software_license_only" || f.fee_model === "none" || f.applies_to_sources.length === 0) {
      return "No platform fee applies to your jobs. You keep 100% of revenue from customers you acquire.";
    }
    const what = f.fee_model === "percentage" ? `${Number(f.fee_percent) || 0}% of the final invoice` : `a fixed $${(Number(f.fee_fixed_amount) || 0).toFixed(2)} per job`;
    return `A platform fee of ${what} applies only to: ${f.applies_to_sources.map((s) => s.replace(/_/g, " ")).join(", ")}. Jobs you source yourself are never charged.`;
  };

  const save = async () => {
    const p = partners.find((x) => x.id === f.partner_id);
    if (!p) return;
    setSaving(true);
    await base44.entities.ContractorAgreement.create({
      partner_id: p.id,
      partner_name: p.name,
      partner_email: p.email,
      agreement_type: f.agreement_type,
      fee_model: f.agreement_type === "software_license_only" ? "none" : f.fee_model,
      fee_percent: Number(f.fee_percent) || 0,
      fee_fixed_amount: Number(f.fee_fixed_amount) || 0,
      applies_to_sources: f.agreement_type === "software_license_only" ? [] : f.applies_to_sources,
      membership_fee_monthly: Number(f.membership_fee_monthly) || 0,
      fee_disclosure: f.fee_disclosure.trim() || autoDisclosure(),
      status: "draft",
    });
    setSaving(false);
    setF(blank);
    onSaved();
  };

  const isSoftware = f.agreement_type === "software_license_only";

  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5 space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#102B2A]">New agreement (saved as draft)</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <select value={f.partner_id} onChange={(e) => set("partner_id", e.target.value)} className="input py-2.5" aria-label="Contractor">
          <option value="">Select contractor…</option>
          {partners.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.city}</option>)}
        </select>
        <select value={f.agreement_type} onChange={(e) => set("agreement_type", e.target.value)} className="input py-2.5" aria-label="Agreement type">
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        {!isSoftware && (
          <select value={f.fee_model} onChange={(e) => set("fee_model", e.target.value)} className="input py-2.5" aria-label="Fee model">
            <option value="none">No job fee</option>
            <option value="percentage">Percentage of invoice</option>
            <option value="fixed">Fixed fee per job</option>
          </select>
        )}
        {!isSoftware && f.fee_model === "percentage" && (
          <input type="number" min="0" max="100" placeholder="Fee % (e.g. 25)" value={f.fee_percent} onChange={(e) => set("fee_percent", e.target.value)} className="input py-2.5" />
        )}
        {!isSoftware && f.fee_model === "fixed" && (
          <input type="number" min="0" placeholder="Fixed fee $ per job" value={f.fee_fixed_amount} onChange={(e) => set("fee_fixed_amount", e.target.value)} className="input py-2.5" />
        )}
        {f.agreement_type === "network_membership" && (
          <input type="number" min="0" placeholder="Monthly membership $ (optional)" value={f.membership_fee_monthly} onChange={(e) => set("membership_fee_monthly", e.target.value)} className="input py-2.5" />
        )}
      </div>
      {!isSoftware && f.fee_model !== "none" && (
        <div>
          <div className="text-xs font-semibold text-[#102B2A] mb-1">Fee applies only to</div>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((s) => (
              <label key={s.value} className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 cursor-pointer">
                <input type="checkbox" checked={f.applies_to_sources.includes(s.value)} onChange={() => toggleSource(s.value)} /> {s.label}
              </label>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Jobs the contractor sources themselves are never listed here and are never charged.</p>
        </div>
      )}
      <div className="rounded-xl bg-[#f6f8f7] p-3 text-xs text-slate-600">
        <span className="font-bold text-[#102B2A]">Disclosure shown to contractor: </span>
        {f.fee_disclosure.trim() || autoDisclosure()}
      </div>
      <textarea value={f.fee_disclosure} onChange={(e) => set("fee_disclosure", e.target.value)} placeholder="Optional: write your own disclosure wording" rows={2} maxLength={1000} className="input text-sm" />
      <button onClick={save} disabled={saving || !f.partner_id} className="rounded-full bg-[#187B65] text-white font-bold px-6 py-2.5 text-sm disabled:opacity-50">
        {saving ? "Saving…" : "Save draft"}
      </button>
    </div>
  );
}