import { useEffect, useRef, useState } from "react";
import HeroCanadaMap2D from "@/components/sdr/HeroCanadaMap2D";
import { networkCopy } from "@/components/sdr/heroNetworkCopy";

export default function HeroNetworkScene({ nodes, links, focus, selectedKey, onSelect, onHover, lang = "en" }) {
  const t = networkCopy(lang);
  const mount = useRef(null), scene = useRef(null), callbacks = useRef({ onSelect, onHover });
  const [ready, setReady] = useState(false);
  const [touched, setTouched] = useState(false);
  callbacks.current = { onSelect, onHover };
  useEffect(() => {
    let cancelled = false, instance;
    setReady(false);
    const start = async () => {
      try {
        const { default: createScene } = await import("@/components/sdr/HeroCanadaGlobe");
        if (cancelled || !mount.current) return;
        instance = createScene(mount.current, { nodes, links, mobile: window.innerWidth < 640, onSelect: (n) => callbacks.current.onSelect(n), onHover: (n) => callbacks.current.onHover(n), onFailure: () => setReady(false) });
        if (!instance) return;
        scene.current = instance;
        setReady(true);
      } catch { if (!cancelled) setReady(false); }
    };
    const timer = setTimeout(start, 1500);
    return () => { cancelled = true; clearTimeout(timer); instance?.dispose(); scene.current = null; };
  }, [nodes, links]);
  useEffect(() => { if (!ready) return; if (focus) scene.current?.focusOn(focus.lat, focus.lng); else scene.current?.resetFocus(); }, [focus, ready]);
  useEffect(() => { if (ready) scene.current?.highlight(selectedKey); }, [selectedKey, ready]);
  return (
    <div className="relative h-72 w-full sm:h-96 lg:h-[28rem] xl:h-[30rem]" data-map-mode={ready ? "3d" : "2d"} onPointerDownCapture={() => setTouched(true)}>
      {!ready && <HeroCanadaMap2D nodes={nodes} links={links} focus={focus} selectedKey={selectedKey} onSelect={onSelect} lang={lang} />}
      <div ref={mount} aria-hidden="true" className={ready ? "absolute inset-0" : "invisible absolute inset-0"} />
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