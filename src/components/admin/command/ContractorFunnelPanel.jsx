import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MousePointerClick, Handshake, MonitorPlay, FileSignature, ShieldCheck, Zap, Truck, Repeat } from "lucide-react";

const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-CA");

const STAGE_ICONS = {
  discovery: MousePointerClick,
  interest: Handshake,
  demo: MonitorPlay,
  application: FileSignature,
  verification: ShieldCheck,
  activation: Zap,
  jobs: Truck,
  retention: Repeat,
};

const RATE_LABELS = {
  discovery_to_interest_pct: "Discovery → interest",
  interest_to_application_pct: "Interest → application",
  application_to_approval_pct: "Application → approved",
  verification_to_activation_pct: "Verified → activated",
};

// Contractor funnel — Discovery → Interest → Demo → Application → Verification
// → Activation → Completed jobs → Retention. Observed records only.
export default function ContractorFunnelPanel({ days }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    setData(null);
    setError(null);
    base44.functions.invoke("marketingCommand", { days })
      .then((res) => { if (live) setData(res.data); })
      .catch((e) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [days]);

  if (error) {
    return <div className="mt-6 rounded-2xl bg-white border border-red-200 px-5 py-4 text-sm text-red-700">{error}</div>;
  }
  if (!data) {
    return <div className="flex items-center justify-center py-20 text-slate-500"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading contractor funnel…</div>;
  }

  return (
    <div className="mt-6">
      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-1">Contractor funnel — observed from records</h2>
        <p className="text-[11px] text-slate-500 mb-4">{data.basis}</p>
        <div className="space-y-2">
          {data.contractor_funnel.map((s) => {
            const Icon = STAGE_ICONS[s.stage] || Truck;
            return (
              <div key={s.stage} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-[#f4f7f5] px-4 py-3">
                <span className="w-8 h-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-[#187B65]" />
                </span>
                <span className="flex-1 min-w-[180px] text-sm font-semibold text-[#102B2A]">{s.label}</span>
                <span className="text-xl font-extrabold text-[#102B2A]">{s.current}</span>
                {s.previous !== null && s.previous !== undefined && (
                  <span className="text-xs text-slate-400">prev: {s.previous}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid md:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">Funnel rates</h3>
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(RATE_LABELS).map(([k, label]) => (
                <tr key={k} className="border-t border-slate-100 first:border-0">
                  <td className="py-2 pr-3 text-slate-600">{label}</td>
                  <td className="py-2 font-bold text-[#102B2A]">{data.rates[k] === null ? "—" : `${data.rates[k]}%`}</td>
                </tr>
              ))}
              <tr className="border-t border-slate-100">
                <td className="py-2 pr-3 text-slate-600">Avg jobs / active contractor</td>
                <td className="py-2 font-bold text-[#102B2A]">{data.rates.avg_completed_jobs_per_active_contractor ?? "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">Contractor roster (current)</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">On file</span><span className="font-bold text-[#102B2A]">{data.partners.total}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Active</span><span className="font-bold text-[#102B2A]">{data.partners.active}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Verified</span><span className="font-bold text-[#102B2A]">{data.partners.verified}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Activated (completed a job)</span><span className="font-bold text-[#187B65]">{data.partners.activated}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Repeat (both windows)</span><span className="font-bold text-[#187B65]">{data.contractor_funnel.find((s) => s.stage === "retention")?.current ?? 0}</span></div>
          </div>
          <a href="/admin/contractor-acquisition" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#187B65] hover:underline">
            Open Contractor Acquisition Intelligence
          </a>
        </div>

        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">Contractor money (verified)</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-600">Completed job value</span><span className="font-bold text-[#102B2A]">{money(data.money.completed_job_value)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Platform commission earned</span><span className="font-bold text-[#187B65]">{money(data.money.commission_earned)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Active software licenses</span><span className="font-bold text-[#102B2A]">{data.money.software_active_licenses}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Recurring software revenue / mo</span><span className="font-bold text-[#187B65]">{money(data.money.software_recurring_monthly)}</span></div>
            <div className="flex justify-between"><span className="text-slate-600">Setup fees collected</span><span className="font-bold text-[#102B2A]">{money(data.money.software_setup_collected)}</span></div>
            <div className="flex justify-between border-t border-slate-100 pt-2.5"><span className="text-slate-600">Marketing spend (recorded)</span><span className="font-bold text-amber-600">{money(data.money.marketing_expense_current)}</span></div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[11px] text-slate-500">
        Rates on small samples are low-confidence ({Object.entries(data.confidence).map(([k, v]) => k.replace(/_/g, " ") + ": " + v).join(", ")}). Marketing spend counts only expenses recorded with a "marketing" category in the books — unrecorded spend is not estimated.
      </p>
    </div>
  );
}