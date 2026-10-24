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
import HeroNetworkModes from "@/components/sdr/HeroNetworkModes";
import HeroNetworkPulse from "@/components/sdr/HeroNetworkPulse";
import HeroNetworkRex from "@/components/sdr/HeroNetworkRex";
import { networkRexQuestion } from "@/components/sdr/heroNetworkCopy";

// Interactive Canadian service network with three exploration modes:
//   network — coverage layers, territories and city details (booking-ready)
//   pulse   — verified market records: contractors, open posts, rankings
//   rex     — the AI explains the map; a city selection asks Rex about it
export default function HeroCanadaBackground({ lang = "en" }) {
  const { nodes, links, coverage, demand } = useHeroNetwork();
  const [mode, setMode] = useState("network");
  const [region, setRegion] = useState(""), [selected, setSelected] = useState(""), [hover, setHover] = useState(null);
  const node = nodes.find((n) => n.key === selected);
  // A selected city becomes the map focus, so the globe zooms straight to it.
  const focus = node ? { lat: node.lat, lng: node.lng } : REGIONS.find((r) => r.code === region) || null;
  useEffect(() => {
    const focusRegion = (event) => { if (REGIONS.some((r) => r.code === event.detail?.province)) setRegion(event.detail.province); };
    window.addEventListener("hero-map:focus", focusRegion);
    return () => window.removeEventListener("hero-map:focus", focusRegion);
  }, []);
  const select = (n) => {
    setSelected(n.key); setHover(null); setRegion(n.city.province);
    base44.analytics.track({ eventName: "hero_map_node_click", properties: { city: n.name, layer: n.layer, mode } });
    // In Ask Rex mode, a city selection asks Rex about that municipality.
    if (mode === "rex") window.dispatchEvent(new CustomEvent("rex:open", { detail: { question: networkRexQuestion(n, lang) } }));
  };
  const changeMode = (next) => {
    setMode(next);
    base44.analytics.track({ eventName: "hero_map_mode_change", properties: { mode: next } });
  };
  return (
    <section className="overflow-hidden rounded-3xl border border-market-line bg-market-surface text-market-ink" aria-label={lang === "fr" ? "Réseau canadien de services interactif" : "Interactive Canadian service network"}>
      <HeroNetworkHeader lang={lang} />
      <HeroNetworkModes mode={mode} onChange={changeMode} lang={lang} />
      <div className="relative">
        <HeroNetworkScene nodes={nodes} links={links} focus={focus} selectedKey={selected} onSelect={select} onHover={setHover} lang={lang} />
        {hover && !selected && <div className="pointer-events-none absolute left-3 top-2 z-10 hidden w-72 rounded-2xl border border-market-line bg-market-bg p-3 shadow-xl md:block"><HeroMapCityTooltip node={hover} availability={hover.availability} lang={lang} /></div>}
      </div>
      {node && <HeroNetworkSelection node={node} onClose={() => setSelected("")} lang={lang} />}
      {mode === "network" && (
        <>
          <HeroNetworkControls nodes={nodes} region={region} selected={selected} lang={lang} onRegion={(value) => { setRegion(value); setSelected(""); setHover(null); }} onCity={(key) => { const n = nodes.find((n) => n.key === key); if (n) select(n); else setSelected(""); }} />
          <HeroNetworkLegend nodes={nodes} selected={selected} lang={lang} />
          <HeroNetworkSummary coverage={coverage} demand={demand} lang={lang} />
        </>
      )}
      {mode === "pulse" && <HeroNetworkPulse coverage={coverage} demand={demand} nodes={nodes} onSelect={select} lang={lang} />}
      {mode === "rex" && <HeroNetworkRex node={node} lang={lang} />}
    </section>
  );
}