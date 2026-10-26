import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronRight, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { REGIONS } from "@/lib/regions";
import { CITIES } from "@/lib/cities";
import { LIVE_CATEGORIES, DEMAND_TYPE_LABELS } from "@/lib/liveCategories";
import { CATEGORY_PALETTE } from "./gaugeCore";

// Recycling OS LIVE — the signature circular intelligence visualization.
// One living system view: drill Canada → Province → City, tap a category
// segment, and every panel updates from real demand records. Honest empty
// states; counts only, never blended demand scores.

const PALETTE = CATEGORY_PALETTE;
const R = 100;
const CIRC = 2 * Math.PI * R;
const GAP = 2.5;

export default function LiveRing({ compact = false }) {
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const regionName = (code) => REGIONS.find((r) => r.code === code)?.name || "";
  const cityOptions = useMemo(
    () => CITIES.filter((c) => !province || String(c.province || "") === regionName(province)),
    [province]
  );

  useEffect(() => {
    let alive = true;
    setLoading(true);
    base44.functions.invoke("liveIntelligence", { action: "gauge", days: 30, province, city })
      .then((res) => { if (alive) { setData(res.data); setLoading(false); } })
      .catch(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [province, city]);

  const rows = (data?.rows || []).filter((r) => r.count > 0);
  const total = data?.total ?? 0;
  const selected = category ? rows.find((r) => r.key === category) : null;
  const refreshed = data?.generated_at ? new Date(data.generated_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : null;

  let cum = 0;
  const segments = rows.map((r, i) => {
    const start = cum;
    const frac = total > 0 ? r.count / total : 0;
    cum += frac;
    return { ...r, start, frac, color: PALETTE[i % PALETTE.length] };
  });

  const pick = (key) => setCategory((c) => (c === key ? null : key));
  const setProv = (code) => { setProvince(code); setCity(""); setCategory(null); };

  return (
    <div className={`rounded-3xl bg-white border border-slate-200 ${compact ? "p-4" : "p-5 md:p-6"}`}>
      {/* Breadcrumb drill: Canada → Province → City */}
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 text-sm font-semibold text-slate-500">
        <span className="text-[#102B2A] font-bold">Canada</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <select value={province} onChange={(e) => setProv(e.target.value)} aria-label="Province" className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-[#102B2A]">
          <option value="">All provinces</option>
          {REGIONS.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
        </select>
        {province && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <select value={city} onChange={(e) => { setCity(e.target.value); setCategory(null); }} aria-label="City" className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm font-semibold text-[#102B2A]">
              <option value="">All cities</option>
              {cityOptions.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </>
        )}
        {city && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-[#102B2A] font-bold">{city}</span>
          </>
        )}
        <span className="ml-auto text-[11px] font-bold text-slate-400">Last 30 days</span>
      </div>

      <div className="mt-4 grid md:grid-cols-2 gap-5 items-center">
        {/* The ring */}
        <div className="relative mx-auto" style={{ width: 260, height: 260 }}>
          {loading ? (
            <div className="absolute inset-0 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin text-[#187B65]" /></div>
          ) : rows.length === 0 ? (
            <div className="absolute inset-0 grid place-items-center px-8 text-center">
              <p className="text-sm text-slate-500 leading-relaxed">{data?.empty_note || "Insufficient observations for this selection."} New records appear as Canadians research and request services.</p>
            </div>
          ) : (
            <>
              <svg viewBox="0 0 260 260" className="w-full h-full -rotate-90" role="img" aria-label="Service category demand ring">
                <circle cx="130" cy="130" r={R} fill="none" stroke="#eef2f0" strokeWidth="26" />
                {segments.map((s) => {
                  const len = Math.max(4, s.frac * CIRC - GAP);
                  const isSel = category === s.key;
                  const dim = category && !isSel;
                  return (
                    <circle
                      key={s.key}
                      cx="130" cy="130" r={R}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={isSel ? 30 : 24}
                      strokeDasharray={`${len} ${CIRC - len}`}
                      transform={`rotate(${s.start * 360} 130 130)`}
                      className="cursor-pointer transition-all duration-500"
                      style={{ opacity: dim ? 0.28 : 1 }}
                      onClick={() => pick(s.key)}
                      role="button"
                      aria-label={`${LIVE_CATEGORIES[s.key]}: ${s.count} records`}
                    >
                      <title>{LIVE_CATEGORIES[s.key]} — {s.count} records</title>
                    </circle>
                  );
                })}
              </svg>
              <button onClick={() => setCategory(null)} className="absolute inset-0 m-auto w-36 h-36 rounded-full grid place-items-center text-center hover:scale-105 transition-transform" aria-label="Reset selection">
                <div>
                  <div className="text-4xl font-bold text-[#102B2A] tabular-nums">{total}</div>
                  <div className="mt-1 text-[10px] font-bold tracking-wide uppercase text-slate-400">{selected ? "records · tap to reset" : "verified records"}</div>
                </div>
              </button>
            </>
          )}
        </div>

        {/* Connected intelligence panel */}
        <AnimatePresence mode="wait">
          <motion.div key={category || "overview"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
            {loading ? (
              <p className="text-sm text-slate-500">Loading demand records…</p>
            ) : selected ? (
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: segments.find((s) => s.key === selected.key)?.color }} />
                  <h3 className="font-bold text-[#102B2A]">{LIVE_CATEGORIES[selected.key] || selected.key.replace(/_/g, " ")}</h3>
                </div>
                <p className="mt-1 text-sm text-slate-600">{selected.count} of {total} verified records · {Math.round(selected.frac * 100)}% of activity</p>
                <div className="mt-3 grid grid-cols-2 gap-1.5">
                  {Object.entries(selected.demand_types || {}).map(([t, n]) => (
                    <span key={t} className="rounded-lg bg-[#f4f7f5] px-2.5 py-1.5 text-[11px] font-semibold text-slate-600">
                      {DEMAND_TYPE_LABELS[t] || t}: <span className="text-[#102B2A] tabular-nums">{n}</span>
                    </span>
                  ))}
                </div>
                <Link to="/live" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#187B65] hover:underline">Open in the LIVE centre <span aria-hidden="true">→</span></Link>
              </div>
            ) : (
              <div>
                <h3 className="font-bold text-[#102B2A]">Tap a segment to explore</h3>
                <p className="mt-1 text-sm text-slate-600">Each segment is a service category. Demand types stay separate — public requests, platform inquiries, confirmed bookings and search interest are never blended into one score.</p>
                <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {rows.map((s) => (
                    <button key={s.key} onClick={() => pick(s.key)} className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-[#f4f7f5]">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="flex-1 truncate font-semibold text-[#102B2A]">{LIVE_CATEGORIES[s.key] || s.key.replace(/_/g, " ")}</span>
                      <span className="font-bold text-slate-500 tabular-nums">{s.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-400">
        <Clock className="w-3 h-3" /> {refreshed ? `Refreshed ${refreshed}` : "Refreshed periodically"} · Source: verified platform demand records. Record counts, not projections of live traffic.
      </p>
    </div>
  );
}