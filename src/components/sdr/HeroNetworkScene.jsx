import { useEffect, useRef, useState } from "react";
import HeroCanadaMap2D from "@/components/sdr/HeroCanadaMap2D";

export default function HeroNetworkScene({ nodes, links, focus, selectedKey, onSelect, onHover }) {
  const mount = useRef(null), scene = useRef(null), callbacks = useRef({ onSelect, onHover });
  const [ready, setReady] = useState(false);
  callbacks.current = { onSelect, onHover };
  useEffect(() => {
    let cancelled = false, instance;
    setReady(false);
    const start = async () => {
      try {
        const { default: createScene } = await import("@/components/sdr/HeroCanadaMap3D");
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
    <div className="relative h-64 w-full sm:h-80 lg:h-96" data-map-mode={ready ? "3d" : "2d"}>
      {!ready && <HeroCanadaMap2D nodes={nodes} links={links} focus={focus} selectedKey={selectedKey} onSelect={onSelect} />}
      <div ref={mount} aria-hidden="true" className={ready ? "absolute inset-0" : "invisible absolute inset-0"} />
      <span className="pointer-events-none absolute bottom-2 left-3 rounded-full bg-market-bg px-2 py-1 text-xs font-semibold text-market-ink">{ready ? "3D network" : "Interactive 2D map"}</span>
    </div>
  );
}