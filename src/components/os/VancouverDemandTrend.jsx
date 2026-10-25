import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Clock, TrendingUp, MousePointerClick } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { DEMAND_TYPE_LABELS } from "@/lib/liveCategories";

// Vancouver demand trend — interactive monthly graph of verified demand
// records for one city. SONOGRAM philosophy: data-first, calm, honest labels.
// Demand types stay separate in every tooltip — never blended into one score.

const monthLabel = (m) => {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleString("en-CA", { month: "short", year: "2-digit" });
};

function TooltipBox({ active, payload }) {
  const p = payload?.[0]?.payload;
  if (!active || !p) return null;
  const types = Object.entries(p.demand_types || {});
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-md">
      <div className="text-xs font-bold text-[#102B2A]">{monthLabel(p.month)}</div>
      <div className="mt-0.5 text-lg font-bold text-[#187B65] tabular-nums leading-none">{p.count}</div>
      <div className="text-[10px] font-semibold text-slate-400">verified records</div>
      {types.length > 0 && (
        <div className="mt-2 space-y-0.5 border-t border-slate-100 pt-2">
          {types.map(([t, n]) => (
            <div key={t} className="flex justify-between gap-3 text-[11px] text-slate-600">
              <span>{DEMAND_TYPE_LABELS[t] || t}</span>
              <span className="font-bold text-[#102B2A] tabular-nums">{n}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VancouverDemandTrend() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    base44.functions.invoke("liveIntelligence", { action: "gauge", days: 365, city: "Vancouver" })
      .then((res) => { if (alive) { setData(res.data); setLoading(false); } })
      .catch(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const trend = (data?.trend || []).map((t) => ({ ...t, label: monthLabel(t.month) }));
  const refreshed = data?.generated_at
    ? new Date(data.generated_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })
    : null;
  const sel = selected ? trend.find((t) => t.month === selected) : null;

  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#187B65]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#187B65] uppercase">
            <TrendingUp className="w-3.5 h-3.5" /> Vancouver · demand trend
          </span>
          <h3 className="mt-2 text-lg font-bold tracking-tight text-[#102B2A]">How demand has moved month by month</h3>
        </div>
        <span className="text-[11px] font-bold text-slate-400">Last 12 months</span>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Verified demand records for Vancouver, one month at a time.{" "}
        <span className="inline-flex items-center gap-1 font-semibold text-slate-500"><MousePointerClick className="w-3.5 h-3.5" />Tap a month to pin its breakdown.</span>
      </p>

      {loading ? (
        <div className="mt-8 grid place-items-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-[#187B65]" />
        </div>
      ) : trend.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-[#f4f7f5] border border-slate-200 px-5 py-8 text-center">
          <p className="text-sm text-slate-600 leading-relaxed">
            {data?.empty_note || "Insufficient observations for Vancouver yet."} New records appear as residents research and request services — nothing is estimated to fill the gap.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
                onClick={(state) => {
                  const p = state?.activePayload?.[0]?.payload;
                  if (p) setSelected((s) => (s === p.month ? null : p.month));
                }}>
                <defs>
                  <linearGradient id="vanDemandFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#187B65" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#187B65" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#eef2f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<TooltipBox />} cursor={{ stroke: "#54D9AE", strokeWidth: 1.5 }} />
                <Area type="monotone" dataKey="count" stroke="#187B65" strokeWidth={2.5}
                  fill="url(#vanDemandFill)" dot={{ r: 3, fill: "#187B65", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#54D9AE", stroke: "#187B65", strokeWidth: 2, cursor: "pointer" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <AnimatePresence mode="wait">
            {sel && (
              <motion.div key={sel.month} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
                className="mt-4 rounded-2xl bg-[#f4f7f5] border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#102B2A]">{monthLabel(sel.month)}</span>
                  <span className="text-lg font-bold text-[#187B65] tabular-nums leading-none">{sel.count}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(sel.demand_types || {}).map(([t, n]) => (
                    <span key={t} className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                      {DEMAND_TYPE_LABELS[t] || t}: <span className="font-bold text-[#102B2A] tabular-nums">{n}</span>
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-[10px] text-slate-400">
        <Clock className="w-3 h-3 shrink-0" />
        {refreshed ? `Refreshed ${refreshed}` : "Refreshed periodically"} · Source: verified platform demand records for Vancouver. Record counts by month and type — never projections, never blended scores.
      </p>
    </div>
  );
}