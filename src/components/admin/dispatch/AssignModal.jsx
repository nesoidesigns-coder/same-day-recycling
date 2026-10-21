import { useState, useEffect } from "react";
import { X, ShieldCheck, TriangleAlert, Scale } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { JOB_SOURCE_OPTIONS, previewFee } from "@/lib/feeRules";

const REFERRAL_COMMISSION_DEFAULT = 25;
const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);

export default function AssignModal({ booking, partners, onClose, onAssign }) {
  const verified = partners.filter((p) => p.verified && p.active !== false);
  const unverified = partners.filter((p) => !p.verified && p.active !== false);
  const cityMatches = (p) => p.city === booking.city;
  const ordered = [...verified].sort((a, b) => (cityMatches(b) ? 1 : 0) - (cityMatches(a) ? 1 : 0));
  const [partnerSel, setPartnerSel] = useState("");
  const [value, setValue] = useState(booking.job_value ? String(booking.job_value) : "");
  const [jobSource, setJobSource] = useState(booking.job_source || "platform_generated");
  const [rate, setRate] = useState(String(REFERRAL_COMMISSION_DEFAULT));
  const [agreement, setAgreement] = useState(null);
  const [busy, setBusy] = useState(false);

  // The fee comes only from this contractor's active agreement.
  useEffect(() => {
    setAgreement(null);
    if (!partnerSel) return;
    base44.entities.ContractorAgreement
      .filter({ partner_id: partnerSel, status: "active" }, { limit: 1 })
      .then((page) => setAgreement((page.items || [])[0] || null));
  }, [partnerSel]);

  const isPersonalReferral = jobSource === "personal_referral";
  const fee = previewFee(agreement, jobSource, Number(value) || 0);

  const submit = async () => {
    const p = partners.find((x) => String(x.id) === partnerSel);
    if (!p) return;
    setBusy(true);
    await onAssign({
      partner_id: p.id,
      partner_name: p.name,
      job_value: Number(value) || 0,
      job_source: jobSource,
      // Original customer source is set once and never rewritten.
      customer_origin_source: booking.customer_origin_source || (jobSource === "repeat_customer" ? undefined : jobSource),
      agreement_id: agreement?.id || "",
      fee_terms_snapshot: { disclosure: fee.disclosure, rule: fee.rule, agreement_id: agreement?.id || null },
      // Existing personal referral arrangement, applied only where chosen.
      referred_by_admin: isPersonalReferral,
      commission_rate: isPersonalReferral ? Math.min(100, Math.max(0, Number(rate) || 0)) : 0,
    });
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[#102B2A]/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#102B2A]">Assign to partner</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">{booking.name} · {booking.city || "unknown city"} · {booking.preferred_date || "no date"}</p>
        <div className="space-y-3">
          <label className="block">
            <span className="block text-xs font-semibold text-[#102B2A] mb-1">Verified partner {ordered.length === 0 && "(none yet)"}</span>
            <select value={partnerSel} onChange={(e) => setPartnerSel(e.target.value)} className="input py-2.5">
              <option value="">Select partner…</option>
              {ordered.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.city}{cityMatches(p) ? " (this city)" : ""}</option>)}
            </select>
          </label>
          {unverified.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 mb-1">
                <TriangleAlert className="w-3.5 h-3.5" /> Pending verification — cannot be assigned yet
              </div>
              <p className="text-xs text-amber-700">{unverified.map((p) => `${p.name} (${p.city || "city not set"})`).join(", ")}. Verify their contact details and authorization before dispatching jobs to them.</p>
            </div>
          )}
          {verified.length === 0 && (
            <p className="text-xs text-slate-500">No verified partners yet. Add the partner in Partners with verified contact details, then mark them verified to enable assignment.</p>
          )}
          <label className="block">
            <span className="block text-xs font-semibold text-[#102B2A] mb-1">Estimated job value $</span>
            <input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} className="input py-2.5" />
          </label>
          <label className="block">
            <span className="block text-xs font-semibold text-[#102B2A] mb-1">Job source</span>
            <select value={jobSource} onChange={(e) => setJobSource(e.target.value)} className="input py-2.5">
              {JOB_SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span className="block text-[11px] text-slate-400 mt-1">The source is a record. Fees apply only under the contractor's active agreement.</span>
          </label>
          {isPersonalReferral && (
            <label className="block">
              <span className="block text-xs font-semibold text-[#102B2A] mb-1">Personal referral commission % (this job only)</span>
              <input type="number" min="0" max="100" value={rate} onChange={(e) => setRate(e.target.value)} className="input py-2.5" />
              <span className="block text-[11px] text-slate-400 mt-1">Your existing referral arrangement. Earned when the job completes; never applied to other jobs.</span>
            </label>
          )}
          {partnerSel && (
            <div className="rounded-xl border border-[#187B65]/30 bg-[#f4f7f5] p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#102B2A] mb-1">
                <Scale className="w-3.5 h-3.5 text-[#187B65]" /> Fee terms the contractor will see
              </div>
              <p className="text-xs text-slate-600">{fee.disclosure}</p>
              {fee.fee > 0 && <p className="text-xs font-bold text-[#187B65] mt-1">Estimated platform fee: {money(fee.fee)}</p>}
              {!agreement && <p className="text-[11px] text-slate-400 mt-1">No active agreement on file for this contractor.</p>}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={submit} disabled={busy || !partnerSel} className="flex-1 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-5 py-3 disabled:opacity-50">
              {busy ? "Assigning…" : "Assign job"}
            </button>
            <button onClick={onClose} className="rounded-full border border-slate-200 text-slate-600 font-bold px-5 py-3">Cancel</button>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-slate-400"><ShieldCheck className="w-3.5 h-3.5" /> Assignment records the job only — no dispatch, customer contact or payment happens automatically.</p>
        </div>
      </div>
    </div>
  );
}