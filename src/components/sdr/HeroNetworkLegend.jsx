import { LAYER_HEX } from "@/lib/canadaOutline";
import { networkCopy } from "@/components/sdr/heroNetworkCopy";

const LAYERS = ["verified", "demand", "matching", "recruiting", "selected", "ai"];
export default function HeroNetworkLegend({ nodes, selected, lang = "en" }) {
  const t = networkCopy(lang);
  return (
    <section className="border-t border-market-line px-4 py-2.5 sm:py-3" aria-label={t.legend}>
      <h3 className="sr-only">{t.legend}</h3>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {LAYERS.map((key) => {
          const active = key === "selected" ? Boolean(selected) : key !== "ai" && nodes.some((node) => node.layer === key || key === "recruiting" && node.layer === "unknown");
          const status = key === "ai" ? t.notConnected : key === "selected" ? t.selectRegion : lang === "fr" ? "aucune observation affichée" : "no observations displayed";
          return <li key={key} className="flex items-center gap-1.5 text-[11px] leading-snug sm:text-xs"><span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: active ? LAYER_HEX[key] : LAYER_HEX.unknown }} /><span className={active ? "font-medium text-market-ink" : "text-market-muted"}>{t[key]}</span>{!active && <span className="hidden xl:inline text-market-muted">{status}</span>}</li>;
        })}
      </ul>
    </section>
  );
}