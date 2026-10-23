import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Database, Globe2, Info, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/demandShared";
import DashboardFilters from "./DashboardFilters";
import SitePerformancePanel from "./SitePerformancePanel";
import RexRecommendPanel from "./RexRecommendPanel";

const fmt = (n) => Number(n || 0).toLocaleString("en-CA");

const prevPeriod = (p) => {
  const [y, m] = String(p || "").split("-").map(Number);
  if (!y || !m) return "";
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

// Geography scope: aggregate one level (the selected one, or the highest
// level with data for All Canada) so the same keyword is never counted
// twice across national, provincial and city rows.
function scopeRows(rows, province, city) {
  if (city) {
    return rows.filter((r) => r.geo_type === "city" && String(r.city || "").toLowerCase() === city.toLowerCase());
  }
  if (province) {
    const code = province.toLowerCase();
    const prov = rows.filter((r) => r.geo_type === "province" && String(r.province_code || "").toLowerCase() === code);
    if (prov.length) return prov;
    return rows.filter((r) => r.geo_type === "city" && String(r.province_code || "").toLowerCase() === code);
  }
  const nat = rows.filter((r) => r.geo_type === "national");
  if (nat.length) return nat;
  const prov = rows.filter((r) => r.geo_type === "province");
  if (prov.length) return prov;
  return rows.filter((r) => r.geo_type === "city");
}

const LEVEL_NOTE = {
  national: "National-level estimates",
  province: "Provincial-level estimates",
  city: "City-level estimates",
};

const DEFAULT_FILTERS = { province: "", city: "", category: "all", periodFrom: "", periodTo: "" };

// Canadian Service Demand Intelligence Dashboard — one dedicated view that
// combines the three clearly-separated layers:
//   1. Industry demand estimates (Keyword Planner / source-labeled imports)
//   2. Actual website performance (Search Console — samedayrecycling.ca)
//   3. Rex AI interpretation (always labeled as AI estimates)
export default function DemandDashboardTab({ report, loading, onOpenInsights, onOpenImport }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const rows = useMemo(() => report?.series || [], [report]);

  const provinces = useMemo(
    () => [...new Set(rows.filter((r) => r.geo_type === "province" && r.province_code).map((r) => r.province_code))],
    [rows]
  );
  const cities = useMemo(() => {
    const seen = new Map();
    for (const r of rows.filter((r) => r.geo_type === "city" && r.city)) {
      if (!seen.has(r.city)) seen.set(r.city, { key: r.city, province_code: r.province_code || "" });
    }
    return [...seen.values()]
      .filter((c) => !filters.province || String(c.province_code).toLowerCase() === filters.province.toLowerCase())
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [rows, filters.province]);
  const periods = useMemo(() => [...new Set(rows.map((r) => r.period).filter(Boolean))].sort(), [rows]);

  // Apply all filters, then aggregate the scoped geography level.
  const view = useMemo(() => {
    const scoped = scopeRows(rows, filters.province, filters.city);
    const level = scoped[0]?.geo_type || null;
    let out = scoped;
    if (filters.category !== "all") out = out.filter((r) => r.service_category === filters.category);
    if (filters.periodFrom) out = out.filter((r) => (r.period || "") >= filters.periodFrom);
    if (filters.periodTo) out = out.filter((r) => (r.period || "") <= filters.periodTo);

    const ps = [...new Set(out.map((r) => r.period).filter(Boolean))].sort();
    const latest = ps[ps.length - 1] || "";
    const prev = prevPeriod(latest);
    const inLatest = out.filter((r) => r.period === latest);
    const inPrev = out.filter((r) => r.period === prev);

    const sumVol = (list) => list.reduce((a, r) => a + (Number(r.est_monthly_volume) || 0), 0);
    const latestVol = sumVol(inLatest);
    const prevVol = sumVol(inPrev);
    const indexOnly = inLatest.filter((r) => !(Number(r.est_monthly_volume) || 0) && (Number(r.trend_index) || 0) > 0);

    const monthly = ps.map((p) => ({ period: p, volume: sumVol(out.filter((r) => r.period === p)) }));

    const catSet = [...new Set([...inLatest, ...inPrev].map((r) => r.service_category))];
    const categories = catSet
      .map((cat) => ({
        category: cat,
        label: CATEGORY_LABELS[cat] || cat,
        latest: sumVol(inLatest.filter((r) => r.service_category === cat)),
        previous: sumVol(inPrev.filter((r) => r.service_category === cat)),
      }))
      .sort((a, b) => b.latest - a.latest || b.previous - a.previous)
      .slice(0, 8);

    const geoLabel = (r) =>
      r.geo_type === "national" ? "Canada" : r.geo_type === "province" ? r.province_code : r.city;
    const geoMap = new Map();
    for (const r of inLatest) {
      const label = geoLabel(r);
      const e = geoMap.get(label) || { geo: label, volume: 0, keywords: 0 };
      e.volume += Number(r.est_monthly_volume) || 0;
      e.keywords += 1;
      geoMap.set(label, e);
    }
    const geographies = [...geoMap.values()].sort((a, b) => b.volume - a.volume).slice(0, 12);

    const topKeywords = [...inLatest]
      .sort((a, b) => (b.est_monthly_volume || 0) - (a.est_monthly_volume || 0) || (b.trend_index || 0) - (a.trend_index || 0))
      .slice(0, 15);

    const lastUpdated = out.map((r) => String(r.last_updated || "")).sort().pop() || "";

    return {
      level, latest, prev, latestVol, prevVol, indexOnly, monthly, categories, geographies, topKeywords, lastUpdated,
      count: out.length,
      growthPct: prevVol ? Math.round(((latestVol - prevVol) / prevVol) * 1000) / 10 : null,
    };
  }, [rows, filters]);

  const lastUpdatedLabel = view.lastUpdated
    ? new Date(view.lastUpdated + "T00:00:00").toLocaleDateString("en-CA", { dateStyle: "medium" })
    : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#187B65]" /> Assembling the demand dashboard…
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded-2xl bg-[#f6f9f8] border border-slate-100 p-8 text-center text-sm text-slate-500">
        <Globe2 className="w-8 h-8 text-[#187B65] mx-auto mb-2" />
        The demand report is temporarily unavailable. Try again from the tab menu.
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="rounded-2xl bg-[#f6f9f8] border border-dashed border-[#187B65]/30 p-8 text-center">
        <Database className="w-8 h-8 text-[#187B65] mx-auto mb-2" />
        <p className="text-sm font-bold text-[#102B2A]">No demand observations on file yet</p>
        <p className="text-sm text-slate-500 mt-1 max-w-xl mx-auto">
          Industry search-demand figures appear once real data lands: either the Keyword Planner connection is
          completed (Source Health tab) or a verified volume export is imported (Import tab). Simulated numbers are
          never displayed as real search activity.
        </p>
        <div className="flex justify-center gap-3 mt-4">
          {onOpenImport && (
            <button onClick={onOpenImport} className="rounded-full bg-[#187B65] px-5 py-2 text-sm font-bold text-white hover:bg-[#125C4E]">
              Open Import tab
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-extrabold text-[#102B2A] text-lg">Canadian Service Demand Intelligence</h2>
          <p className="text-sm text-slate-500">
            Estimated search demand for removal and recycling services across Canada — by service, city, province and
            country — with Same Day Recycling's actual site performance kept strictly separate.
          </p>
        </div>
        {report.series_truncated && (
          <span className="rounded-full bg-amber-100 text-amber-900 px-3 py-1 text-[10px] font-bold uppercase">
            Showing the newest 800 of more observations
          </span>
        )}
      </div>

      <DashboardFilters
        provinces={provinces}
        cities={cities}
        periods={periods}
        filters={filters}
        setFilters={setFilters}
      />

      {/* Scope basis note */}
      <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-slate-500">
        <Info className="w-3.5 h-3.5 text-[#187B65]" />
        <span>
          {filters.city
            ? `${filters.city} — city-level estimates`
            : filters.province
              ? `${filters.province} — ${view.level === "province" ? "provincial-level" : "aggregated from city-level"} estimates`
              : "All Canada — highest available geography level to avoid double-counting"}
          {view.latest ? ` · reporting period ${view.latest}` : " · no period in range"}
          {view.indexOnly.length > 0 && ` · ${view.indexOnly.length} relative-interest observation${view.indexOnly.length === 1 ? "" : "s"} never summed into totals`}
        </span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="rounded-2xl bg-white border border-slate-100 p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Est. monthly searches</div>
          <div className="text-2xl font-extrabold text-[#102B2A] tabular-nums">{fmt(view.latestVol)}</div>
          <div className="text-[10px] text-slate-400 mt-1">
            Estimate, not exact count · {view.latest || "—"}
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">vs prior period</div>
          {view.growthPct === null ? (
            <div className="text-2xl font-extrabold text-slate-300">—</div>
          ) : (
            <div className={`text-2xl font-extrabold tabular-nums flex items-center gap-1.5 ${view.growthPct >= 0 ? "text-[#187B65]" : "text-amber-600"}`}>
              {view.growthPct >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {view.growthPct >= 0 ? "+" : ""}{view.growthPct}%
            </div>
          )}
          <div className="text-[10px] text-slate-400 mt-1">Prior period {view.prev || "—"}</div>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Keyword observations</div>
          <div className="text-2xl font-extrabold text-[#102B2A] tabular-nums">{fmt(view.count)}</div>
          <div className="text-[10px] text-slate-400 mt-1">Deduplicated rows in the current filter</div>
        </div>
        <div className="rounded-2xl bg-white border border-slate-100 p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Data basis</div>
          <div className="text-sm font-bold text-[#102B2A] leading-snug mt-1">
            {(report.industry?.volume_basis || []).join(" · ") || "Source-labeled observations"}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Last updated: {lastUpdatedLabel}</div>
        </div>
      </div>

      {/* Historical trend */}
      <div className="rounded-2xl bg-white border border-slate-100 p-5 mb-6">
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">Historical demand trend — estimated monthly searches by period</div>
        {view.monthly.length < 2 ? (
          <p className="text-sm text-slate-500">Only one period on file for this filter — historical trends appear as more monthly observations accumulate.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={view.monthly} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f0" />
                <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} width={56} tickFormatter={(v) => fmt(v)} />
                <Tooltip formatter={(v) => [fmt(v), "Est. searches"]} labelStyle={{ fontWeight: 700 }} />
                <Line type="monotone" dataKey="volume" stroke="#187B65" strokeWidth={2.5} dot={{ r: 3, fill: "#187B65" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Category comparison + geography table */}
      <div className="grid lg:grid-cols-2 gap-4 mb-2">
        <div className="rounded-2xl bg-white border border-slate-100 p-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">Demand comparison by service — latest vs prior period</div>
          {view.categories.length === 0 ? (
            <p className="text-sm text-slate-500">No category volumes in this filter range.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={view.categories} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#64748b" }} interval={0} angle={-18} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} width={56} tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v) => fmt(v)} labelStyle={{ fontWeight: 700 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="latest" name={view.latest || "Latest"} fill="#187B65" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="previous" name={view.prev || "Prior"} fill="#A7F3D0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white border border-slate-100 p-5">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">Demand by geography — {view.latest || "latest period"}</div>
          {view.geographies.length === 0 ? (
            <p className="text-sm text-slate-500">No geographies in this filter range.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-sm bg-white">
                <thead className="bg-[#f6f9f8] text-left">
                  <tr>
                    <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Geography</th>
                    <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Est. monthly</th>
                    <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Keywords</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {view.geographies.map((g) => (
                    <tr key={g.geo}>
                      <td className="px-3 py-2 font-semibold text-[#102B2A]">{g.geo}</td>
                      <td className="px-3 py-2 tabular-nums text-slate-600">{fmt(g.volume)}</td>
                      <td className="px-3 py-2 tabular-nums text-slate-600">{g.keywords}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Top keywords */}
      <div className="mt-6">
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-2">Top keywords on file — {view.latest || "—"}</div>
        {view.topKeywords.length === 0 ? (
          <p className="text-sm text-slate-500">No keywords for this filter.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-sm bg-white">
              <thead className="bg-[#f6f9f8] text-left">
                <tr>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Keyword</th>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Service</th>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Geography</th>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Est. monthly / index</th>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Trend</th>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Competition</th>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Source</th>
                  <th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {view.topKeywords.map((k, i) => (
                  <tr key={`${k.keyword}-${k.geo_key}-${i}`}>
                    <td className="px-3 py-2.5 font-semibold text-[#102B2A] max-w-[220px] truncate" title={k.keyword}>{k.keyword}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">{CATEGORY_LABELS[k.service_category] || k.service_category}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">{k.geo_type === "national" ? "Canada" : k.geo_type === "province" ? k.province_code : k.city}</td>
                    <td className="px-3 py-2.5 font-bold text-[#102B2A] tabular-nums">
                      {Number(k.est_monthly_volume) > 0 ? fmt(k.est_monthly_volume) : k.trend_index ? `index ${k.trend_index}` : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 capitalize">{k.trend_direction || "unknown"}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 capitalize">{k.competition || "unknown"}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-400 max-w-[180px] truncate" title={k.source}>{k.source}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-400">{k.last_updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Layer 2: actual site performance — separate from demand estimates */}
      <SitePerformancePanel />

      {/* Layer 3: Rex AI interpretation — clearly labeled */}
      <RexRecommendPanel onOpenFull={onOpenInsights} />

      <p className="mt-6 text-[11px] text-slate-400 leading-relaxed">
        Labels: "Est. monthly" figures are source-labeled estimates (Keyword Planner values are Google estimates),
        "index" values are relative interest (0-100, never exact counts), and the Search Console panel is measured
        actual performance for samedayrecycling.ca. Refresh cadence: Search Console and Analytics daily (GSC lags ~2
        days); Keyword Planner monthly once its connection is complete; Trends and licensed imports refresh when
        imported. Demand and contractor availability are never merged.
      </p>
    </div>
  );
}