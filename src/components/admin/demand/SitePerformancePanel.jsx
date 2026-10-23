import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Globe, Loader2, RefreshCw } from "lucide-react";

const fmt = (n) => Number(n || 0).toLocaleString("en-CA");

// Google Search Console — Same Day Recycling's ACTUAL measured website
// performance, shown separately from (and never merged into) the industry
// demand-estimate layer above.
export default function SitePerformancePanel() {
  const [mode, setMode] = useState("query"); // query | page
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (m = mode) => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("searchConsoleKeywords", m === "page" ? { dimension: "page" } : {});
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Search Console request failed.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(mode); }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo(() => (data?.keywords || data?.pages || []), [data]);
  const totals = useMemo(() => {
    if (!rows.length) return null;
    const clicks = rows.reduce((a, r) => a + (r.clicks || 0), 0);
    const impressions = rows.reduce((a, r) => a + (r.impressions || 0), 0);
    const weightedPos = rows.reduce((a, r) => a + (r.position || 0) * (r.impressions || 1), 0) / (impressions || 1);
    return {
      clicks,
      impressions,
      ctr: impressions ? Math.round((clicks / impressions) * 1000) / 10 : 0,
      position: Math.round(weightedPos * 10) / 10,
      rows: rows.length,
    };
  }, [rows]);

  return (
    <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-5">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-[#187B65]" /> Actual website performance — samedayrecycling.ca
        </div>
        <span className="rounded-full bg-[#102B2A] text-white px-2.5 py-0.5 text-[10px] font-bold uppercase">Measured data</span>
        <div className="ml-auto flex gap-1 rounded-full bg-[#f6f9f8] p-1">
          {[["query", "By search query"], ["page", "By landing page"]].map(([m, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${mode === m ? "bg-[#102B2A] text-white" : "text-slate-500 hover:text-[#102B2A]"}`}
            >
              {label}
            </button>
          ))}
          <button onClick={() => load(mode)} aria-label="Refresh" className="px-2 text-slate-400 hover:text-[#187B65]">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Google Search Console impressions, clicks and queries for this site only — real measured performance, kept
        separate from industry-wide demand estimates and never used as a demand proxy. Reporting lags ~2 days.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#187B65]" /> Loading Search Console data…
        </div>
      ) : error ? (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Search Console unavailable: {error}</span>
        </div>
      ) : !totals ? (
        <div className="rounded-xl bg-[#f6f9f8] border border-dashed border-slate-200 p-4 text-sm text-slate-500 text-center">
          No Search Console rows for this window yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              ["Clicks", fmt(totals.clicks)],
              ["Impressions", fmt(totals.impressions)],
              ["CTR", `${totals.ctr}%`],
              ["Avg. position", totals.position],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-[#f6f9f8] border border-slate-100 p-3 text-center">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</div>
                <div className="text-xl font-extrabold text-[#102B2A] tabular-nums">{value}</div>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-slate-400 mb-2">
            Window {data?.startDate} – {data?.endDate} · top {Math.min(rows.length, 10)} of {fmt(totals.rows)} rows
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm bg-white">
              <thead className="bg-[#f6f9f8] text-left">
                <tr>
                  <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">{mode === "query" ? "Query" : "Landing page"}</th>
                  <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Clicks</th>
                  <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Impressions</th>
                  <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">CTR</th>
                  <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Position</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 font-semibold text-[#102B2A] max-w-[320px] truncate" title={r.query || r.page}>{r.query || r.page}</td>
                    <td className="px-3 py-2 tabular-nums text-slate-600">{fmt(r.clicks)}</td>
                    <td className="px-3 py-2 tabular-nums text-slate-600">{fmt(r.impressions)}</td>
                    <td className="px-3 py-2 tabular-nums text-slate-600">{r.ctr}%</td>
                    <td className="px-3 py-2 tabular-nums text-slate-600">{r.position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}