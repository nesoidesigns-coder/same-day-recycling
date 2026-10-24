import { Network, Activity, Sparkles } from "lucide-react";
import { networkCopy } from "@/components/sdr/heroNetworkCopy";

const MODES = [
  ["network", Network],
  ["pulse", Activity],
  ["rex", Sparkles],
];

export default function HeroNetworkModes({ mode, onChange, lang = "en" }) {
  const t = networkCopy(lang);
  return (
    <div className="flex gap-1 border-b border-market-line px-3" role="tablist" aria-label={lang === "fr" ? "Modes d’exploration" : "Exploration modes"}>
      {MODES.map(([key, Icon]) => (
        <button
          key={key}
          role="tab"
          aria-selected={mode === key}
          onClick={() => onChange(key)}
          className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-t-lg px-2 text-[13px] font-bold transition-colors sm:text-sm ${
            mode === key
              ? "border-b-2 border-[#54D9AE] bg-white/5 text-market-ink"
              : "border-b-2 border-transparent text-market-muted hover:text-market-ink"
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{key === "network" ? t.modeNetwork : key === "pulse" ? t.modePulse : t.modeRex}</span>
        </button>
      ))}
    </div>
  );
}