import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, FileSignature } from "lucide-react";
import RevenueKpis from "@/components/admin/revenue/RevenueKpis";
import RevenueCharts from "@/components/admin/revenue/RevenueCharts";

export default function AdminRevenue() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    base44.functions.invoke("revenueIntelligence", {})
      .then((r) => setData(r.data))
      .catch(() => setFailed(true));
  }, []);

  if (failed) {
    return <p className="rounded-2xl bg-red-50 text-red-700 p-6 font-semibold">Could not load revenue data. Refresh and try again.</p>;
  }
  if (!data) return <Loader2 className="w-8 h-8 text-[#187B65] animate-spin mx-auto my-20" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#102B2A] tracking-tight">Revenue Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">Gross transaction volume is kept separate from revenue earned. Test bookings and cancelled jobs are excluded.</p>
        </div>
        <Link to="/admin/agreements" className="flex items-center gap-2 rounded-full bg-[#102B2A] text-white font-bold px-5 py-2.5 text-sm hover:bg-[#0a3020]">
          <FileSignature className="w-4 h-4" /> Contractor agreements
        </Link>
      </div>
      <RevenueKpis data={data} />
      <RevenueCharts data={data} />
    </div>
  );
}