import { MapPin } from "lucide-react";
import HeroMapCityStats from "@/components/sdr/HeroMapCityStats";
import { networkCopy } from "@/components/sdr/heroNetworkCopy";

import { COVERAGE_COPY } from "@/components/sdr/coveragePresentation";
export const AVAIL_META = COVERAGE_COPY;
export default function HeroMapCityTooltip({ node, availability, lang = "en" }) {
  const state = AVAIL_META[availability], t = networkCopy(lang);
  return (
    <div className="pt-2 text-market-ink">
      <h3 className="flex items-center gap-2 pr-10 font-heading text-base font-bold"><MapPin className="h-4 w-4 text-market-accent" />{node.name}</h3>
      <p className={`mt-2 text-sm font-bold ${state?.tone || "text-market-muted"}`}>{(lang === "fr" ? state?.frLabel : state?.label) || t.unchecked}</p>
      <p className="mt-1 text-sm leading-relaxed text-market-muted">{(lang === "fr" ? state?.fr : state?.note) || t.noCapacity}</p>
      <HeroMapCityStats node={node} lang={lang} />
    </div>
  );
}