import { money } from "@/components/si/siShared";
import OSIntelligenceGauge from "@/components/os/OSIntelligenceGauge";
import { OS_COLORS } from "@/components/os/gaugeCore";

const TIER_ORDER = [["minimum_pickup", "Minimum pickup"], ["eighth_truck", "1/8 truck"], ["quarter_truck", "1/4 truck"], ["half_truck", "1/2 truck"], ["three_quarter_truck", "3/4 truck"], ["full_truck", "Full truck"]];
export default function PriceIntelligenceGauge({ prices, cityLabel, generatedAt, className = "" }) {
  const tiers = TIER_ORDER.map(([key, label]) => ({ key, label, price: Number(prices?.[key]) })).filter((tier) => Number.isFinite(tier.price) && tier.price > 0);
  const available = tiers.length >= 2;
  const min = available ? tiers[0].price : 0, max = available ? tiers[tiers.length - 1].price : 0;
  return <figure className={`m-0 ${className}`}>
    <OSIntelligenceGauge size="feature" appearance="light" ariaLabel={`Published price scale${cityLabel ? ` for ${cityLabel}` : ""}`} center={{ value: available ? `From ${money(min)}` : "—", status: available ? `Starting pickup price · ${cityLabel || "platform rate"}` : "Price scale not available yet" }} layers={[
      { type: "dial", radius: 0.96, ticks: 48, tickMajorEvery: 4, ringOpacity: 0.22 },
      { type: "arc", r0: 0.7, r1: 0.75, a0: 50, spanDeg: available ? 260 : null, color: OS_COLORS.green },
      ...(available ? [{ type: "nodes", radius: 0.725, items: tiers.map((tier, index) => ({ key: tier.key, angle: 50 + ((tier.price - min) / Math.max(1, max - min)) * 260, share: index === 0 ? 0.7 : 0.25, color: index === 0 ? OS_COLORS.green : OS_COLORS.ink, title: `${tier.label} · ${money(tier.price)}` })) }] : []),
    ]} />
    <figcaption>
      {available && <div className="flex justify-between text-xs font-semibold text-si-muted"><span>{money(min)}</span><span>{money(max)}</span></div>}
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-si-muted sm:grid-cols-3">
        {tiers.map((tier) => <div key={tier.key} className="flex items-baseline justify-between gap-2 border-b border-si-line pb-1"><dt>{tier.label}</dt><dd className="metric m-0 text-si-ink">{money(tier.price)}</dd></div>)}
      </dl>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 font-plex text-xs text-si-muted"><span>Platform published rates{cityLabel ? ` · ${cityLabel}` : ""}</span>{generatedAt && <span>· Updated {new Date(generatedAt).toLocaleDateString("en-CA")}</span>}</div>
    </figcaption>
    <table className="sr-only"><caption>Published price scale</caption><tbody>{tiers.map((tier) => <tr key={tier.key}><th scope="row">{tier.label}</th><td>{money(tier.price)}</td></tr>)}</tbody></table>
  </figure>;
}