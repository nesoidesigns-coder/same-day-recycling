import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, FileSignature, CheckCircle2 } from "lucide-react";
import AgreementForm from "@/components/admin/agreements/AgreementForm";

const STATUS_STYLE = {
  draft: "bg-slate-100 text-slate-600",
  pending_contractor_acceptance: "bg-amber-100 text-amber-700",
  active: "bg-[#187B65]/15 text-[#187B65]",
  ended: "bg-red-100 text-red-700",
};

export default function AdminAgreements() {
  const [partners, setPartners] = useState(null);
  const [agreements, setAgreements] = useState([]);
  const [me, setMe] = useState(null);

  const load = async () => {
    const [p, a, user] = await Promise.all([
      base44.entities.Partner.filter({}, { sort: "-created_date", limit: 200 }),
      base44.entities.ContractorAgreement.filter({}, { sort: "-created_date", limit: 200 }),
      base44.auth.me(),
    ]);
    setPartners(p.items);
    setAgreements(a.items);
    setMe(user);
  };

  useEffect(() => { load(); }, []);

  // Contractor membership billing: generate the contractor's PayPal payment link.
  const [busyBilling, setBusyBilling] = useState("");
  const startBilling = async (a) => {
    setBusyBilling(a.id);
    try {
      const { data } = await base44.functions.invoke("paypalCheckout", { action: "start_membership_billing", agreement_id: a.id });
      try { await navigator.clipboard.writeText(data.pay_url); } catch { /* clipboard may be blocked - still show the URL */ }
      alert("PayPal billing link ready" + (navigator.clipboard ? " and copied to clipboard" : "") + " - send it to the contractor:\n\n" + data.pay_url);
    } catch (e) {
      alert(e?.response?.data?.error || e.message || "Could not start billing.");
    }
    setBusyBilling("");
  };

  // Nothing becomes active without an explicit administrator action.
  const setStatus = async (a, status) => {
    const patch = { status };
    if (status === "active") {
      patch.approved_by = me?.email || "";
      patch.effective_date = new Date().toISOString().slice(0, 10);
      patch.accepted_by_contractor_date = new Date().toISOString().slice(0, 10);
    }
    await base44.entities.ContractorAgreement.update(a.id, patch);
    load();
  };

  if (!partners) return <Loader2 className="w-8 h-8 text-[#187B65] animate-spin mx-auto my-20" />;

  const describe = (a) => {
    if (a.fee_model === "percentage") return `${a.fee_percent}% of invoice`;
    if (a.fee_model === "fixed") return `$${Number(a.fee_fixed_amount).toFixed(2)} per job`;
    return "No job fee";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#102B2A] tracking-tight flex items-center gap-2">
          <FileSignature className="w-6 h-6 text-[#187B65]" /> Contractor agreements
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Fees apply only under an active agreement. Create a draft, disclose it to the contractor, then activate once they have accepted. Nothing here charges anyone.
        </p>
      </div>
      <AgreementForm partners={partners} onSaved={load} />
      <div className="space-y-3">
        {agreements.length === 0 && <p className="text-sm text-slate-500 text-center py-8">No agreements yet. Existing jobs and referral commissions are unchanged.</p>}
        {agreements.map((a) => (
          <div key={a.id} className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-bold text-[#102B2A]">{a.partner_name}</div>
                <div className="text-xs text-slate-500">{a.agreement_type.replace(/_/g, " ")} · {describe(a)}{a.membership_fee_monthly ? ` · membership $${a.membership_fee_monthly}/mo` : ""}</div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${STATUS_STYLE[a.status]}`}>{a.status.replace(/_/g, " ")}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">{a.fee_disclosure}</p>
            {a.paypal_subscription_id && <p className="flex items-center gap-1 text-[11px] text-[#187B65] mt-1"><CheckCircle2 className="w-3 h-3" /> PayPal membership billing set up</p>}
            {a.status === "active" && <p className="flex items-center gap-1 text-[11px] text-[#187B65] mt-1"><CheckCircle2 className="w-3 h-3" /> Approved by {a.approved_by} · effective {a.effective_date}</p>}
            <div className="flex gap-2 mt-3">
              {a.status === "draft" && <button onClick={() => setStatus(a, "pending_contractor_acceptance")} className="rounded-full border border-amber-300 text-amber-700 font-bold px-4 py-1.5 text-xs">Send for contractor acceptance</button>}
              {a.status === "pending_contractor_acceptance" && <button onClick={() => setStatus(a, "active")} className="rounded-full bg-[#187B65] text-white font-bold px-4 py-1.5 text-xs">Confirm accepted &amp; activate</button>}
              {a.status === "active" && <button onClick={() => setStatus(a, "ended")} className="rounded-full border border-slate-200 text-slate-600 font-bold px-4 py-1.5 text-xs">End agreement</button>}
              {a.status !== "ended" && (Number(a.membership_fee_monthly) || Number((a.territory_subscription || {}).monthly_rate)) > 0 && (
                <button onClick={() => startBilling(a)} disabled={busyBilling === a.id} className="rounded-full border border-[#187B65] text-[#187B65] font-bold px-4 py-1.5 text-xs">
                  {busyBilling === a.id ? "Preparing…" : a.paypal_subscription_id ? "Copy billing link" : "Set up PayPal billing"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}