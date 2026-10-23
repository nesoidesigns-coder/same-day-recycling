import { useMemo } from "react";
import { Info, TrendingDown, TrendingUp, X } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCount } from "./PulseRing";
import { CATEGORY_LABELS } from "@/lib/demandShared";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Geography scope: one level only, so the same keyword is never counted twice
// across national, provincial and city rows (mirrors the server-side rule).
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

const sumVol = (list) => list.reduce((a, r) => a + (Number(r.est_monthly_volume) || 0), 0);
const groupBy = (rows, field) => {
  const map = new Map();
  for (const r of rows) {
    const key = r[field];
    if (!key) continue;
    const e = map.get(key) || { key, volume: 0, index: 0, keywords: 0, updated: "" };
    e.volume += Number(r.est_monthly_volume) || 0;
    e.index = Math.max(e.index, Number(r.trend_index) || 0);
    e.keywords += 1;
    e.updated = String(r.last_updated || "") > e.updated ? String(r.last_updated || "") : e.updated;
    map.set(key, e);
  }
  return [...map.values()];
};

// Interactive detail card for one selected service category: headline
// estimate, YoY change (when a same-month observation from the prior year is
// on file), historical trend, seasonal pattern, province/city breakdown, and
// the data source + last-updated date. Estimates only — never fabricated.
export default function CategoryDetail({ series, province, city, cat, onClose }) {
  const view = useMemo(() => {
    const scoped = scopeRows(series, province, city).filter((r) => r.service_category === cat.category);
    const all = series.filter((r) => r.service_category === cat.category);
    const periods = [...new Set(scoped.map((r) => r.period).filter(Boolean))].sort();
    const latest = periods[periods.length - 1] || cat.last_updated?.slice(0, 7) || "";
    const inLatest = scoped.filter((r) => r.period === latest);

    // Year-over-year: same calendar month, one year earlier — only when that
    // period actually exists on file (never extrapolated).
    const yoyKey = latest ? `${Number(latest.slice(0, 4)) - 1}${latest.slice(4)}` : "";
    const yoyRows = periods.includes(yoyKey) ? scoped.filter((r) => r.period === yoyKey) : null;
    const latestVol = sumVol(inLatest);
    const yoyPct = yoyRows && latestVol ? Math.round(((latestVol - sumVol(yoyRows)) / sumVol(yoyRows)) * 1000) / 10 : null;

    const trend = periods.map((p) => ({ period: p, volume: sumVol(scoped.filter((r) => r.period === p)) }));

    // Seasonal pattern: calendar-month aggregation across all periods on file.
    const byMonth = new Map();
    for (const r of scoped) {
      const m = Number(String(r.period || "").slice(5, 7));
      if (!m) continue;
      byMonth.set(m, (byMonth.get(m) || 0) + (Number(r.est_monthly_volume) || 0));
    }
    const seasonal = [...byMonth.entries()].sort((a, b) => a[0] - b[0]).map(([m, v]) => ({ month: MONTHS[m - 1], volume: v }));

    const provinces = groupBy(all.filter((r) => r.geo_type === "province"), "province_code")
      .sort((a, b) => b.volume - a.volume).slice(0, 6);
    const cities = groupBy(all.filter((r) => r.geo_type === "city" && (!province || String(r.province_code || "").toLowerCase() === province.toLowerCase())), "city")
      .sort((a, b) => b.volume - a.volume).slice(0, 6);

    const sources = [...new Set(scoped.map((r) => r.source).filter(Boolean))];
    const lastUpdated = scoped.map((r) => String(r.last_updated || "")).sort().pop() || cat.last_updated || "";
    const basis = [...new Set(scoped.map((r) => r.volume_basis).filter(Boolean))];
    const competition = scoped.filter((r) => r.period === latest).map((r) => r.competition).find((c) => c && c !== "unknown") || "unknown";

    return { latest, latestVol, yoyPct, yoyKey, trend, seasonal, provinces, cities, sources, lastUpdated, basis, competition, count: scoped.length };
  }, [series, province, city, cat]);

  const geoLabel = province ? `${province}${city ? ` · ${city}` : ""}` : "All Canada";
  const maxGeo = Math.max(1, ...view.provinces.map((p) => p.volume), ...view.cities.map((c) => c.volume));

  const GeoBars = ({ title, rows, unit }) => (
    rows.length > 0 && (
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50 mb-2">{title}</div>
        <div className="space-y-1.5">
          {rows.map((g) => (
            <div key={g.key} className="flex items-center gap-2 text-xs">
              <span className="w-28 shrink-0 truncate text-white/80">{unit === "province" ? g.key : g.key}</span>
              <div className="h-2 flex-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#187B65] to-[#54D9AE]" style={{ width: `${Math.max(4, (g.volume / maxGeo) * 100)}%` }} />
              </div>
              <span className="w-16 shrink-0 text-right font-bold text-white tabular-nums">{g.volume ? formatCount(g.volume) : `index ${g.index}`}</span>
            </div>
          ))}
        </div>
      </div>
    )
  );

  return (
    <div className="mt-6 rounded-3xl border border-[#187B65]/30 bg-white/[0.05] p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#54D9AE]">{cat.label} — demand detail</div>
          <div className="text-xs text-white/50 mt-0.5">{geoLabel} · reporting period {view.latest || "—"}</div>
        </div>
        <button onClick={onClose} aria-label="Close category detail" className="rounded-full border border-white/15 p-1.5 text-white/60 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      {view.count === 0 ? (
        <div className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-[#54D9AE]" />
          <span>
            No verified observations on file for {cat.label.toLowerCase()} at this geography level yet — figures may
            exist for other provinces or cities. Nothing is estimated to fill the gap.
          </span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">Est. monthly searches</div>
              <div className="text-2xl font-extrabold text-white tabular-nums">{formatCount(view.latestVol)}</div>
              <div className="text-[10px] text-white/40 mt-1">Google estimate · {view.latest}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">Year-over-year</div>
              {view.yoyPct === null ? (
                <div className="text-2xl font-extrabold text-white/30">—</div>
              ) : (
                <div className={`text-2xl font-extrabold tabular-nums flex items-center gap-1.5 ${view.yoyPct >= 0 ? "text-[#54D9AE]" : "text-amber-300"}`}>
                  {view.yoyPct >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  {view.yoyPct >= 0 ? "+" : ""}{view.yoyPct}%
                </div>
              )}
              <div className="text-[10px] text-white/40 mt-1">{view.yoyPct === null ? `No ${view.yoyKey || "prior-year"} data on file` : `vs ${view.yoyKey}`}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">Keywords tracked</div>
              <div className="text-2xl font-extrabold text-white tabular-nums">{view.count}</div>
              <div className="text-[10px] text-white/40 mt-1">Deduplicated observations</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/50">Ad competition</div>
              <div className="text-2xl font-extrabold text-white capitalize">{view.competition}</div>
              <div className="text-[10px] text-white/40 mt-1">From the volume source</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              {view.trend.length >= 2 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50 mb-2">Historical trend</div>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={view.trend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                        <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                        <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} width={52} tickFormatter={(v) => formatCount(v)} />
                        <Tooltip formatter={(v) => [formatCount(v), "Est. searches"]} contentStyle={{ background: "#0a2e24", border: "1px solid rgba(84,217,174,0.3)", borderRadius: 12, color: "#fff" }} labelStyle={{ color: "#54D9AE" }} />
                        <Line type="monotone" dataKey="volume" stroke="#54D9AE" strokeWidth={2.5} dot={{ r: 3, fill: "#54D9AE" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">
                  Only one period on file — the historical trend appears as more monthly observations accumulate.
                </div>
              )}
              {view.seasonal.length > 2 && (
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50 mb-2">Seasonal pattern (calendar months, all periods on file)</div>
                  <div className="flex items-end gap-1 h-24">
                    {view.seasonal.map((s) => {
                      const max = Math.max(...view.seasonal.map((x) => x.volume), 1);
                      return (
                        <div key={s.month} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full rounded-t bg-gradient-to-t from-[#187B65] to-[#54D9AE]" style={{ height: `${Math.max(4, (s.volume / max) * 72)}px` }} title={`${s.month}: ${formatCount(s.volume)}`} />
                          <span className="text-[9px] text-white/40">{s.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <GeoBars title="By province / territory" rows={view.provinces} unit="province" />
              <GeoBars title={province ? `Cities in ${province}` : "Top cities"} rows={view.cities} unit="city" />
              {view.provinces.length === 0 && view.cities.length === 0 && (
                <p className="text-sm text-white/60">No provincial or city breakdown on file for this category.</p>
              )}
            </div>
          </div>

          <div className="mt-5 text-[10px] text-white/40 leading-relaxed">
            Source: {view.sources.join(" · ") || "—"} · Last updated {view.lastUpdated || "—"} · Basis: {(view.basis.join(" · ") || "source-labeled observation")} ·
            Estimates, not exact counts. Relative-interest indices are never summed into search totals.
          </div>
        </>
      )}
    </div>
  );
}