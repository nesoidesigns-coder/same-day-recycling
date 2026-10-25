import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { DEMAND_TYPE_LABELS } from "@/lib/liveCategories";
import DataSourceLabel from "@/components/li/DataSourceLabel";

// Living Infrastructure — demand trend chart. Monthly verified record counts
// for a location, with the demand-type mix kept separate in every tooltip.
// Tap a month to pin its breakdown.

const monthLabel = (m) => {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleString("en-CA", { month: "short", year: "2-digit" });
};

function TooltipBox({ active, payload }) {
  const p = payload?.[0]?.payload;
  if (!active || !p) return null;
  const types = Object.entries(p.demand_types || {});
  return (
    <div className="rounded-xl border border-li-steel bg-white px-3 py-2.5 shadow-md">
      <div className="font-plex text-xs font-semibold text-li-carbon">{monthLabel(p.month)}</div>
      <div className="font-plex mt-0.5 text-lg font-semibold text-li-infra tabular-nums leading-none">{p.count}</div>
      <div className="font-plex text-[10px] text-li-slate">verified records</div>
      {types.length > 0 && (
        <div className="mt-2 space-y-0.5 border-t border-li-steel pt-2">
          {types.map(([t, n]) => (
            <div key={t} className="flex justify-between gap-3 text-[11px] text-li-slate">
              <span>{DEMAND_TYPE_LABELS[t] || t}</span>
              <span className="font-plex font-semibold text-li-carbon tabular-nums">{n}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DemandTrendChart({ city = "", province = "", days = 365, title = "Demand trend", subtitle }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    base44.functions.invoke("liveIntelligence", { action: "gauge", days, province, city })
      .then((res) => { if (alive) { setData(res.data); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [province, city, days]);

  const trend = (data?.trend || []).map((t) => ({ ...t, label: monthLabel(t.month) }));
  const updated = data?.generated_at
    ? new Date(data.generated_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })
    : null;
  const sel = selected ? trend.find((t) => t.month === selected) : null;
  const scope = city || (province ? province : "national");

  return (
    <div className="rounded-[14px] border border-li-steel bg-white p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold text-li-carbon">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-li-slate">{subtitle}</p>}
        </div>
        <span className="font-plex text-[11px] font-medium text-li-slate">Last {days === 365 ? "12 months" : days + " days"}</span>
      </div>

      {loading ? (
        <div className="mt-6 grid place-items-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-li-steel border-t-li-infra" />
        </div>
      ) : trend.length === 0 ? (
        <div className="mt-4 rounded-xl bg-li-pale px-4 py-6 text-center text-sm text-li-slate">
          Collecting verified data for this location. Records appear as residents research and request services — nothing is estimated to fill the gap.
        </div>
      ) : (
        <>
          <div className="mt-3" style={{ height: 230 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
                onClick={(state) => {
                  const p = state?.activePayload?.[0]?.payload;
                  if (p) setSelected((s) => (s === p.month ? null : p.month));
                }}>
                <defs>
                  <linearGradient id="liDemandFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#176B52" stopOpacity={0.26} />
                    <stop offset="100%" stopColor="#176B52" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#DCE5E1" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#64736E", fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={{ stroke: "#DCE5E1" }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fill: "#64736E", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip content={<TooltipBox />} cursor={{ stroke: "#21C997", strokeWidth: 1.5 }} />
                <Area type="monotone" dataKey="count" stroke="#176B52" strokeWidth={2.5}
                  fill="url(#liDemandFill)" dot={{ r: 3, fill: "#176B52", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#21C997", stroke: "#176B52", strokeWidth: 2, cursor: "pointer" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <AnimatePresence mode="wait">
            {sel && (
              <motion.div key={sel.month} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.24 }}
                className="mt-3 rounded-xl bg-li-pale p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-plex text-sm font-semibold text-li-carbon">{monthLabel(sel.month)}</span>
                  <span className="font-plex text-lg font-semibold text-li-infra tabular-nums leading-none">{sel.count}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(sel.demand_types || {}).map(([t, n]) => (
                    <span key={t} className="rounded-lg border border-li-steel bg-white px-2.5 py-1 text-[11px] font-semibold text-li-slate">
                      {DEMAND_TYPE_LABELS[t] || t}: <span className="font-plex font-semibold text-li-carbon tabular-nums">{n}</span>
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <div className="mt-3">
        <DataSourceLabel
          what="Verified demand records"
          scope={scope}
          period={`Last ${days === 365 ? "12 months" : days + " days"}`}
          basis="Observed, unblended by demand type"
          source="platform demand records"
          updatedAt={updated}
        />
      </div>
    </div>
  );
}