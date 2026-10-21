import { useState } from "react";
import { X, ShieldCheck, TriangleAlert } from "lucide-react";

const REFERRAL_COMMISSION_DEFAULT = 25;

export default function AssignModal({ booking, partners, onClose, onAssign }) {
  const verified = partners.filter((p) => p.verified && p.active !== false);
  const unverified = partners.filter((p) => !p.verified && p.active !== false);
  const cityMatches = (p) => p.city === booking.city;
  const ordered = [...verified].sort((a, b) => (cityMatches(b) ? 1 : 0) - (cityMatches(a) ? 1 : 0));
  const [partnerSel, setPartnerSel] = useState("");
  const [value, setValue] = useState(booking.job_value ? String(booking.job_value) : "");
  const [referral, setReferral] = useState(false);
  const [rate, setRate] = useState(String(REFERRAL_COMMISSION_DEFAULT));
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const p = partners.find((x) => String(x.id) === partnerSel);
    if (!p) return;
    setBusy(true);
    await onAssign({
      partner_id: p.id,
      partner_name: p.name,
      job_value: Number(value) || 0,
      referred_by_admin: referral,
      commission_rate: referral ? Math.min(100, Math.max(0, Number(rate) || 0)) : 0,
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
          <label className="flex items-start gap-2 rounded-xl bg-[#f6f8f7] p-3 cursor-pointer">
            <input type="checkbox" checked={referral} onChange={(e) => setReferral(e.target.checked)} className="mt-0.5" />
            <span className="text-xs font-semibold text-[#102B2A]">
              Referral — I originated this job and am referring it to this partner
              <span className="block text-[11px] font-normal text-slate-500">Earns commission on the final invoice when the job completes.</span>
            </span>
          </label>
          {referral && (
            <label className="block">
              <span className="block text-xs font-semibold text-[#102B2A] mb-1">Commission rate %</span>
              <input type="number" min="0" max="100" value={rate} onChange={(e) => setRate(e.target.value)} className="input py-2.5" />
            </label>
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