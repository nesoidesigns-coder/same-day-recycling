// Circular KPI ring used across the SEO Command Center (dark console style).
export default function GscRing({ pct, value, label, sub, status = "ok" }) {
  const color = status === "ok" ? "#54D9AE" : status === "pending" ? "#fbbf24" : "#64748b";
  const r = 34;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct ?? 0));
  return (
    <div className="holo-panel-deep relative rounded-2xl border border-[#54D9AE]/15 p-5 flex flex-col items-center text-center overflow-hidden">
      <svg viewBox="0 0 80 80" className="w-20 h-20">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(84,217,174,0.12)" strokeWidth="7" />
        <circle
          cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (clamped / 100) * c}
          transform="rotate(-90 40 40)"
        />
        <text x="40" y="45" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="700">{value}</text>
      </svg>
      <div className="mt-2 text-sm font-bold text-white">{label}</div>
      <div className="mt-1 text-xs text-slate-400">{sub}</div>
    </div>
  );
}