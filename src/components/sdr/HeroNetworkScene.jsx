import { useEffect, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import HeroCanadaMap2D from "@/components/sdr/HeroCanadaMap2D";
import { networkCopy } from "@/components/sdr/heroNetworkCopy";

export default function HeroNetworkScene({ nodes, links, focus, selectedKey, onSelect, onHover, lang = "en" }) {
  const t = networkCopy(lang);
  const mount = useRef(null), scene = useRef(null), data = useRef({ nodes, links });
  const callbacks = useRef({ onSelect, onHover });
  callbacks.current = { onSelect, onHover };
  data.current = { nodes, links };
  const [ready, setReady] = useState(false);
  const [touched, setTouched] = useState(false);
  // The 3D scene mounts once; later data refreshes update it in place, so
  // the view never flaps back to the 2D fallback.
  useEffect(() => {
    let cancelled = false, instance;
    setReady(false);
    const start = async () => {
      try {
        const { default: createScene } = await import("@/components/sdr/HeroCanadaGlobe");
        if (cancelled || !mount.current) return;
        instance = createScene(mount.current, { nodes: data.current.nodes, links: data.current.links, mobile: window.innerWidth < 640, onSelect: (n) => callbacks.current.onSelect(n), onHover: (n) => callbacks.current.onHover(n), onFailure: () => setReady(false) });
        if (!instance) return;
        scene.current = instance;
        setReady(true);
      } catch { if (!cancelled) setReady(false); }
    };
    const timer = setTimeout(start, 1500);
    return () => { cancelled = true; clearTimeout(timer); instance?.dispose(); scene.current = null; };
  }, []);
  useEffect(() => { if (ready) scene.current?.updateData(nodes, links); }, [nodes, links, ready]);
  useEffect(() => { if (!ready) return; if (focus) scene.current?.focusOn(focus.lat, focus.lng); else scene.current?.resetFocus(); }, [focus, ready]);
  useEffect(() => { if (ready) scene.current?.highlight(selectedKey); }, [selectedKey, ready]);
  return (
    <div className="relative h-60 w-full sm:h-72 lg:h-[24rem] xl:h-[26rem]" data-map-mode={ready ? "3d" : "2d"} onPointerDownCapture={() => setTouched(true)}>
      {!ready && <HeroCanadaMap2D nodes={nodes} links={links} focus={focus} selectedKey={selectedKey} onSelect={onSelect} lang={lang} />}
      <div ref={mount} aria-hidden="true" className={ready ? "absolute inset-0" : "invisible absolute inset-0"} />
      {ready && <div aria-hidden="true" className="hero-globe-vignette pointer-events-none absolute inset-0" />}
      {ready && (
        <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5">
          <button onClick={() => scene.current?.zoomBy(0.82)} aria-label={lang === "fr" ? "Zoomer" : "Zoom in"} className="flex h-9 w-9 items-center justify-center rounded-xl border border-market-line bg-market-bg text-market-ink shadow-sm hover:bg-market-surface active:scale-95 transition">
            <Plus className="h-4 w-4" />
          </button>
          <button onClick={() => scene.current?.zoomBy(1.22)} aria-label={lang === "fr" ? "Dézoomer" : "Zoom out"} className="flex h-9 w-9 items-center justify-center rounded-xl border border-market-line bg-market-bg text-market-ink shadow-sm hover:bg-market-surface active:scale-95 transition">
            <Minus className="h-4 w-4" />
          </button>
          <button onClick={() => { scene.current?.resetFocus(); setTouched(true); }} aria-label={lang === "fr" ? "Recentrer le globe" : "Reset view"} className="flex h-9 w-9 items-center justify-center rounded-xl border border-market-line bg-market-bg text-market-ink shadow-sm hover:bg-market-surface active:scale-95 transition">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      )}
      <span className="pointer-events-none absolute bottom-3 left-4 rounded-full border border-market-line bg-market-bg px-3 py-1 text-xs font-semibold text-market-ink">{ready ? (lang === "fr" ? "Globe 3D" : "3D globe") : t.network2d}</span>
      {ready && !touched && !selectedKey && (
        <span className={`pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-market-line bg-market-bg px-3 py-1 text-xs font-semibold text-market-ink transition-opacity duration-500 ${touched ? "opacity-0" : "opacity-100"}`}>
          {window.matchMedia("(pointer: coarse)").matches
            ? (lang === "fr" ? "Faites glisser pour tourner · Touchez une ville" : "Drag to spin · Tap a city")
            : (lang === "fr" ? "Faites glisser pour tourner · Molette pour zoomer" : "Drag to spin · Scroll to zoom · Tap a city")}
        </span>
      )}
    </div>
  );
}