import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// One Growth Intelligence gauge: big ring score plus an expandable card that
// documents the methodology, shows the supporting evidence, the identified
// problems and the recommended improvements. Value null = not tracked
// (never estimated).
export default function GrowthGauge({ label, value, loading, trend, formula, evidence, problems, actions }) {
  const [open, setOpen] = useState(false);
  const tone = value === null ? "#94a3b8" : value >= 70 ? "#187B65" : value >= 40 ? "#d97706" : "#dc2626";
  const circumference = 2 * Math.PI * 54;
  const filled = value === null ? 0 : Math.max(0, Math.min(100, value)) / 100;

  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 flex flex-col">
      <div className="flex items-center gap-4">
        <div className="relative w-28 h-28 shrink-0">
          <svg viewBox="0 0 120 120" className="w-28 h-28 -rotate-90">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#eef2f1" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="54" fill="none" stroke={tone} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={circumference * (1 - filled)}
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-200 border-t-[#187B65] rounded-full animate-spin" />
            ) : (
              <span className="text-2xl font-extrabold text-[#102B2A] tabular-nums">{value === null ? "—" : value}</span>
            )}
            {trend !== null && trend !== undefined && value !== null && (
              <span className={`text-[10px] font-bold ${trend >= 0 ? "text-[#187B65]" : "text-red-500"}`}>
                {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="text-sm font-bold text-[#102B2A] leading-snug">{label}</div>
          <div className="text-[11px] text-slate-500 mt-1">{value === null ? "Not tracked — reliable data unavailable" : "0–100 · methodology below"}</div>
        </div>
      </div>

      <button onClick={() => setOpen(!open)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#187B65] hover:underline w-fit">
        {open ? <><ChevronUp className="w-3.5 h-3.5" /> Hide analysis</> : <><ChevronDown className="w-3.5 h-3.5" /> How is this calculated?</>}
      </button>

      {open && (
        <div className="mt-3 space-y-3 text-xs border-t border-slate-100 pt-3">
          <Block title="Methodology" items={formula ? [formula] : []} />
          <Block title="Evidence (live data)" items={evidence} />
          <Block title="Problems identified" items={problems} warn />
          <Block title="Recommended improvements" items={actions} good />
        </div>
      )}
    </div>
  );
}

function Block({ title, items, warn, good }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${good ? "text-[#187B65]" : warn ? "text-amber-600" : "text-slate-400"}`}>{title}</div>
      <ul className="space-y-1 text-slate-700">
        {items.slice(0, 6).map((it, i) => <li key={i}>• {it}</li>)}
      </ul>
    </div>
  );
}