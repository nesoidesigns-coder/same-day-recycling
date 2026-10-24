import { MapPin } from "lucide-react";
import HeroMapCityStats from "@/components/sdr/HeroMapCityStats";

import { COVERAGE_COPY } from "@/components/sdr/coveragePresentation";
export const AVAIL_META = COVERAGE_COPY;
export default function HeroMapCityTooltip({ node, availability }) {
  const state = AVAIL_META[availability];
  return (
    <div className="pt-2 text-market-ink">
      <h3 className="flex items-center gap-2 pr-10 font-heading text-base font-bold"><MapPin className="h-4 w-4 text-market-accent" />{node.name}</h3>
      <p className={`mt-2 text-sm font-bold ${state?.tone || "text-market-muted"}`}>{state?.label || "Coverage not yet checked"}</p>
      <p className="mt-1 text-sm leading-relaxed text-market-muted">{state?.note || "No contractor capacity or appointment is assumed while the source is unavailable."}</p>
      <HeroMapCityStats node={node} />
    </div>
  );
}