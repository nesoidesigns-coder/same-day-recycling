import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Loader2 } from "lucide-react";
import { LIVE_CATEGORIES, DEMAND_TYPE_LABELS } from "@/lib/liveCategories";

const COLORS = ["#187B65", "#2FA07E", "#54C39A", "#7ED9B4", "#A7E8CC", "#3E9C82", "#67CFA5", "#90DDBF"];

// Interactive composition gauge for the LIVE Centre. Shows percentages and
// underlying counts of real demand records, with demand types kept separate.
// Insufficient data is stated plainly — never filled with estimates.
export default function ActivityGauge({ data, loading, selected, onSelectCategory }) {
  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-6 flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading demand observations…
      </div>
    );
  }
  if (!data || data.error) {
    return <div className="rounded-2xl bg-white border border-slate-200 p-6 text-sm text-slate-500">Live demand intelligence is unavailable right now. Please try again shortly.</div>;
  }
  if (!data.total) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 p-6">
        <p className="font-bold text-[#102B2A]">{data.empty_note}</p>
        <p className="mt-1.5 text-sm text-slate-600">No verified demand observations match the filters above yet. Try a wider window or fewer filters — and rest assured nothing here is estimated.</p>
      </div>
    );
  }

  const rows = (data.rows || []).map((r, i) => ({
    ...r,
    label: LIVE_CATEGORIES[r.key] || r.key,
    pct: Math.round((r.count / data.total) * 100),
    fill: COLORS[i % COLORS.length],
  }));
  const selectedRow = rows.find((r) => r.key === selected) || rows[0];
  const uncategorisedPct = data.uncategorised ? Math.round((data.uncategorised / data.total) * 100) : 0;

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={rows}
                dataKey="count"
                nameKey="label"
                innerRadius="55%"
                outerRadius="88%"
                stroke="#ffffff"
                strokeWidth={2}
                onClick={(entry) => onSelectCategory && onSelectCategory(entry.key)}
              >
                {rows.map((r) => (
                  <Cell key={r.key} fill={r.fill} cursor="pointer" opacity={selectedRow && selectedRow.key !== r.key ? 0.45 : 1} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} observation${value === 1 ? "" : "s"}`, name]} />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-center text-sm font-bold text-[#102B2A]">
            {data.total} observation{data.total === 1 ? "" : "s"} matching filters
          </p>
        </div>

        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.key}>
              <button
                onClick={() => onSelectCategory && onSelectCategory(r.key)}
                className={`w-full text-left rounded-xl border px-3.5 py-2.5 flex items-baseline justify-between gap-3 transition-colors ${selectedRow?.key === r.key ? "border-[#187B65] bg-[#187B65]/5" : "border-slate-200 hover:border-[#187B65]"}`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-[#102B2A]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.fill }} />
                  {r.label}
                </span>
                <span className="text-sm text-slate-600 tabular-nums shrink-0">{r.count} · {r.pct}%</span>
              </button>
            </li>
          ))}
          {data.uncategorised > 0 && (
            <li className="rounded-xl border border-slate-200 px-3.5 py-2.5 flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-slate-500">Other observations (no category assigned yet)</span>
              <span className="text-sm text-slate-500 tabular-nums">{data.uncategorised} · {uncategorisedPct}%</span>
            </li>
          )}
        </ul>
      </div>

      {selectedRow && (
        <div className="mt-5 rounded-xl bg-[#f4f7f5] border border-slate-100 p-4">
          <div className="text-sm font-bold text-[#102B2A]">{selectedRow.label} — record types</div>
          <ul className="mt-2 grid sm:grid-cols-2 gap-1.5 text-xs text-slate-600">
            {Object.entries(selectedRow.demand_types).map(([type, n]) => (
              <li key={type} className="flex items-baseline justify-between gap-3">
                <span>{DEMAND_TYPE_LABELS[type] || type}</span>
                <span className="tabular-nums">{n}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-500">Record types are always shown separately — platform requests, public signals and confirmed bookings are never merged into one score.</p>
        </div>
      )}

      <p className="mt-4 text-[11px] text-slate-400">{data.basis_note}</p>
    </div>
  );
}