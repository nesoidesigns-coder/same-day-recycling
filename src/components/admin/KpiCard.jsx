import { Link } from "react-router-dom";

export default function KpiCard({ label, value, sub, delta, tone = "forest", href }) {
  const tones = {
    forest: "text-[#102B2A]",
    emerald: "text-[#187B65]",
    amber: "text-amber-600",
    red: "text-red-600",
  };
  const body = (
    <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5 h-full hover:border-[#187B65]/50 transition-colors">
      <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">{label}</div>
      <div className={`mt-2 text-2xl font-bold tracking-tight ${tones[tone]}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
      {delta !== null && delta !== undefined && (
        <div className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${delta >= 0 ? "bg-[#187B65]/10 text-[#187B65]" : "bg-red-50 text-red-600"}`}>
          {delta >= 0 ? "+" : ""}{delta}% vs prior period
        </div>
      )}
    </div>
  );
  return href ? <Link to={href} className="block h-full">{body}</Link> : body;
}