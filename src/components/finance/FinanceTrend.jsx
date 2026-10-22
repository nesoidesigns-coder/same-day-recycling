import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { fmtCAD } from "./financeShared";

export default function FinanceTrend({ summary }) {
  return (
    <div className="holo-panel holo-panel-deep rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Monthly income vs expenses</h3>
        <span className="text-[11px] text-white/50">Last 6 months</span>
      </div>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={summary.series} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => "$" + Math.round(v)} />
            <Tooltip
              formatter={(v, name) => [fmtCAD(v), name === "income" ? "Income" : "Expenses"]}
              contentStyle={{ background: "#0a241c", border: "1px solid rgba(84,217,174,0.3)", borderRadius: 12, color: "#fff", fontSize: 12 }}
            />
            <Legend formatter={(v) => (v === "income" ? "Income" : "Expenses")} wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }} />
            <Bar dataKey="income" fill="#54D9AE" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="expense" fill="#e2b04a" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
        <span className="w-2 h-2 rounded-full bg-[#54D9AE] network-pulse" />
        Cash-flow projection: about {fmtCAD(summary.projectedNet)} net per active month, based on your recent trend.
      </div>
    </div>
  );
}