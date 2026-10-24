import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Radio, Truck, Users, PackageCheck, CheckCircle2, CircleDollarSign, Wallet,
  ShieldCheck, AlertTriangle, Info, Loader2, RefreshCw, XCircle, Filter, Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import DispatchMap from "@/components/admin/DispatchMap";
import JobDrawer from "@/components/ops/JobDrawer";
import { labelFor } from "@/lib/opsShared";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-CA");

// National Operations Command Center: one live view of every service request
// across Canada — from inquiry to receipt — with verified figures only.
export default function AdminOps() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["opsCommand"],
    queryFn: async () => (await base44.functions.invoke("jobTracking", { action: "ops" })).data,
    refetchInterval: 60000,
  });
  const [filters, setFilters] = useState({ province: "all", city: "all", contractor: "all", days: "30" });
  const [selected, setSelected] = useState(null);
  // Search opportunities from the SEO Action Engine (verified GSC + pending Rex recommendations).
  const seoSummary = useQuery({
    queryKey: ["opsSeoSummary"],
    queryFn: async () => (await base44.functions.invoke("seoActionEngine", { action: "summary" })).data,
    refetchInterval: 120000,
  });

  const bookings = data?.bookings || [];
  const cities = useMemo(() => [...new Set(bookings.map((b) => b.city).filter(Boolean))].sort(), [bookings]);
  const contractors = useMemo(() => [...new Set(bookings.map((b) => b.partner_name).filter(Boolean))].sort(), [bookings]);
  const provinces = useMemo(() => [...new Set(bookings.map((b) => b.province_code).filter(Boolean))].sort(), [bookings]);

  const filtered = useMemo(() => {
    const cutoff = filters.days === "all" ? 0 : Date.now() - Number(filters.days) * 86400000;
    return bookings.filter((b) =>
      (filters.province === "all" || (b.province_code || "") === filters.province) &&
      (filters.city === "all" || (b.city || "") === filters.city) &&
      (filters.contractor === "all" || (b.partner_name || "") === filters.contractor) &&
      (!cutoff || new Date(b.created_date).getTime() >= cutoff));
  }, [bookings, filters]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-24 text-slate-500"><Loader2 className="w-6 h-6 animate-spin text-[#187B65]" /> Loading live operations…</div>;
  }
  if (isError) {
    return <p className="text-sm text-red-600 flex items-center gap-2" role="alert"><XCircle className="w-4 h-4" /> Operations data could not be loaded.</p>;
  }

  const g = data.gauges || {};
  const gaugeCards = [
    { icon: Truck, label: "Active jobs", value: g.active_jobs, tone: "text-[#102B2A]" },
    { icon: Radio, label: "Awaiting contractor", value: g.awaiting_acceptance, tone: "text-amber-600" },
    { icon: PackageCheck, label: "In progress", value: g.in_progress, tone: "text-[#187B65]" },
    { icon: CheckCircle2, label: "Completed jobs", value: g.completed_total, tone: "text-[#187B65]" },
    { icon: CircleDollarSign, label: "Revenue collected", value: money(g.revenue_collected), sub: `${g.revenue_collected_jobs || 0} paid jobs · verified`, tone: "text-[#102B2A]" },
    { icon: Wallet, label: "Pending payouts (net)", value: money(g.pending_payouts_net), tone: "text-amber-600" },
    { icon: Users, label: "Contractors available", value: g.contractors_available, tone: "text-[#102B2A]" },
    { icon: Radio, label: "Open dispatch requests", value: g.open_dispatch_requests, tone: "text-amber-600" },
    { icon: ShieldCheck, label: "Custody records", value: `${g.custody_verified || 0} verified`, sub: `${g.custody_reported || 0} reported · ${g.missing_custody || 0} missing`, tone: "text-[#102B2A]" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#102B2A] flex items-center gap-2"><Radio className="w-6 h-6 text-[#187B65]" /> Live Operations</h1>
          <p className="mt-1 text-sm text-slate-600">National job tracking from inquiry to receipt. Every figure comes from live records — verified revenue, net payouts, custody documentation. Updates every 60 seconds.</p>
        </div>
        <button onClick={() => refetch()} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:border-[#187B65] hover:text-[#187B65] transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {gaugeCards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <c.icon className={`w-4 h-4 ${c.tone}`} />
            <p className="mt-2 text-xl font-bold text-[#102B2A] tabular-nums leading-tight">{c.value ?? "—"}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mt-1">{c.label}</p>
            {c.sub && <p className="text-[10px] text-slate-400 mt-0.5">{c.sub}</p>}
          </div>
        ))}
      </div>

      {/* Problems needing attention */}
      {(data.problems || []).length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-bold text-amber-900 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Needs attention</h2>
          <ul className="mt-2 space-y-1.5">
            {data.problems.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-amber-900">
                <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${p.severity === "warning" ? "bg-amber-200 text-amber-900" : "bg-slate-200 text-slate-700"}`}>{p.severity}</span>
                <span><span className="font-bold">{p.title}:</span> {p.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Search opportunities — SEO Action Engine */}
      {seoSummary.data && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><Search className="w-4 h-4 text-[#187B65]" /> Search opportunities</h2>
            <Link to="/admin/seo-action" className="text-[11px] font-bold text-[#187B65] hover:underline">Open SEO Action Engine →</Link>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Verified Search Console performance per tracked page, plus Rex improvement suggestions awaiting approval.</p>
          <div className="mt-3 grid sm:grid-cols-2 gap-2">
            {(seoSummary.data.pages || []).map((p) => (
              <div key={p.path} className="rounded-xl bg-[#f4f7f5] px-3 py-2">
                <p className="text-xs font-bold text-[#102B2A]">{p.label}</p>
                {p.latest ? (
                  <p className="text-[11px] text-slate-600 tabular-nums">{p.latest.clicks} clicks · {p.latest.impressions} impressions · pos {p.latest.avg_position || "—"} ({p.latest.snapshot_date})</p>
                ) : (
                  <p className="text-[11px] text-slate-400">No snapshot yet</p>
                )}
              </div>
            ))}
          </div>
          {seoSummary.data.pending_count > 0 && (
            <p className="mt-3 text-[11px] font-bold text-amber-800">{seoSummary.data.pending_count} SEO recommendation(s) awaiting your approval in the SEO Action Engine.</p>
          )}
        </div>
      )}

      {/* Map */}
      <DispatchMap bookings={filtered} height={300} />

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-wrap gap-2 items-center">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500"><Filter className="w-3.5 h-3.5" /> Filter</span>
        <select value={filters.province} onChange={(e) => setFilters((f) => ({ ...f, province: e.target.value }))} className="input py-2 text-xs max-w-[130px]">
          <option value="all">All provinces</option>
          {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filters.city} onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))} className="input py-2 text-xs max-w-[150px]">
          <option value="all">All cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.contractor} onChange={(e) => setFilters((f) => ({ ...f, contractor: e.target.value }))} className="input py-2 text-xs max-w-[170px]">
          <option value="all">All contractors</option>
          {contractors.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.days} onChange={(e) => setFilters((f) => ({ ...f, days: e.target.value }))} className="input py-2 text-xs max-w-[140px]">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="all">All time</option>
        </select>
        <span className="ml-auto text-xs font-bold text-slate-500">{filtered.length} jobs</span>
      </div>

      {/* Jobs table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f4f7f5] text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="text-left px-4 py-3">Ref</th>
              <th className="text-left px-4 py-3">Customer</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Location</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Contractor</th>
              <th className="text-left px-4 py-3">Stage</th>
              <th className="text-right px-4 py-3">Value</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">Payment</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} onClick={() => setSelected(b)} className="border-t border-slate-100 cursor-pointer hover:bg-[#f4f7f5] transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-bold text-[#102B2A]">{b.reference_code || "—"}</td>
                <td className="px-4 py-3 font-semibold text-[#102B2A] max-w-[160px] truncate">{b.name}</td>
                <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{b.city || "—"}{b.province_code ? `, ${b.province_code}` : ""}</td>
                <td className="px-4 py-3 text-slate-600 hidden lg:table-cell max-w-[150px] truncate">{b.partner_name || "Unassigned"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${b.is_delayed ? "bg-amber-100 text-amber-800" : b.status === "completed" ? "bg-[#187B65]/10 text-[#187B65]" : "bg-slate-100 text-slate-600"}`}>
                    {b.is_delayed ? "Delayed" : b.current_stage ? labelFor(b.current_stage) : b.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-700">{money(b.final_invoice || b.job_value)}</td>
                <td className="px-4 py-3 text-xs text-slate-600 hidden sm:table-cell">{b.payment_status === "none" ? "—" : b.payment_status.replace("_", " ")}</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">No jobs match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Recent exceptions */}
      {(data.exceptions || []).length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><Info className="w-4 h-4 text-[#187B65]" /> Recent exceptions</h2>
          <ul className="mt-3 space-y-2">
            {data.exceptions.map((e) => (
              <li key={e.id} className="flex flex-wrap items-baseline gap-2 text-xs">
                <span className="rounded-full bg-red-50 px-2 py-0.5 font-bold text-red-700">{labelFor(e.stage)}</span>
                <span className="font-mono font-bold text-[#102B2A]">{e.reference_code || "—"}</span>
                <span className="text-slate-600">{e.note || e.title}</span>
                <span className="text-slate-400">{e.occurred_at ? new Date(e.occurred_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : ""} · {e.actor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected && (
        <JobDrawer
          booking={selected}
          onClose={() => setSelected(null)}
          onChanged={() => refetch()}
        />
      )}
    </div>
  );
}