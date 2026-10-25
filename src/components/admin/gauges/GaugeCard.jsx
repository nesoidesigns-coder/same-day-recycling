import { useState } from "react";
import { Info, Maximize2, Clock, X } from "lucide-react";

const STATUS_COLOR = { ok: "text-li-infra", warn: "text-li-amber", bad: "text-li-red", Verified: "text-li-infra" };

export default function GaugeCard({ title, tooltip, updated, onOpen, status, children, wide }) {
  const [tipOpen, setTipOpen] = useState(false);

  return (
    <div className={`relative rounded-[14px] border border-li-steel bg-white p-5 shadow-sm hover:shadow-md hover:border-li-mint/60 transition-all flex flex-col ${wide ? "sm:col-span-2 lg:col-span-1" : ""}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="text-sm font-bold text-li-carbon leading-snug">{title}</div>
        <div className="flex items-center gap-1 shrink-0">
          {tooltip && (
            <div className="relative">
              <button
                onClick={() => setTipOpen(!tipOpen)}
                onBlur={() => setTipOpen(false)}
                aria-label={`How ${title} is calculated`}
                className="p-1 rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-100"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              {tipOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 z-30 rounded-xl bg-slate-900 text-white text-[11px] leading-relaxed p-3 shadow-xl">
                  <button onClick={() => setTipOpen(false)} aria-label="Close" className="absolute top-1.5 right-1.5 text-slate-500 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                  {tooltip}
                </div>
              )}
            </div>
          )}
          {onOpen && (
            <button
              onClick={onOpen}
              aria-label={`Open details for ${title}`}
              className="p-1 rounded-full text-slate-300 hover:text-emerald-600 hover:bg-emerald-50"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1">{children}</div>
      <div className="mt-3 pt-3 border-t border-li-steel/60 flex items-center justify-between gap-2 font-plex text-[11px] text-li-slate">
        <span className="flex items-center gap-1 truncate"><Clock className="w-3 h-3 shrink-0" />{updated}</span>
        {status && <span className={`font-bold shrink-0 ${STATUS_COLOR[status] || "text-slate-500"}`}>{status}</span>}
      </div>
    </div>
  );
}