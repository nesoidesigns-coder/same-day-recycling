import { Building2, Copy, Check, XCircle } from "lucide-react";
import { money, STATUSES, statusBadge } from "./shared";

export default function CommandCompanies({ licenses, busyId, copiedId, onCopyPayLink, onCancelSubscription, onStatusChange }) {
  return (
    <>
      <h2 className="text-sm font-bold tracking-wide text-emerald-100/60 uppercase mb-3">Licensed companies ({licenses.length})</h2>
      <div className="space-y-3">
        {licenses.length === 0 && (
          <div className="holo-panel-deep rounded-2xl border border-[#187B65]/20 p-10 text-center text-emerald-100/50">
            <Building2 className="w-8 h-8 mx-auto text-emerald-100/20" />
            <p className="mt-3">No licenses yet — sales from the software page appear here.</p>
          </div>
        )}
        {licenses.map((c) => (
          <div key={c.id} className="holo-panel-deep rounded-2xl border border-[#187B65]/20 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[#54D9AE] text-lg">{c.company}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 ${statusBadge(c.status)}`}>{c.status}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-[#102B2A] text-[#187B65] px-2.5 py-0.5 border border-[#187B65]/30">{c.plan}</span>
                </div>
                <div className="text-sm text-emerald-100/60 mt-1">{c.contact_name} · {c.email}{c.city ? ` · ${c.city}, ${c.province || ""}` : ""}</div>
                <div className="text-xs text-emerald-100/40 mt-1">Setup {money(c.setup_fee)} · {money(c.monthly_fee)}/mo{c.provisioned_date ? ` · provisioned ${c.provisioned_date}` : ""}</div>
                {c.notes && <p className="text-xs text-amber-300/80 mt-1">{c.notes}</p>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => onCopyPayLink(c)} disabled={busyId === c.id} className="rounded-full border border-[#187B65]/40 text-[#54D9AE] px-4 py-2 text-xs font-bold hover:bg-[#187B65]/10 transition-colors flex items-center gap-1.5 disabled:opacity-60">
                  {copiedId === c.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === c.id ? "Copied" : c.pay_token ? "Payment link" : "Create payment link"}
                </button>
                {c.paypal_subscription_id && c.status === "active" && (
                  <button onClick={() => onCancelSubscription(c)} disabled={busyId === c.id} className="rounded-full bg-red-500/20 text-red-300 px-4 py-2 text-xs font-bold hover:bg-red-500/30 transition-colors flex items-center gap-1.5 disabled:opacity-60">
                    <XCircle className="w-3.5 h-3.5" /> Cancel sub
                  </button>
                )}
                <select value={c.status} onChange={(e) => onStatusChange(c.id, e.target.value)} disabled={busyId === c.id} className="rounded-xl bg-[#06251b] border border-[#187B65]/30 px-3 py-2 text-xs font-bold text-[#54D9AE]">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}