import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Loader2, Navigation, Sparkles, Send, MousePointerClick, MapPinned, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import LiveCityView from "@/components/sdr/LiveCityView";


// Simple equirectangular projection onto the 3D board (Canada bbox).
const PROJ = { lat0: 57, lng0: -96, s: 0.55 };
const pt = (lat, lng) => new THREE.Vector3((lng - PROJ.lng0) * PROJ.s, 0, (PROJ.lat0 - lat) * PROJ.s);


// Soft radial glow texture shared by every halo sprite.
const glowTexture = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(84,217,174,0.9)");
  grad.addColorStop(0.4, "rgba(24,123,101,0.35)");
  grad.addColorStop(1, "rgba(24,123,101,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();



export default function NetworkMap3D({ coverageCities = [], providers = [], trafficByCity = {}, openRegions = [], territoryLinks = [] }) {
  const mountRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const [live, setLive] = useState(null);
  // The Three.js effect reads the latest selection through this ref.
  const selectedRef = useRef(null);
  selectedRef.current = selected;
  const [ask, setAsk] = useState("");
  const [rex, setRex] = useState({ loading: false, reply: "" });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !glowTexture) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    camera.position.set(0, 24, 26);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const world = new THREE.Group();
    scene.add(world);

    // Board: dark disc + polar grid.
    const board = new THREE.Mesh(
      new THREE.CircleGeometry(30, 64),
      new THREE.MeshBasicMaterial({ color: 0x04241c, transparent: true, opacity: 0.85 })
    );
    board.rotation.x = -Math.PI / 2;
    world.add(board);
    const grid = new THREE.PolarGridHelper(30, 12, 6, 64, 0x0f4a38, 0x0a3020);
    grid.material.transparent = true;
    grid.material.opacity = 0.5;
    world.add(grid);

    // City nodes + pick targets.
    const nodeGeo = new THREE.SphereGeometry(0.42, 16, 16);
    const pickGeo = new THREE.SphereGeometry(1.4, 8, 8);
    const pickMat = new THREE.MeshBasicMaterial({ visible: false });
    const picks = [];
    const addNode = (pos, color, meta) => {
      const mesh = new THREE.Mesh(nodeGeo, new THREE.MeshBasicMaterial({ color }));
      mesh.position.copy(pos);
      world.add(mesh);
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, transparent: true, opacity: 0.7, depthWrite: false }));
      halo.scale.setScalar(2.6);
      halo.position.copy(pos);
      world.add(halo);
      const pick = new THREE.Mesh(pickGeo, pickMat);
      pick.position.copy(pos);
      pick.userData = meta;
      world.add(pick);
      picks.push(pick);
      return { mesh, halo };
    };

    const nodeMap = new Map();
    coverageCities.forEach(({ name, city, state }) => {
      if (!city) return;
      const color = state === "same_day" ? 0x54d9ae : 0xc9971f;
      nodeMap.set(name, addNode(pt(city.lat, city.lng), color, { name, city, state }));
    });
    openRegions.forEach((r) => {
      const { mesh } = addNode(pt(r.lat, r.lng), 0x94a3b8, { name: r.name, city: null, state: "open" });
      mesh.material.color.setHex(0x94a3b8);
    });

    // Connections represent only a contractor's explicitly confirmed territory.
    const arcMat = new THREE.LineBasicMaterial({ color: 0x54d9ae, transparent: true, opacity: 0.7 });
    territoryLinks.forEach((link) => {
      const [aCity, bCity] = (link.cities || []).map((name) => coverageCities.find((c) => c.name.toLowerCase() === name.toLowerCase())?.city);
      if (!aCity || !bCity) return;
      const a = pt(aCity.lat, aCity.lng), b = pt(bCity.lat, bCity.lng);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      mid.y += Math.max(0.5, a.distanceTo(b) * 0.2);
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(24)), arcMat));
    });

    // Independently listed recycling facilities, never pickup partners.
    const dotGeo = new THREE.SphereGeometry(0.16, 8, 8);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0x187b65, transparent: true, opacity: 0.9 });
    providers.forEach((p) => {
      if (typeof p.lat !== "number") return;
      const d = new THREE.Mesh(dotGeo, dotMat);
      d.position.copy(pt(p.lat, p.lng));
      d.position.y = 0.3;
      world.add(d);
    });

    // Job-traffic rings.
    const rings = [];
    Object.entries(trafficByCity).forEach(([name, n]) => {
      const c = (coverageCities.find((x) => x.name === name) || {}).city;
      if (!c) return;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.9 + n * 0.25, 0.06, 8, 40),
        new THREE.MeshBasicMaterial({ color: 0x54d9ae, transparent: true, opacity: 0.8 })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.copy(pt(c.lat, c.lng));
      ring.position.y = 0.15;
      world.add(ring);
      rings.push(ring);
    });

    // Orbit controls (drag rotate, wheel/pinch zoom with cinematic glide) +
    // tap to select. The camera glides toward a target distance, and deep
    // zooms hand off to the live map via the "Live map · street view" button.
    let yaw = 0, pitch = 0.55, dist = 30, distTarget = 30, dragging = false, moved = 0, lx = 0, ly = 0;
    const pointers = new Map();
    let pinchStart = 0, pinchDist0 = 30;
    const clampDist = (d) => Math.min(60, Math.max(12, d));
    const applyView = () => {
      camera.position.set(
        dist * Math.sin(pitch) * Math.sin(yaw),
        dist * Math.cos(pitch),
        dist * Math.sin(pitch) * Math.cos(yaw)
      );
      camera.lookAt(0, 0, 0);
    };
    applyView();
    // Zoom-all-the-way-in handoff: when the camera bottoms out, the live
    // street view opens automatically — for the selected city, or the nearest
    // listed city when nothing is selected.
    let liveFired = false;
    const maybeAutoOpen = () => {
      if (liveFired) return;
      const sel = selectedRef.current;
      let target = null;
      if (sel?.city) {
        target = { lat: sel.city.lat, lng: sel.city.lng, label: sel.name, mode: "street" };
      } else {
        const nearest = coverageCities
          .filter((c) => c.city)
          .sort((a, b) => Math.hypot(a.city.lat - PROJ.lat0, a.city.lng - PROJ.lng0) - Math.hypot(b.city.lat - PROJ.lat0, b.city.lng - PROJ.lng0))[0];
        if (nearest) {
          target = { lat: nearest.city.lat, lng: nearest.city.lng, label: nearest.name, mode: "street" };
          setSelected({ name: nearest.name, city: nearest.city, state: nearest.state });
        }
      }
      if (target) { liveFired = true; setLive(target); }
    };

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const pickAt = (x, y) => {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(picks)[0];
      return hit?.object.userData || null;
    };
    const onDown = (e) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { renderer.domElement.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
      if (pointers.size === 1) {
        dragging = true; moved = 0;
        lx = e.clientX; ly = e.clientY;
      } else if (pointers.size === 2) {
        dragging = false; moved = Infinity;
        const [a, b] = [...pointers.values()];
        pinchStart = Math.hypot(a.x - b.x, a.y - b.y);
        pinchDist0 = distTarget;
      }
    };
    const onMove = (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      p.x = e.clientX; p.y = e.clientY;
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchStart > 0 && d > 0) distTarget = clampDist((pinchDist0 * pinchStart) / d);
        if (distTarget > 18) liveFired = false;
        if (distTarget <= 12.5) maybeAutoOpen();
        return;
      }
      if (!dragging) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      moved += Math.abs(dx) + Math.abs(dy);
      lx = e.clientX; ly = e.clientY;
      yaw += dx * 0.005;
      pitch = Math.min(1.35, Math.max(0.2, pitch + dy * 0.004));
      applyView();
    };
    const onUp = (e) => {
      const had = pointers.has(e.pointerId);
      pointers.delete(e.pointerId);
      if (pointers.size === 0) {
        dragging = false; pinchStart = 0;
        if (had && moved < 6) {
          const meta = pickAt(e.clientX, e.clientY);
          setSelected(meta ? { name: meta.name, city: meta.city, state: meta.state } : null);
          setRex({ loading: false, reply: "" });
        }
      } else if (pointers.size === 1) {
        const [remaining] = [...pointers.values()];
        dragging = true; moved = Infinity; pinchStart = 0;
        lx = remaining.x; ly = remaining.y;
      }
    };
    const onWheel = (e) => {
      e.preventDefault();
      distTarget = clampDist(distTarget + e.deltaY * 0.03);
      if (distTarget > 18) liveFired = false;
      if (distTarget <= 12.5) maybeAutoOpen();
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
    renderer.domElement.style.touchAction = "none";

    const resize = () => {
      const w = mount.clientWidth, h = mount.clientHeight || 420;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    let raf = 0;
    const clock = new THREE.Clock();
    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      // Cinematic zoom glide toward the wheel/pinch target distance
      if (Math.abs(dist - distTarget) > 0.02) {
        dist += (distTarget - dist) * Math.min(1, dt * 8);
        applyView();
      } else if (dist !== distTarget) {
        dist = distTarget;
        applyView();
      }
      if (!reduced && !dragging) yaw += 0.0012;
      if (!reduced && !dragging) applyView();

      if (!reduced) rings.forEach((r, i) => { r.scale.setScalar(1 + 0.08 * Math.sin(t * 2 + i)); });
      if (!reduced) nodeMap.forEach((n) => { n.halo.material.opacity = 0.55 + 0.25 * Math.sin(t * 1.5); });
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointercancel", onUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.dispose();
      scene.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [coverageCities, providers, trafficByCity, openRegions, territoryLinks]);

  const askRex = async () => {
    if (!ask.trim() || !selected?.city) return;
    setRex({ loading: true, reply: "" });
    try {
      const res = await base44.functions.invoke("recyclingAssistant", { message: ask, location: selected.name });
      setRex({ loading: false, reply: res.data?.reply || "Rex couldn't answer that just now." });
    } catch {
      setRex({ loading: false, reply: "Rex couldn't answer that just now." });
    }
  };

  const stateLabel = { same_day: "Verified territory; job acceptance required", matching: "Matching in progress", open: "Directory confirmation pending" };

  return (
    <div className="rounded-3xl overflow-hidden border border-[#187b65]/25 bg-[#051511] h-[520px] md:h-[620px] relative z-0">
      <div ref={mountRef} className="absolute inset-0" />
      {live && (
        <div className="absolute inset-0 z-20">
          <LiveCityView lat={live.lat} lng={live.lng} label={live.label} initialMode={live.mode} onClose={() => setLive(null)} className="h-full" />
        </div>
      )}

      {/* orbit hint */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full glass-dark px-3 py-1.5 text-[11px] font-semibold text-emerald-100/80">
        <MousePointerClick className="w-3 h-3 text-[#54D9AE]" /> Drag to orbit · tap a city · zoom all the way in for street view
      </div>

      {/* selected city panel + Rex */}
      {selected && (
        <div className="absolute right-3 bottom-3 left-3 md:left-auto md:bottom-3 md:top-3 md:w-72 rounded-2xl glass-dark p-4 flex flex-col gap-3 max-h-[85%] overflow-y-auto">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-white text-sm">{selected.name}</p>
              <p className={`text-[11px] font-semibold ${selected.state === "same_day" ? "text-[#54D9AE]" : selected.state === "matching" ? "text-amber-400" : "text-slate-400"}`}>
                {stateLabel[selected.state]}
              </p>
              {trafficByCity[selected.name] > 0 && (
                <p className="text-[11px] text-emerald-100/70 mt-0.5">{trafficByCity[selected.name]} open booking record{trafficByCity[selected.name] === 1 ? "" : "s"}</p>
              )}
            </div>
            <button onClick={() => setSelected(null)} className="text-emerald-100/60 hover:text-white" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>
          {selected.city && (
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selected.city.lat},${selected.city.lng}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#187b65] text-white text-xs font-bold px-3 py-2 hover:bg-[#125c4e] transition-colors"
              >
                <Navigation className="w-3 h-3" /> Directions
              </a>
              <button
                onClick={() => setLive({ lat: selected.city.lat, lng: selected.city.lng, label: selected.name })}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#54D9AE]/60 text-[#54D9AE] text-xs font-bold px-3 py-2 hover:bg-[#187b65]/25 transition-colors"
              >
                <MapPinned className="w-3 h-3" /> Live map · street view
              </button>
            </div>
          )}
          <div className="border-t border-[#187b65]/25 pt-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#54D9AE]" />
              <span className="text-[11px] font-bold text-emerald-100/90">Ask Rex about recycling here</span>
            </div>
            <div className="flex gap-2">
              <input
                value={ask}
                onChange={(e) => setAsk(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && askRex()}
                placeholder={`e.g. where can I drop off a mattress?`}
                className="min-w-0 flex-1 rounded-xl bg-[#0a3020]/70 border border-[#187b65]/30 px-3 py-2 text-xs text-white placeholder:text-emerald-100/40 focus:outline-none focus:border-[#54D9AE]"
              />
              <button
                onClick={askRex}
                disabled={rex.loading || !ask.trim()}
                className="rounded-xl bg-[#187b65] text-white px-3 py-2 disabled:opacity-50"
                aria-label="Ask Rex"
              >
                {rex.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            {rex.reply && (
              <div className="mt-2 rounded-xl bg-[#0a3020]/50 px-3 py-2 text-xs text-emerald-100/90 whitespace-pre-wrap leading-relaxed">
                {rex.reply}
              </div>
            )}
          </div>
        </div>
      )}

      {/* legend */}
      <div className="absolute left-3 bottom-3 flex flex-wrap gap-2 text-[10px] font-semibold text-emerald-100/80">
        <span className="rounded-full glass-dark px-2.5 py-1 inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#54D9AE]" /> Verified territory</span>
        <span className="rounded-full glass-dark px-2.5 py-1 inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Matching</span>
        <span className="rounded-full glass-dark px-2.5 py-1 inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-400" /> Opening</span>
      </div>
    </div>
  );
}