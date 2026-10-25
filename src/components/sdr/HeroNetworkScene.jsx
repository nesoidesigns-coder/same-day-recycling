import { useEffect, useRef, useState } from "react";
import { Loader2, Minus, Plus, RotateCcw } from "lucide-react";
import usePickupLocation from "@/hooks/usePickupLocation";
import { pickupLocationActions } from "@/lib/pickupLocationStore";

export default function HeroNetworkScene({ nodes, links, focus, selectedKey, onSelect, onHover, onZoomCity, lang = "en" }) {
  const pickup = usePickupLocation();
  const mount = useRef(null), scene = useRef(null), data = useRef({ nodes, links });
  const callbacks = useRef({ onSelect, onHover, onZoomCity });
  callbacks.current = { onSelect, onHover, onZoomCity };
  data.current = { nodes, links };
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false);
  const [touched, setTouched] = useState(false);
  const focusLat = focus?.lat, focusLng = focus?.lng;
  useEffect(() => {
    let cancelled = false, instance;
    setReady(false); setFailed(false);
    const unavailable = () => { if (!cancelled) { setReady(false); setFailed(true); } };
    const start = async () => {
      try {
        const { default: createScene } = await import("@/components/sdr/HeroCanadaGlobe");
        if (cancelled || !mount.current) return;
        instance = createScene(mount.current, { nodes: data.current.nodes, links: data.current.links, mobile: window.innerWidth < 640, onSelect: (n) => callbacks.current.onSelect(n), onHover: (n) => callbacks.current.onHover(n), onZoomCity: (n) => callbacks.current.onZoomCity?.(n), onFailure: unavailable, onCameraChange: (camera) => pickupLocationActions.setCamera("globe", camera) });
        if (!instance) { unavailable(); return; }
        scene.current = instance;
        setReady(true);
      } catch (error) { console.error("Unable to load the 3D globe", error); unavailable(); }
    };
    start();
    return () => { cancelled = true; instance?.dispose(); scene.current = null; };
  }, []);
  useEffect(() => { if (ready) scene.current?.updateData(nodes, links); }, [nodes, links, ready]);
  const focusIsAddress = !!focus?.isAddress, focusInstant = !!focus?.instant;
  useEffect(() => {
    if (!ready) return;
    if (Number.isFinite(focusLat) && Number.isFinite(focusLng)) {
      // A confirmed pickup address glides deeper and drops the glowing marker;
      // city and region selections keep the regular focus behaviour.
      if (focusIsAddress) scene.current?.focusAddress(focusLat, focusLng, focusInstant);
      else scene.current?.focusOn(focusLat, focusLng);
    } else scene.current?.resetFocus();
  }, [focusLat, focusLng, focusIsAddress, focusInstant, ready]);
  const pickupLat = pickup?.lat, pickupLng = pickup?.lng;
  useEffect(() => { if (ready) scene.current?.setPickup(pickupLat, pickupLng); }, [pickupLat, pickupLng, ready]);
  useEffect(() => { if (ready) scene.current?.highlight(selectedKey); }, [selectedKey, ready]);
  return (
    <div className="relative h-60 w-full sm:h-72 lg:h-[24rem] xl:h-[26rem]" data-map-mode={ready ? "3d" : failed ? "unavailable" : "loading"} onPointerDownCapture={() => setTouched(true)}>
      <div ref={mount} aria-hidden="true" className={ready ? "absolute inset-0" : "invisible absolute inset-0"} />
      {!ready && <div role="status" className="absolute inset-0 flex items-center justify-center gap-2 px-6 text-center text-sm text-market-muted">{!failed && <Loader2 className="h-5 w-5 shrink-0 animate-spin" />}{failed ? (lang === "fr" ? "Le globe 3D nécessite WebGL. Les options de ville restent disponibles ci-dessous." : "The 3D globe needs WebGL. City options are still available below.") : (lang === "fr" ? "Chargement du globe 3D…" : "Loading 3D globe…")}</div>}
      {ready && (
        <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5">
          <button onClick={() => scene.current?.zoomBy(0.82)} aria-label={lang === "fr" ? "Zoomer" : "Zoom in"} className="flex h-9 w-9 items-center justify-center rounded-xl border border-market-line bg-market-bg text-market-ink shadow-sm hover:bg-market-surface active:scale-95 transition">
            <Plus className="h-4 w-4" />
          </button>
          <button onClick={() => scene.current?.zoomBy(1.22)} aria-label={lang === "fr" ? "Dézoomer" : "Zoom out"} className="flex h-9 w-9 items-center justify-center rounded-xl border border-market-line bg-market-bg text-market-ink shadow-sm hover:bg-market-surface active:scale-95 transition">
            <Minus className="h-4 w-4" />
          </button>
          <button onClick={() => { if (pickup) scene.current?.focusAddress(pickup.lat, pickup.lng); else scene.current?.resetFocus(); setTouched(true); }} aria-label={lang === "fr" ? "Recentrer le globe" : "Reset view"} className="flex h-9 w-9 items-center justify-center rounded-xl border border-market-line bg-market-bg text-market-ink shadow-sm hover:bg-market-surface active:scale-95 transition">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      )}
      {ready && <span className="pointer-events-none absolute bottom-3 left-4 rounded-full border border-market-line bg-market-bg px-3 py-1 text-xs font-semibold text-market-ink">{lang === "fr" ? "Globe 3D" : "3D globe"}</span>}
      {ready && !touched && !selectedKey && (
        <span className={`pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full border border-market-line bg-market-bg px-3 py-1 text-xs font-semibold text-market-ink transition-opacity duration-500 ${touched ? "opacity-0" : "opacity-100"}`}>
          {window.matchMedia("(pointer: coarse)").matches
            ? (lang === "fr" ? "Rotation 360° · Pincez pour zoomer" : "360° drag · Pinch to zoom")
            : (lang === "fr" ? "Faites glisser pour tourner · Molette pour zoomer" : "Drag to spin · Scroll to zoom · Tap a city")}
        </span>
      )}
    </div>
  );
}