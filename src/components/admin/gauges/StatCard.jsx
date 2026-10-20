import TrendBadge from "./TrendBadge";

export default function StatCard({ title, value, unit = "", sub, delta, positiveIsGood = true, tone = "slate" }) {
  const toneCls = {
    slate: "text-slate-900",
    emerald: "text-emerald-600",
    cyan: "text-cyan-600",
    amber: "text-amber-600",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
      <div className="text-sm font-bold text-slate-800">{title}</div>
      <div className={`text-3xl font-bold tracking-tight tabular-nums mt-3 ${toneCls}`}>
        {value}
        {unit && <span className="text-base font-semibold text-slate-400 ml-1">{unit}</span>}
      </div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
      <div className="mt-3">
        <TrendBadge delta={delta} positiveIsGood={positiveIsGood} />
      </div>
    </div>
  );
}