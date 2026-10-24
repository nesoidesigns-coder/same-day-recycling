import * as THREE from "three";

// Simplified, geographically recognizable Canada outline ([lat, lng] pairs).
// Mainland silhouette + Vancouver Island + Newfoundland. Accurate enough to
// read as Canada at hero scale — never a generic globe.
const MAINLAND = [
  [69.6,-140],[69.9,-133],[70.2,-126],[69.6,-118],[68.3,-113.5],[68.4,-109],[68.2,-105.5],
  [67.9,-101],[68.5,-97],[69.4,-94.6],
  [65,-87],[63.3,-90.3],[61.1,-94],[58.7,-94.2],[57,-92.5],[56.3,-92.4],
  [56,-87.7],[55.3,-85.5],[52.9,-82.4],[51.3,-80.4],
  [51.4,-79],[53,-78.8],[55,-77.5],[57,-77.3],[59.5,-77.5],[62.5,-78],
  [61.5,-74],[60.5,-69.7],[59.5,-69.5],[58.5,-68.3],[58,-68.5],[59,-67.5],[60.5,-67.3],[61.3,-66.5],[60.5,-64.4],
  [59.5,-63.8],[57.5,-63.5],[55.5,-60.5],[54.5,-58.5],[52.5,-55.8],[51.4,-57.1],
  [50.2,-60.5],[50.2,-63],[50.2,-66.5],[49.2,-68.2],[48.1,-69.7],[48.4,-70.6],[46.8,-71.2],
  [46.7,-71.1],[47,-70.5],[47.8,-69.5],[48.5,-68.3],[48.8,-67.5],[48.9,-66],[48.9,-64.4],
  [48.5,-64.2],[48.2,-65],[47.7,-66.3],[47.4,-64.9],[46.9,-64.6],[46.3,-64.1],[46,-63.2],
  [45.2,-63.3],[44.9,-63.4],[44.5,-64.1],[44,-64.8],[43.7,-65.5],[43.9,-66.1],[44.2,-64.2],[45,-63.6],[45.8,-63.3],
  [45.9,-64.1],[45.4,-65.5],[45.1,-66.3],[44.8,-67],[45.2,-67.4],[46.1,-68.2],[47.4,-69.2],[45,-70.5],
  [45,-71.2],[45.5,-73.6],[45,-74.5],[44.2,-77.5],[43.7,-79.4],[42.3,-82.9],[43,-82.4],[44.5,-81.5],[45.8,-82.5],[46.5,-84.4],[48.4,-89.2],[48,-89.5],
  [48.4,-90.5],[49.4,-95.1],[49,-100],[49,-105],[49,-110],[49,-115],[49,-120],[49,-123],
  [48.6,-124.3],[48.4,-125.3],[49,-126.4],[50.5,-127.8],[52.5,-129],[54.5,-130.7],
];
const VANCOUVER_ISLAND = [
  [50.8,-128.4],[50.7,-127.5],[50.6,-126.3],[49.8,-125],[48.7,-124.7],[48.4,-123.3],[49.3,-123.3],[50.1,-124.5],[50.7,-126.8],[50.9,-127.8],
];
const NEWFOUNDLAND = [
  [51.6,-55.9],[50.6,-56.9],[49.5,-55.6],[47.9,-53],[46.8,-53.1],[46.6,-53.5],[47.5,-55.5],[48.4,-58.5],[49.5,-57.8],[50.6,-56.3],
];

const PROJ = { lng0: -96, lat0: 56, s: 0.5 };
const pt = (lat, lng) => new THREE.Vector2((lng - PROJ.lng0) * PROJ.s, (lat - PROJ.lat0) * PROJ.s);

export const LAYER_COLORS = {
  verified: 0x2fd4a0,  // emerald — verified coverage
  demand: 0x22d3ee,    // cyan — verified customer demand signals
  ai: 0xa78bfa,        // violet — AI intelligence findings
  matching: 0xfbbf24,  // amber — contractor matching underway
  selected: 0xffffff,  // white — selected location
};

function landShape(points) {
  const shape = new THREE.Shape();
  points.forEach(([lat, lng], i) => {
    const p = pt(lat, lng);
    if (i === 0) shape.moveTo(p.x, p.y); else shape.lineTo(p.x, p.y);
  });
  shape.closePath();
  return shape;
}

const glowTexture = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.4, "rgba(84,217,174,0.35)");
  grad.addColorStop(1, "rgba(84,217,174,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();

// Hero 3D scene: dimensional Canada landmass, layer-coloured nodes, regional
// connection arcs, camera focus animation. Pure rendering + picking — all
// data and UI chrome live in the wrapper component.
export default function mountHeroCanadaScene(mount, { nodes = [], links = [], focusRef, onSelect, mobile = false }) {
  if (!mount || !glowTexture) return null;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: true, powerPreference: "low-power" });
  } catch {
    return null; // WebGL unavailable — wrapper falls back gracefully
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);
  const HOME = new THREE.Vector3(0, 26, mobile ? 38 : 32);
  camera.position.copy(HOME);
  camera.lookAt(0, 0, -3);
  scene.add(new THREE.HemisphereLight(0xbfe8dd, 0x0a2e25, 1.1));
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(10, 20, 10);
  scene.add(dir);

  // Dimensional landmass
  const landGroup = new THREE.Group();
  const landMat = new THREE.MeshStandardMaterial({ color: 0x0d3a34, roughness: 0.9, metalness: 0.1, transparent: true, opacity: 0.92 });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x54d9ae, transparent: true, opacity: 0.28 });
  [MAINLAND, VANCOUVER_ISLAND, NEWFOUNDLAND].forEach((poly) => {
    const geo = new THREE.ExtrudeGeometry(landShape(poly), { depth: 0.7, bevelEnabled: false });
    const mesh = new THREE.Mesh(geo, landMat);
    mesh.rotation.x = -Math.PI / 2;
    landGroup.add(mesh);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 12), edgeMat);
    edges.rotation.x = -Math.PI / 2;
    edges.position.y = 0.01;
    landGroup.add(edges);
  });
  landGroup.position.y = -0.35;
  scene.add(landGroup);

  // Nodes (floating, colour-coded) + invisible pick targets
  const world = new THREE.Group();
  scene.add(world);
  const nodeGeo = new THREE.SphereGeometry(0.34, 14, 14);
  const pickGeo = new THREE.SphereGeometry(mobile ? 1.7 : 1.3, 8, 8);
  const pickMat = new THREE.MeshBasicMaterial({ visible: false });
  const picks = [];
  const nodeMap = new Map();
  const addNode = (node) => {
    const pos = pt(node.lat, node.lng);
    const y = mobile ? 0.9 : 1.1;
    const mesh = new THREE.Mesh(nodeGeo, new THREE.MeshBasicMaterial({ color: LAYER_COLORS[node.layer] || 0x2fd4a0 }));
    mesh.position.set(pos.x, y, -pos.y);
    world.add(mesh);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, transparent: true, opacity: 0.65, depthWrite: false }));
    halo.scale.setScalar(2.4);
    halo.material.color.setHex(LAYER_COLORS[node.layer] || 0x2fd4a0);
    halo.position.copy(mesh.position);
    world.add(halo);
    const pick = new THREE.Mesh(pickGeo, pickMat);
    pick.position.copy(mesh.position);
    pick.userData = node;
    world.add(pick);
    picks.push(pick);
    nodeMap.set(node.key, { mesh, halo, node });
  };
  nodes.forEach(addNode);

  // Regional service-relationship arcs (same-province verified pairs)
  const arcMat = new THREE.LineBasicMaterial({ color: 0x54d9ae, transparent: true, opacity: mobile ? 0.18 : 0.3 });
  const pulses = [];
  if (!mobile) {
    links.forEach((l) => {
      const a = pt(l.a[0], l.a[1]), b = pt(l.b[0], l.b[1]);
      const start = new THREE.Vector3(a.x, 1.1, -a.y);
      const end = new THREE.Vector3(b.x, 1.1, -b.y);
      const mid = start.clone().add(end).multiplyScalar(0.5);
      mid.y += start.distanceTo(end) * 0.28;
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)), arcMat));
      const pulse = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, transparent: true, opacity: 0.9, depthWrite: false }));
      pulse.scale.setScalar(0.9);
      world.add(pulse);
      pulses.push({ curve, sprite: pulse, phase: Math.random() });
    });
  }

  // Selection ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.8, 0.07, 8, 40),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.visible = false;
  scene.add(ring);

  // Picking
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pickAt = (x, y) => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(picks)[0]?.object.userData || null;
  };
  const onPointer = (e) => {
    const hit = pickAt(e.clientX, e.clientY);
    if (hit) onSelect?.(hit);
  };
  renderer.domElement.addEventListener("pointerup", onPointer);
  renderer.domElement.style.touchAction = "pan-y";

  const resize = () => {
    const w = mount.clientWidth || 1, h = mount.clientHeight || 420;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(mount);

  // Focus animation target (set by wrapper from postal-code / selection events)
  const focus = { active: false, target: new THREE.Vector3(), from: new THREE.Vector3(), t: 1 };
  const applyFocus = (lat, lng, instant = false) => {
    const p = pt(lat, lng);
    focus.target.set(p.x * 0.6, 0, -p.y * 0.6);
    focus.from.copy(camera.position);
    focus.t = 0;
    focus.active = true;
    if (instant || reduced) {
      camera.position.lerpVectors(HOME, focus.target.clone().add(HOME.clone().multiplyScalar(0.55)), 1);
      camera.lookAt(focus.target.x, 0, focus.target.z);
      focus.active = false; focus.t = 1;
    }
  };
  if (focusRef?.current) applyFocus(focusRef.current.lat, focusRef.current.lng, true);

  let raf = 0;
  const clock = new THREE.Clock();
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (document.hidden) return;
    const dt = clock.getDelta();
    const t = clock.elapsedTime;
    if (focus.active && focus.t < 1) {
      focus.t = Math.min(1, focus.t + dt);
      const k = focus.t < 0.5 ? 2 * focus.t * focus.t : 1 - Math.pow(-2 * focus.t + 2, 2) / 2;
      const dest = focus.target.clone().add(HOME.clone().multiplyScalar(0.55));
      camera.position.lerpVectors(focus.from, dest, k);
      camera.lookAt(focus.target.x, 0, focus.target.z);
      if (focus.t >= 1) focus.active = false;
    } else if (!reduced) {
      // Gentle ambient drift around the home view
      camera.position.set(HOME.x + Math.sin(t * 0.1) * 1.6, HOME.y + Math.sin(t * 0.23) * 0.5, HOME.z);
      camera.lookAt(0, 0, -3);
    }
    if (!reduced) {
      nodeMap.forEach((n) => { n.halo.material.opacity = 0.5 + 0.25 * Math.sin(t * 1.6 + n.node.lat); });
      pulses.forEach((p) => {
        const k = (t * 0.1 + p.phase) % 1;
        p.sprite.position.copy(p.curve.getPoint(k));
        p.sprite.position.y += 0.2;
      });
      if (ring.visible) ring.scale.setScalar(1 + 0.1 * Math.sin(t * 3));
    }
    renderer.render(scene, camera);
  };
  tick();

  return {
    dispose: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerup", onPointer);
      scene.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    },
    highlight: (key) => {
      const n = nodeMap.get(key);
      if (n) {
        ring.visible = true;
        ring.position.copy(n.mesh.position);
        ring.position.y = 0.25;
      } else {
        ring.visible = false;
      }
    },
    focusOn: (lat, lng, instant) => applyFocus(lat, lng, instant),
  };
}