import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import KpiCard from "@/components/admin/KpiCard";
import { CityTable, GapTable, ContractorTable } from "@/components/admin/sales/SalesTables";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-CA", { minimumFractionDigits: 2 });

export default function AdminSalesIntelligence() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    base44.functions.invoke("salesIntelligence", {})
      .then((r) => (r.data?.error ? setFailed(true) : setData(r.data)))
      .catch(() => setFailed(true));
  }, []);

  if (failed) return <p className="rounded-2xl bg-red-50 text-red-700 p-6 font-semibold">Could not load sales intelligence. Refresh and try again.</p>;
  if (!data) return <Loader2 className="w-8 h-8 text-[#187B65] animate-spin mx-auto my-20" />;

  const totalInquiries = data.inquiries_by_city.reduce((s, r) => s + r.count, 0);
  const completed = data.contractors.reduce((s, c) => s + c.completed, 0);
  const gross = data.contractors.reduce((s, c) => s + c.gross_job_value, 0);
  const gaps = data.territory_gaps.filter((g) => !g.has_verified_contractor).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#102B2A] tracking-tight">Sales Intelligence</h1>
        <p className="text-sm text-slate-500 mt-1">Computed from live records only. Test bookings are excluded. Empty sections mean no data exists yet.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <KpiCard label="Service inquiries" value={totalInquiries} sub="National requests received" />
        <KpiCard label="Qualified leads" value={data.qualified_leads.total_quote_leads} sub="Quote leads captured with contact details" />
        <KpiCard label="Completed jobs" value={completed} sub={`Gross value ${money(gross)}`} tone="emerald" />
        <KpiCard label="Cities with a supply gap" value={gaps} sub="Open inquiries, no verified contractor" tone="amber" />
        <KpiCard label="Referral revenue" value={money(data.referral_revenue)} sub="Platform fees and commissions earned" tone="emerald" />
        <KpiCard label="Network membership MRR" value={money(data.subscription_revenue.network_membership_mrr)} sub={`${data.subscription_revenue.active_agreements} active agreement(s)`} />
        <KpiCard label="Software license MRR" value={money(data.subscription_revenue.software_license_mrr)} sub="Active software licenses" />
        <KpiCard label="Combined subscription MRR" value={money(data.subscription_revenue.combined_mrr)} sub="Reported separately from job revenue" tone="emerald" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <CityTable title="Inquiries by city" rows={data.inquiries_by_city} />
        <CityTable title="Qualified quote leads by city" rows={data.qualified_leads.quote_leads_by_city} />
      </div>

      <GapTable rows={data.territory_gaps} />
      <ContractorTable rows={data.contractors} />
    </div>
  );
}