import TrendBadge from "./TrendBadge";

export default function StatCard({ title, value, unit = "", sub, delta, positiveIsGood = true, tone = "slate" }) {
  const toneCls = {
    slate: "text-li-carbon",
    emerald: "text-li-infra",
    cyan: "text-li-infra",
    amber: "text-li-amber",
  }[tone];

  return (
    <div className="rounded-[14px] border border-li-steel bg-white p-5 shadow-sm flex flex-col justify-between">
      <div className="text-sm font-bold text-li-carbon">{title}</div>
      <div className={`font-plex text-3xl font-semibold tracking-tight tabular-nums mt-3 ${toneCls}`}>
        {value}
        {unit && <span className="text-base font-semibold text-li-slate ml-1">{unit}</span>}
      </div>
      {sub && <div className="text-xs text-li-slate mt-1">{sub}</div>}
      <div className="mt-3">
        <TrendBadge delta={delta} positiveIsGood={positiveIsGood} />
      </div>
    </div>
  );
}