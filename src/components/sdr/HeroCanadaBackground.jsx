import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { REGIONS } from "@/lib/regions";
import HeroNetworkControls from "@/components/sdr/HeroNetworkControls";
import HeroNetworkLegend from "@/components/sdr/HeroNetworkLegend";
import HeroNetworkSummary from "@/components/sdr/HeroNetworkSummary";
import useHeroNetwork from "@/components/sdr/useHeroNetwork";
import HeroNetworkHeader from "@/components/sdr/HeroNetworkHeader";
import HeroNetworkScene from "@/components/sdr/HeroNetworkScene";
import HeroNetworkSelection from "@/components/sdr/HeroNetworkSelection";
import HeroMapCityTooltip from "@/components/sdr/HeroMapCityTooltip";

export default function HeroCanadaBackground({ lang = "en" }) {
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
    <section className="overflow-hidden rounded-3xl border border-market-line bg-market-surface text-market-ink" aria-label={lang === "fr" ? "Réseau canadien de services interactif" : "Interactive Canadian service network"}>
      <HeroNetworkHeader lang={lang} />
      <div className="relative">
        <HeroNetworkScene nodes={nodes} links={links} focus={focus} selectedKey={selected} onSelect={select} onHover={setHover} lang={lang} />
        {hover && !selected && <div className="pointer-events-none absolute left-3 top-2 z-10 hidden w-72 rounded-2xl border border-market-line bg-market-bg p-3 shadow-xl md:block"><HeroMapCityTooltip node={hover} availability={hover.availability} lang={lang} /></div>}
      </div>
      <HeroNetworkControls nodes={nodes} region={region} selected={selected} lang={lang} onRegion={(value) => { setRegion(value); setSelected(""); setHover(null); }} onCity={(key) => { const n = nodes.find((n) => n.key === key); if (n) select(n); else setSelected(""); }} />
      {node && <HeroNetworkSelection node={node} onClose={() => setSelected("")} lang={lang} />}
      <HeroNetworkLegend nodes={nodes} selected={selected} lang={lang} />
      <HeroNetworkSummary coverage={coverage} demand={demand} lang={lang} />
    </section>
  );
}