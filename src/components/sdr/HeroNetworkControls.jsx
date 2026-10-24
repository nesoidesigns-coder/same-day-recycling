import { REGIONS } from "@/lib/regions";
import { networkCopy, networkRegionName } from "@/components/sdr/heroNetworkCopy";

export default function HeroNetworkControls({ nodes, region, selected, onRegion, onCity, lang = "en" }) {
  const t = networkCopy(lang);
  const control = "mt-1.5 min-h-11 w-full min-w-0 rounded-xl border border-market-line bg-market-bg px-3 py-2 text-sm font-medium text-market-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-market-ink";
  return (
    <div className="grid grid-cols-2 gap-2.5 border-t border-market-line px-4 py-2.5 sm:py-3">
      <label className="min-w-0 text-xs font-semibold text-market-muted">{t.region}<select className={control} value={region} onChange={(event) => onRegion(event.target.value)}><option value="">{t.canada}</option>{REGIONS.map((r) => <option key={r.code} value={r.code}>{networkRegionName(r, lang)}</option>)}</select></label>
      <label className="min-w-0 text-xs font-semibold text-market-muted">{t.city}<select className={control} value={selected} onChange={(event) => onCity(event.target.value)}><option value="">{t.chooseCity}</option>{nodes.map((node) => <option key={node.key} value={node.key}>{node.name}</option>)}</select></label>
    </div>
  );
}