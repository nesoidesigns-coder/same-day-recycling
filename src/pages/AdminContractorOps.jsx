import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Users, FileSignature, ClipboardList, Handshake, Wallet } from "lucide-react";
import { base44 } from "@/api/base44Client";

const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-CA");
const rowsOf = (agg) => (agg?.rows || []).filter((r) => (r.count || 0) > 0);
const get = (rows, key) => (rows.find((r) => r._id === key) || {}).count || 0;

// Contractor Operations: the provider side of the network — partners,
// agreements, dispatch offers and partner job economics.
export default function AdminContractorOps() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [partnersTotal, partnersVerified, partnersActive, agreementsAgg, membershipAgg, tasksAgg, offersAgg, assignAgg, commissionAgg, appsAgg] = await Promise.all([
        base44.entities.Partner.count({}),
        base44.entities.Partner.count({ verified: true }),
        base44.entities.Partner.count({ active: true }),
        base44.entities.ContractorAgreement.aggregate({ query: {}, groupBy: "status" }),
        base44.entities.ContractorAgreement.aggregate({ query: { status: "active" }, groupBy: "fee_model", sum: ["membership_fee_monthly"] }),
        base44.entities.DispatchTask.aggregate({ query: {}, groupBy: "status" }),
        base44.entities.LeadOffer.aggregate({ query: {}, groupBy: "status" }),
        base44.entities.Booking.aggregate({ query: { partner_id: { $nin: [null, ""] } }, groupBy: "assignment_status" }),
        base44.entities.Booking.aggregate({ query: { partner_id: { $nin: [null, ""] } }, groupBy: "payment_status", sum: ["commission_earned"] }),
        base44.entities.ContractorApplication.aggregate({ query: {}, groupBy: "status" }),
      ]);
      setData({
        partners: { total: partnersTotal, verified: partnersVerified, active: partnersActive },
        agreements: rowsOf(agreementsAgg),
        membershipMonthly: (membershipAgg?.rows || []).reduce((s, r) => s + (r.sum_membership_fee_monthly || 0), 0),
        tasks: rowsOf(tasksAgg),
        offers: rowsOf(offersAgg),
        assignments: rowsOf(assignAgg),
        commissions: commissionAgg?.rows || [],
        applications: rowsOf(appsAgg),
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const commissionTotal = (data?.commissions || []).reduce((s, r) => s + (r.sum_commission_earned || 0), 0);
  const partnerJobs = (data?.assignments || []).reduce((s, r) => s + (r.count || 0), 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#102B2A]">Contractor Operations</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            The provider side of the network: verified partners, agreements, dispatch offers and the job economics
            behind contractor payouts.
          </p>
        </div>
        <button onClick={load} disabled={loading} className="p-2.5 rounded-full bg-white border border-slate-200 hover:border-[#187B65] transition-colors" aria-label="Refresh">
          <RefreshCw className={`w-4 h-4 text-[#102B2A] ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading contractor operations…
        </div>
      ) : error ? (
        <div className="mt-8 rounded-2xl bg-white border border-red-200 px-5 py-4 text-sm text-red-700">{error}</div>
      ) : data ? (
        <>
          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Kpi icon={Users} label="Verified partners" value={data.partners.verified} sub={`${data.partners.total} total · ${data.partners.active} active`} />
            <Kpi icon={Handshake} label="Partner jobs" value={partnerJobs} sub="Jobs assigned to a partner" />
            <Kpi icon={Wallet} label="Commission earned" value={money(commissionTotal)} sub="Across all partner jobs" />
            <Kpi icon={FileSignature} label="Membership revenue" value={money(data.membershipMonthly)} sub="Active monthly membership fees" />
          </div>

          <div className="mt-5 grid md:grid-cols-2 gap-5">
            <GroupCard icon={FileSignature} title="Agreements by status" rows={data.agreements} labels={{ active: "Active", draft: "Draft", pending_contractor_acceptance: "Awaiting contractor", ended: "Ended" }} empty="No agreements yet." />
            <GroupCard icon={ClipboardList} title="Dispatch tasks by status" rows={data.tasks} empty="No dispatch tasks yet." />
            <GroupCard icon={Handshake} title="Lead offers by status" rows={data.offers} empty="No lead offers yet." />
            <GroupCard icon={Users} title="Partner jobs by assignment state" rows={data.assignments} empty="No partner-assigned jobs yet." />
            <GroupCard icon={Users} title="Contractor applications" rows={data.applications} empty="No applications yet." />
            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">Commission by payment state</h2>
              {(data.commissions.length === 0) ? (
                <p className="text-sm text-slate-500">No partner commissions recorded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {data.commissions.map((r) => (
                    <li key={r._id || "none"} className="flex items-center justify-between text-sm border-t border-slate-100 py-2 first:border-0">
                      <span className="font-semibold text-[#102B2A] capitalize">{r._id || "unpaid"}</span>
                      <span className="font-bold text-[#187B65]">{money(r.sum_commission_earned || 0)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-[11px] text-slate-500">
                Earned but unpaid commissions are owed to partners on completed jobs — reconcile in Payouts.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#eef4f0] border border-[#187B65]/20 px-5 py-4 text-xs text-[#102B2A] leading-relaxed">
            Counts come straight from live records — internal test records are excluded from customer-facing funnels but
            partner network state here reflects everything in the database, including test fixtures.
          </div>
        </>
      ) : null}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-4">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <Icon className="w-3.5 h-3.5 text-[#187B65]" /> {label}
      </div>
      <div className="mt-1 text-2xl font-extrabold text-[#102B2A]">{value}</div>
      <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>
    </div>
  );
}

function GroupCard({ icon: Icon, title, rows, labels = {}, empty }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
      <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4 inline-flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#187B65]" /> {title}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r._id || "none"} className="flex items-center justify-between text-sm border-t border-slate-100 py-2 first:border-0">
              <span className="font-semibold text-[#102B2A]">{labels[r._id] || (r._id || "Unspecified")}</span>
              <span className="font-bold text-[#187B65]">{r.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}