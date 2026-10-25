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
import PickupLocationPanel from "@/components/sdr/PickupLocationPanel";
import LiveCityView from "@/components/sdr/LiveCityView";
import { MapPinned } from "lucide-react";
import { networkRexQuestion } from "@/components/sdr/heroNetworkCopy";
import usePickupLocation from "@/hooks/usePickupLocation";

// Interactive Canadian service network with three exploration modes:
//   network — coverage layers, territories and city details (booking-ready)
//   pulse   — verified market records: contractors, open posts, rankings
//   rex     — the AI explains the map; a city selection asks Rex about it
export default function HeroCanadaBackground({ lang = "en" }) {
  const { nodes, links, coverage, demand } = useHeroNetwork();
  const [mode, setMode] = useState("network");
  const [region, setRegion] = useState(""), [selected, setSelected] = useState(""), [hover, setHover] = useState(null);
  // City currently under the view centre while zoomed in — shows its demand
  // and services automatically, without a tap.
  const [zoomCityKey, setZoomCityKey] = useState(null);
  // Deep zoom handoff: the live street map the 3D globe zooms into.
  const [live, setLive] = useState(null);
  const node = nodes.find((n) => n.key === selected);
  const zoomCity = nodes.find((n) => n.key === zoomCityKey) || null;
  const pickup = usePickupLocation();
  useEffect(() => {
    if (!pickup) return;
    setSelected(""); setHover(null); setZoomCityKey(null); setMode("network");
    setRegion(pickup.province);
  }, [pickup?.selectionId]);
  // A selected city becomes the map focus, so the globe zooms straight to it;
  // a confirmed pickup address takes priority and glides to the exact point.
  const focus = pickup
    ? { lat: pickup.lat, lng: pickup.lng, isAddress: true, instant: pickup.instant }
    : node ? { lat: node.lat, lng: node.lng } : REGIONS.find((r) => r.code === region) || null;
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
    <section id="pickup-map-experience" className="scroll-mt-4 overflow-hidden rounded-3xl border border-market-line bg-market-surface text-market-ink" aria-label={lang === "fr" ? "Réseau canadien de services interactif" : "Interactive Canadian service network"}>
      <HeroNetworkHeader lang={lang} />
      <HeroNetworkModes mode={mode} onChange={changeMode} lang={lang} />
      <div className="relative">
        <HeroNetworkScene nodes={nodes} links={links} focus={focus} selectedKey={selected} onSelect={select} onHover={setHover} onZoomCity={(n) => { setZoomCityKey(n?.key || null); if (n) base44.analytics.track({ eventName: "hero_map_zoom_city", properties: { city: n.name, mode } }); }} lang={lang} />
        {hover && !selected && <div className="pointer-events-none absolute left-3 top-2 z-10 hidden w-72 rounded-2xl border border-market-line bg-market-bg p-3 shadow-xl md:block"><HeroMapCityTooltip node={hover} availability={hover.availability} lang={lang} /></div>}
        {!live && !pickup && (zoomCity || node) && (
          <button type="button" onClick={() => { const n = zoomCity || node; setLive(n); base44.analytics.track({ eventName: "hero_map_live_view", properties: { city: n.name } }); }} className="absolute bottom-3 left-3 z-10 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-market-line bg-market-bg px-3 text-xs font-bold text-market-ink shadow-sm hover:bg-market-surface">
            <MapPinned className="h-3.5 w-3.5 text-market-accent" /> {lang === "fr" ? "Vue carte en direct" : "Live map view"}
          </button>
        )}
        {live && (
          <div className="absolute inset-0 z-20">
            <LiveCityView lat={live.lat} lng={live.lng} label={live.name} onClose={() => setLive(null)} className="h-full" />
          </div>
        )}
      </div>
      {node && <HeroNetworkSelection node={node} onClose={() => setSelected("")} lang={lang} />}
      {!node && zoomCity && !pickup && mode === "network" && <HeroNetworkSelection node={zoomCity} onClose={() => setZoomCityKey(null)} lang={lang} />}
      {pickup && <PickupLocationPanel lang={lang} />}
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