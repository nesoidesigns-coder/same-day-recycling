import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, FileSignature, RefreshCw } from "lucide-react";
import RevenueKpis from "@/components/admin/revenue/RevenueKpis";
import RevenueCharts from "@/components/admin/revenue/RevenueCharts";
import OperatorEconomics from "@/components/admin/revenue/OperatorEconomics";
import SalesExpansion from "@/components/admin/revenue/SalesExpansion";

const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-CA");
const pct = (v) => `${Number(v) || 0}%`;

const TABS = [
  { key: "overview", label: "Revenue Overview" },
  { key: "operators", label: "Operator Economics" },
  { key: "expansion", label: "Sales Expansion" },
];

export default function AdminRevenue() {
  const [rev, setRev] = useState(null);
  const [fin, setFin] = useState(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, f] = await Promise.all([
        base44.functions.invoke("revenueIntelligence", {}),
        base44.functions.invoke("jobFinancials", { action: "network" }),
      ]);
      setRev(r.data);
      setFin(f.data);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (failed) {
    return <p className="rounded-2xl bg-red-50 text-red-700 p-6 font-semibold">Could not load revenue data. Refresh and try again.</p>;
  }
  if (!rev || !fin) return <Loader2 className="w-8 h-8 text-[#187B65] animate-spin mx-auto my-20" />;

  const o = fin.overview;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#102B2A] tracking-tight">Revenue Intelligence</h1>
          <p className="text-sm text-slate-500 mt-1">Gross transaction volume is kept separate from revenue earned. Test bookings and cancelled jobs are excluded.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading} className="p-2.5 rounded-full bg-white border border-slate-200 hover:border-[#187B65] transition-colors" aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 text-[#102B2A] ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link to="/admin/agreements" className="flex items-center gap-2 rounded-full bg-[#102B2A] text-white font-bold px-5 py-2.5 text-sm hover:bg-[#0a3020]">
            <FileSignature className="w-4 h-4" /> Contractor agreements
          </Link>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition-colors ${tab === tb.key ? "bg-[#102B2A] text-white" : "bg-white border border-slate-200 text-slate-600 hover:text-[#102B2A]"}`}>
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <RevenueKpis data={rev} />
          <RevenueCharts data={rev} />
          {o && (
            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500">Job economics snapshot — completed jobs from the financial ledger</h2>
              <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Snap label="Gross customer sales" value={money(o.gross_sales)} note="Approved prices + additions, before tax" />
                <Snap label="Platform commission" value={money(o.platform_commission)} note="Net contribution after fees" />
                <Snap label="Contractor payouts" value={money(o.contractor_payouts)} note={`${o.jobs} completed jobs`} />
                <Snap label="Avg contribution / job" value={money(o.avg_contribution)} note={`${pct(o.contribution_margin_pct)} margin`} />
                <Snap label="Sales tax collected" value={money(o.taxes_total)} note="Recorded separately — never revenue" />
                <Snap label="From customer additions" value={money(o.additional_revenue_total)} note={`${o.jobs_with_additions} jobs had additions`} />
                <Snap label="Unverified records" value={String(o.unverified_jobs)} note="Missing expenses — not verified profit" tone={o.unverified_jobs ? "text-amber-600" : undefined} />
                <Snap label="Ledger freshness" value={fin.generated_at ? new Date(fin.generated_at).toLocaleDateString("en-CA", { dateStyle: "medium" }) : "—"} note="Synced automatically as jobs complete" />
              </div>
            </div>
          )}
        </>
      )}

      {tab === "operators" && <OperatorEconomics fin={fin} onChanged={load} />}
      {tab === "expansion" && <SalesExpansion fin={fin} />}
    </div>
  );
}

function Snap({ label, value, note, tone = "text-[#102B2A]" }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`mt-1 text-xl font-extrabold tabular-nums ${tone}`}>{value}</div>
      <div className="mt-0.5 text-[11px] text-slate-500">{note}</div>
    </div>
  );
}