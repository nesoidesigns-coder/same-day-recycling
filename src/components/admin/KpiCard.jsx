import { Link } from "react-router-dom";

export default function KpiCard({ label, value, sub, delta, tone = "forest", href }) {
  const tones = {
    forest: "text-li-forest",
    emerald: "text-li-infra",
    amber: "text-li-amber",
    red: "text-li-red",
  };
  const body = (
    <div className="surface surface-hover p-5 h-full">
      <div className="font-plex text-[11px] font-semibold uppercase tracking-[0.15em] text-li-slate">{label}</div>
      <div className={`metric mt-2 text-2xl ${tones[tone]}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-li-slate">{sub}</div>}
      {delta !== null && delta !== undefined && (
        <div className={`font-plex mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${delta >= 0 ? "bg-li-mint/15 text-li-forest" : "bg-li-red/10 text-li-red"}`}>
          {delta >= 0 ? "+" : ""}{delta}% vs prior period
        </div>
      )}
    </div>
  );
  return href ? <Link to={href} className="block h-full">{body}</Link> : body;
}