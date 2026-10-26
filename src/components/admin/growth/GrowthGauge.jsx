import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import MetricGauge from "@/components/os/MetricGauge";
import { OS_COLORS } from "@/components/os/gaugeCore";

// One Growth Intelligence gauge: big ring score plus an expandable card that
// documents the methodology, shows the supporting evidence, the identified
// problems and the recommended improvements. Value null = not tracked
// (never estimated).
export default function GrowthGauge({ label, value, loading, trend, formula, evidence, problems, actions }) {
  const [open, setOpen] = useState(false);
  const tone = value == null ? OS_COLORS.silver : value >= 70 ? OS_COLORS.green : value >= 40 ? OS_COLORS.amber : OS_COLORS.coral;

  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 flex flex-col">
      <div className="flex items-center gap-4">
        <div className="relative w-28 h-28 shrink-0">
          <MetricGauge value={value} loading={loading} label={label} color={tone} size={112} />
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center justify-center">
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