import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { REGIONS } from "@/lib/regions";
import { CITIES } from "@/lib/cities";
import { LIVE_CATEGORIES, DEMAND_TYPE_LABELS } from "@/lib/liveCategories";
import DataSourceLabel from "@/components/li/DataSourceLabel";

// The Recycling OS Signal Core — signature layered intelligence visualization.
// Inner circle: selected location, category and verified activity count.
// Middle ring: service-category distribution, segments from observed data.
// Outer ring: source availability indicators. Selecting a category highlights
// its segment and updates the count and breakdown. Real records only — when
// there is nothing verified, it says "Collecting verified data". An accessible
// table alternative is provided below the visualization.

const CATEGORY_KEYS = [
  "furniture_appliance_removal",
  "moving_downsizing",
  "renovation_construction_debris",
  "property_management_turnover",
  "recycling_specialty_disposal",
  "commercial_office_cleanouts",
  "urgent_same_day",
  "donation_reuse_circular",
];

const PALETTE = ["#176B52", "#21C997", "#103D32", "#D99636", "#64736E", "#0A4A3C", "#8FB8AC", "#3A5B52"];

const TIME_OPTIONS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "12 months" },
];

const arcEntries = (entries) => {
  const total = entries.reduce((s, e) => s + e.value, 0);
  if (!total) return [];
  let cum = 0;
  return entries.map((e) => {
    const frac = e.value / total;
    const start = cum / total;
    cum += e.value;
    return { ...e, frac, start };
  });
};

const R_INNER = 106;
const R_MID = 146;
const R_OUTER = 176;

export default function NationalSignalCore({ compact = false }) {
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [days, setDays] = useState(30);
  const [category, setCategory] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    base44.functions.invoke("liveIntelligence", { action: "gauge", days, province, city })
      .then((res) => { if (alive) { setData(res.data); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [province, city, days]);

  const regionName = province ? (REGIONS.find((r) => r.code === province)?.name || "") : "";
  const cityOptions = CITIES.filter((c) => !province || String(c.province || "") === regionName);

  const rows = (data?.rows || []).filter((r) => r.count > 0);
  const total = data?.total ?? 0;
  const sel = category ? rows.find((r) => r.key === category) : null;
  const innerCount = sel ? sel.count : total;
  const location = city || regionName || "Canada";
  const catLabel = sel ? (LIVE_CATEGORIES[sel.key] || sel.key.replace(/_/g, " ")) : "All categories";
  const periodLabel = (TIME_OPTIONS.find((t) => t.days === days) || {}).label;
  const updated = data?.generated_at
    ? new Date(data.generated_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })
    : null;

  const midArcs = arcEntries(rows.map((r, i) => ({ key: r.key, value: r.count, color: PALETTE[i % PALETTE.length] })));
  const outerArcs = arcEntries(Object.entries(data?.by_source || {}).map(([key, value]) => ({ key, value })));

  const pick = (key) => setCategory((c) => (c === key ? null : key));
  const setProv = (code) => { setProvince(code); setCity(""); setCategory(null); };

  const arc = (entry, r) => {
    const c = 2 * Math.PI * r;
    const len = Math.max(3, entry.frac * c - 2);
    return `${len} ${c - len}`;
  };

  return (
    <div className={`min-w-0 rounded-[20px] border border-li-steel bg-li-cloud ${compact ? "p-4" : "p-5 md:p-6"}`}>
      {!compact && (
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
          <select value={province} onChange={(e) => setProv(e.target.value)} aria-label="Province"
            className="w-full sm:w-auto max-w-full rounded-xl border border-li-steel bg-white px-3 py-2 text-sm font-semibold text-li-carbon">
            <option value="">All provinces</option>
            {REGIONS.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
          </select>
          {province && (
            <select value={city} onChange={(e) => { setCity(e.target.value); setCategory(null); }} aria-label="City"
              className="w-full sm:w-auto max-w-full rounded-xl border border-li-steel bg-white px-3 py-2 text-sm font-semibold text-li-carbon">
              <option value="">All cities</option>
              {cityOptions.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          )}
          <div className="w-full sm:w-auto sm:ml-auto flex items-center justify-center gap-1 rounded-xl border border-li-steel bg-white p-1">
            {TIME_OPTIONS.map((t) => (
              <button key={t.days} onClick={() => { setDays(t.days); setCategory(null); }}
                className={`font-plex rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors duration-200 ${days === t.days ? "bg-li-pale text-li-forest" : "text-li-slate hover:text-li-carbon"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!compact && (
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          <button onClick={() => setCategory(null)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${!category ? "border-li-mint bg-li-mint/10 text-li-forest" : "border-li-steel bg-white text-li-slate hover:border-li-mint"}`}>
            All categories
          </button>
          {CATEGORY_KEYS.map((key) => (
            <button key={key} onClick={() => pick(key)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${category === key ? "border-li-mint bg-li-mint/10 text-li-forest" : "border-li-steel bg-white text-li-slate hover:border-li-mint"}`}>
              {LIVE_CATEGORIES[key] || key.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      )}

      <div className={`relative mx-auto w-full ${compact ? "max-w-[280px]" : "max-w-[400px]"}`}>
        {loading && (
          <div className="absolute inset-0 z-10 grid place-items-center">
            <Loader2 className="w-6 h-6 animate-spin text-li-infra" />
          </div>
        )}
        <svg viewBox="0 0 400 400" className="w-full h-full" role="img" aria-label="Recycling OS Signal Core">
          <circle cx="200" cy="200" r={R_OUTER} fill="none" stroke="#DCE5E1" strokeWidth="10" />
          <circle cx="200" cy="200" r={R_MID} fill="none" stroke="#EAF5F0" strokeWidth="26" />
          {outerArcs.map((a) => (
            <circle key={a.key} cx="200" cy="200" r={R_OUTER} fill="none" stroke="#64736E" strokeWidth="10"
              strokeOpacity="0.55" strokeDasharray={arc(a, R_OUTER)} strokeLinecap="round"
              transform={`rotate(${a.start * 360 - 90} 200 200)`}>
              <title>Source: {a.key} — {a.value} records within the selected period</title>
            </circle>
          ))}
          {category && sel && (
            <circle cx="200" cy="200" r={R_MID} fill="none" stroke="#21C997" strokeWidth="30" strokeOpacity="0.3"
              strokeDasharray={arc({ frac: Math.max(sel.count / (total || 1), 0.02), start: midArcs.find((m) => m.key === category)?.start || 0 }, R_MID)}
              transform={`rotate(${(midArcs.find((m) => m.key === category)?.start || 0) * 360 - 90} 200 200)`}
              pointerEvents="none" />
          )}
          {midArcs.map((a) => (
            <circle key={a.key} cx="200" cy="200" r={R_MID} fill="none" stroke={a.color}
              strokeWidth={category === a.key ? 30 : 24} strokeOpacity={category && category !== a.key ? 0.25 : 1}
              strokeDasharray={arc(a, R_MID)} className="cursor-pointer transition-all duration-300"
              transform={`rotate(${a.start * 360 - 90} 200 200)`}
              onClick={() => pick(a.key)} role="button" aria-label={`${LIVE_CATEGORIES[a.key] || a.key}: ${a.value} records`}>
              <title>{LIVE_CATEGORIES[a.key] || a.key} — {a.value} verified records</title>
            </circle>
          ))}
          <circle cx="200" cy="200" r={R_INNER} fill="#F7F9F8" stroke="#DCE5E1" strokeWidth="1.5" />
          <text x="200" y="162" textAnchor="middle" fontSize="14" fontWeight="700" fill="#182724">{location}</text>
          <text x="200" y="186" textAnchor="middle" fontSize="10" fontFamily="'IBM Plex Mono', monospace" fill="#64736E">
            {catLabel.length > 26 ? catLabel.slice(0, 24) + "…" : catLabel}
          </text>
          {loading ? null : total === 0 || innerCount === 0 ? (
            <text x="200" y="232" textAnchor="middle" fontSize="13" fontFamily="'IBM Plex Mono', monospace" fill="#176B52">Collecting verified data</text>
          ) : (
            <>
              <text x="200" y="238" textAnchor="middle" fontSize="38" fontWeight="600" fontFamily="'IBM Plex Mono', monospace" fill="#103D32">{innerCount}</text>
              <text x="200" y="262" textAnchor="middle" fontSize="10" fontFamily="'IBM Plex Mono', monospace" fill="#64736E">verified records</text>
            </>
          )}
        </svg>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={category || "overview"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.24 }}>
          {sel ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {Object.entries(sel.demand_types || {}).map(([t, n]) => (
                <span key={t} className="rounded-lg border border-li-steel bg-white px-2.5 py-1 text-[11px] font-semibold text-li-slate">
                  {DEMAND_TYPE_LABELS[t] || t}: <span className="font-plex font-semibold text-li-carbon tabular-nums">{n}</span>
                </span>
              ))}
            </div>
          ) : (
            !compact && (
              <p className="text-sm text-li-slate">
                Each segment is a service category built from observed records. Public requests, platform inquiries, confirmed bookings and search interest stay separate — never blended into one score.
              </p>
            )
          )}
        </motion.div>
      </AnimatePresence>

      {!compact && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-li-infra">View the data as a table</summary>
          <table className="mt-2 w-full text-sm text-li-carbon">
            <thead>
              <tr className="border-b border-li-steel text-left">
                <th className="py-1.5 pr-2 font-semibold">Category</th>
                <th className="py-1.5 pr-2 font-semibold text-right">Records</th>
                <th className="py-1.5 font-semibold text-right">Share</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-li-steel/60">
                  <td className="py-1.5 pr-2">{LIVE_CATEGORIES[r.key] || r.key.replace(/_/g, " ")}</td>
                  <td className="py-1.5 pr-2 text-right font-plex tabular-nums">{r.count}</td>
                  <td className="py-1.5 text-right font-plex tabular-nums">{total ? Math.round((r.count / total) * 100) + "%" : "—"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan="3" className="py-2 text-li-slate">No verified records in this selection yet.</td></tr>
              )}
            </tbody>
          </table>
        </details>
      )}

      <div className="mt-3">
        <DataSourceLabel
          what="Verified demand records"
          scope={location}
          period={`Last ${periodLabel}`}
          basis="Observed"
          source="platform demand records"
          updatedAt={updated}
        />
      </div>
    </div>
  );
}