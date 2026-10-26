import { ChevronDown, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import MetricGauge from "@/components/os/MetricGauge";

// Coordinated circular pulse gauge — the single visual language for both
// homepage gauges. Shows a normalized 0-100 index, trend direction and data
// freshness, with a native <details> info panel for methodology and sources.
// Arc animates only when the value changes (CSS transition); honours
// prefers-reduced-motion via the motion-reduce variant.


const TONES = {
  dark: {
    card: "border-white/10 bg-white/[0.06]",
    title: "text-white",
    sub: "text-white/60",
    track: "rgba(255,255,255,0.12)",
    arc: "#2FD9C8",
    center: "#FFFFFF",
    dim: "rgba(255,255,255,0.7)",
    chip: "border-white/15 bg-white/[0.06] text-white/70",
    panel: "border-white/10 bg-white/[0.04] text-white/70",
    divider: "border-white/10",
  },
  light: {
    card: "border-li-steel bg-white",
    title: "text-li-carbon",
    sub: "text-li-slate",
    track: "hsl(160 37% 42% / 0.14)",
    arc: "hsl(189 94% 35%)",
    center: "hsl(168 24% 12%)",
    dim: "hsl(160 15% 42%)",
    chip: "border-li-steel bg-li-cloud text-li-slate",
    panel: "border-li-steel bg-li-cloud text-li-slate",
    divider: "border-li-steel",
  },
};

const TREND_ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus };
const TREND_LABEL = { up: "Rising", down: "Cooling", flat: "Steady" };

export default function PulseRing({
  title,
  subtitle,
  index,
  trend,
  freshness: fresh,
  loading = false,
  tone = "light",
  methodology,
  source,
  coverage,
  children,
}) {
  const t = TONES[tone] || TONES.light;
  const empty = !loading && index == null;
  const shown = loading ? null : empty ? null : index;
  const TrendIcon = trend ? TREND_ICON[trend] : null;

  return (
    <div className={`rounded-[24px] border p-5 md:p-7 ${t.card}`}>
      <h3 className={`text-lg md:text-xl font-bold tracking-tight ${t.title}`}>{title}</h3>
      {subtitle && <p className={`mt-1 text-sm ${t.sub}`}>{subtitle}</p>}

      <div className="relative mx-auto mt-5 w-full max-w-[240px]">
        <MetricGauge value={shown} display={shown} max={100} unit={empty ? "" : "of 100"} label={title} appearance={tone === "dark" ? "dark" : "light"} loading={loading} unavailable={empty} size={240}>
          {empty && <span className="text-xs font-semibold text-muted-foreground">Awaiting verified signals</span>}
        </MetricGauge>
      </div>

      <div className={`mt-4 flex flex-wrap items-center justify-center gap-2 text-xs`}>
        {trend && !loading && !empty && (
          <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 font-semibold ${t.chip}`}>
            <TrendIcon className="w-3.5 h-3.5" /> {TREND_LABEL[trend]}
          </span>
        )}
        {fresh && (
          <span className={`inline-flex items-center rounded-full border px-3 py-1 font-plex font-medium ${t.chip}`}>Updated {fresh}</span>
        )}
      </div>

      {children && <div className="mt-5">{children}</div>}

      <details className={`group mt-5 rounded-xl border px-4 py-3 ${t.panel}`}>
        <summary className="flex cursor-pointer items-center justify-between gap-2 text-xs font-semibold select-none">
          How this number is built
          <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className={`mt-3 space-y-2 text-xs leading-relaxed ${t.sub}`}>
          {methodology && <p>{methodology}</p>}
          {source && <p className={`font-plex ${t.sub}`}><span className="font-semibold">Source:</span> {source}</p>}
          {coverage && <p className={`font-plex ${t.sub}`}><span className="font-semibold">Sample coverage:</span> {coverage}</p>}
          {empty && <p>When no verified signals exist for this selection, the gauge says so rather than showing zero — no numbers are invented.</p>}
        </div>
      </details>
    </div>
  );
}