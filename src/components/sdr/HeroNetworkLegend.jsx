import { LAYER_HEX } from "@/lib/canadaOutline";
import { networkCopy } from "@/components/sdr/heroNetworkCopy";

const LAYERS = ["verified", "demand", "matching", "recruiting", "selected", "ai"];
export default function HeroNetworkLegend({ nodes, selected, lang = "en" }) {
  const t = networkCopy(lang);
  return (
    <section className="border-t border-market-line px-4 py-3" aria-label={t.legend}>
      <h3 className="mb-2 text-xs font-semibold text-market-muted">{t.legend}</h3>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {LAYERS.map((key) => {
          const active = key === "selected" ? Boolean(selected) : key !== "ai" && nodes.some((node) => node.layer === key || key === "recruiting" && node.layer === "unknown");
          const status = key === "ai" ? t.notConnected : key === "selected" ? t.selectRegion : lang === "fr" ? "aucune observation affichée" : "no observations displayed";
          return <li key={key} className="flex items-start gap-2 text-xs leading-relaxed"><span aria-hidden="true" className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: active ? LAYER_HEX[key] : LAYER_HEX.unknown }} /><span className={active ? "text-market-ink" : "text-market-muted"}>{t[key]}{!active && <span className="block">{status}</span>}</span></li>;
        })}
      </ul>
    </section>
  );
}