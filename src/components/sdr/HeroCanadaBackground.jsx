import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { REGIONS } from "@/lib/regions";
import { GEOGRAPHY_SOURCE } from "@/lib/canadaOutline";
import useHeroNetwork from "@/components/sdr/useHeroNetwork";
import HeroNetworkHeader from "@/components/sdr/HeroNetworkHeader";
import HeroNetworkScene from "@/components/sdr/HeroNetworkScene";
import HeroNetworkSelection from "@/components/sdr/HeroNetworkSelection";
import HeroMapCityTooltip from "@/components/sdr/HeroMapCityTooltip";

export default function HeroCanadaBackground() {
  const { nodes, links, coverage, demand } = useHeroNetwork();
  const [region, setRegion] = useState(""), [selected, setSelected] = useState(""), [hover, setHover] = useState(null);
  const focus = REGIONS.find((r) => r.code === region) || null;
  const node = nodes.find((n) => n.key === selected);
  useEffect(() => {
    const focusRegion = (event) => { if (REGIONS.some((r) => r.code === event.detail?.province)) setRegion(event.detail.province); };
    window.addEventListener("hero-map:focus", focusRegion);
    return () => window.removeEventListener("hero-map:focus", focusRegion);
  }, []);
  const select = (n) => {
    setSelected(n.key); setHover(null); setRegion(n.city.province);
    base44.analytics.track({ eventName: "hero_map_node_click", properties: { city: n.name, layer: n.layer } });
  };
  return (
    <section className="overflow-hidden rounded-3xl border border-market-line bg-market-surface text-market-ink" aria-label="Interactive Canadian service network">
      <HeroNetworkHeader coverage={coverage} demand={demand} />
      <div className="grid grid-cols-2 gap-3 px-4 pt-4 text-xs font-semibold">
        <label>Province or territory<select className="mt-1 min-h-11 w-full rounded-xl border border-market-line bg-market-bg p-2 text-market-ink" value={region} onChange={(e) => setRegion(e.target.value)}><option value="">All Canada</option>{REGIONS.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}</select></label>
        <label>Explore a city<select className="mt-1 min-h-11 w-full rounded-xl border border-market-line bg-market-bg p-2 text-market-ink" value={selected} onChange={(e) => { const n = nodes.find((n) => n.key === e.target.value); if (n) select(n); else setSelected(""); }}><option value="">Select a city</option>{nodes.map((n) => <option key={n.key} value={n.key}>{n.name}</option>)}</select></label>
      </div>
      <div className="relative">
        <HeroNetworkScene nodes={nodes} links={links} focus={focus} selectedKey={selected} onSelect={select} onHover={setHover} />
        {hover && !selected && <div className="pointer-events-none absolute left-3 top-2 hidden w-72 rounded-xl border border-market-line bg-market-bg p-3 shadow-xl md:block"><HeroMapCityTooltip node={hover} availability={hover.availability} /></div>}
      </div>
      {node && <HeroNetworkSelection node={node} onClose={() => setSelected("")} />}
      <div className="space-y-2 border-t border-market-line px-4 py-3 text-xs leading-relaxed text-market-muted">
        <p>{coverage.error ? "Coverage unavailable; no capacity assumed." : !coverage.loaded ? "Checking contractor territories…" : `Territory snapshot: ${new Date(coverage.generatedAt).toLocaleString("en-CA", { timeZone: "America/Vancouver", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} Pacific.`}</p>
        <p>Municipal nodes are not coverage radii. Lines, when present, mean shared confirmed contractor territories, not live journeys. Postal focus identifies the province, not an exact address.</p>
        {demand.isError && <p>Public-post source unavailable; no demand count assumed.</p>}
        <a href={GEOGRAPHY_SOURCE} target="_blank" rel="noreferrer" className="inline-block py-1 underline">Geography: Natural Earth, public domain</a>
      </div>
    </section>
  );
}