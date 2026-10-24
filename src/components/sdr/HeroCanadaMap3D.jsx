import * as THREE from "three";
import { CANADA_OUTLINES, LAYER_COLORS, MAP_BOUNDS, pt } from "@/lib/canadaOutline";

function landShape(points) {
  const shape = new THREE.Shape();
  points.forEach(([lat, lng], i) => {
    const p = pt(lat, lng);
    if (i === 0) shape.moveTo(p.x, p.y); else shape.lineTo(p.x, p.y);
  });
  shape.closePath();
  return shape;
}

const createGlowTexture = () => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  if (!g) return null;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.4, "rgba(84,217,174,0.35)");
  grad.addColorStop(1, "rgba(84,217,174,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
};

// Hero 3D scene: dimensional Canada landmass, layer-coloured nodes, regional
// connection arcs, camera focus animation. Pure rendering + picking — all
// data and UI chrome live in the wrapper component.
export default function mountHeroCanadaScene(mount, { nodes = [], links = [], focusRef, onSelect, onHover, onFailure, mobile = false }) {
  if (!mount) return null;
  const glowTexture = createGlowTexture();
  if (!glowTexture) return null;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: true, powerPreference: "high-performance" });
  } catch {
    glowTexture.dispose();
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.5));
  renderer.domElement.style.display = "block";
  mount.appendChild(renderer.domElement);

  let raf = 0, visible = true, failed = false, dirty = true, lastFrame = 0;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400);

  // Camera framing is computed to fit the FULL Canadian silhouette in view on
  // any screen size, so visitors recognize Canada immediately.
  const MAP_W = MAP_BOUNDS.maxX - MAP_BOUNDS.minX, MAP_H = MAP_BOUNDS.maxY - MAP_BOUNDS.minY;
  const MAP_CENTER = new THREE.Vector3((MAP_BOUNDS.minX + MAP_BOUNDS.maxX) / 2, 0, -(MAP_BOUNDS.minY + MAP_BOUNDS.maxY) / 2);
  const CAM_DIR = new THREE.Vector3(0, 0.72, 0.7).normalize();
  const fit = { dist: 34, dest: new THREE.Vector3() };
  const lookAtPoint = new THREE.Vector3().copy(MAP_CENTER);
  const refit = () => {
    const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
    fit.dist = Math.max((MAP_W / 2 + 2) / (tanHalf * camera.aspect), (MAP_H / 2 + 2) / tanHalf);
    fit.dest.copy(MAP_CENTER).addScaledVector(CAM_DIR, fit.dist);
    camera.position.copy(fit.dest);
    camera.lookAt(lookAtPoint);
  };
  refit();

  scene.add(new THREE.HemisphereLight(0xd8fff2, 0x0a2e25, 1.3));
  const dir = new THREE.DirectionalLight(0xffffff, 1.0);
  dir.position.set(10, 20, 10);
  scene.add(dir);

  // Dimensional landmass — bright enough to read against the hero background
  const landGroup = new THREE.Group();
  // Neutral geography keeps emerald reserved for actual verified-territory nodes.
  const landMat = new THREE.MeshStandardMaterial({ color: 0x3c4b50, roughness: 0.85, metalness: 0.15 });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xa4bab8, transparent: true, opacity: 0.9 });
  CANADA_OUTLINES.forEach((poly) => {
    const geo = new THREE.ExtrudeGeometry(landShape(poly), { depth: 0.8, bevelEnabled: false });
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
  const nodeGeo = new THREE.SphereGeometry(0.38, 14, 14);
  const pickGeo = new THREE.SphereGeometry(mobile ? 1.9 : 1.4, 8, 8);
  const pickMat = new THREE.MeshBasicMaterial({ visible: false });
  const picks = [];
  const nodeMap = new Map();
  const addNode = (node) => {
    const pos = pt(node.lat, node.lng);
    const y = mobile ? 0.9 : 1.1;
    const mesh = new THREE.Mesh(nodeGeo, new THREE.MeshBasicMaterial({ color: LAYER_COLORS[node.layer] || 0x2fd4a0 }));
    mesh.position.set(pos.x, y, -pos.y);
    world.add(mesh);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, transparent: true, opacity: 0.75, depthWrite: false }));
    halo.scale.setScalar(2.8);
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

  // These links come only from a shared, explicitly confirmed contractor
  // territory. They never indicate truck movement, routing or new activity.
  const arcMat = new THREE.LineBasicMaterial({ color: 0x54d9ae, transparent: true, opacity: 0.7 });
  links.forEach((link) => {
    const a = pt(...link.a), b = pt(...link.b);
    const start = new THREE.Vector3(a.x, 1.1, -a.y), end = new THREE.Vector3(b.x, 1.1, -b.y);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    mid.y += Math.max(0.5, start.distanceTo(end) * 0.2);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(24)), arcMat));
  });

  // Selection ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.08, 8, 40),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 })
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

  // Hover feedback: the node under the pointer grows and reports itself so the
  // wrapper can show that region's demand + availability tooltip.
  let hovered = null;
  const setHovered = (node) => {
    if (hovered === node) return;
    dirty = true;
    if (hovered) nodeMap.get(hovered.key)?.mesh.scale.setScalar(1);
    hovered = node;
    if (hovered) {
      nodeMap.get(hovered.key)?.mesh.scale.setScalar(1.35);
      renderer.domElement.style.cursor = "pointer";
    } else {
      renderer.domElement.style.cursor = "";
    }
    onHover?.(hovered);
  };
  const onPointerMove = (e) => setHovered(pickAt(e.clientX, e.clientY));
  const onPointerLeave = () => setHovered(null);
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerleave", onPointerLeave);

  const resize = () => {
    dirty = true;
    const w = mount.clientWidth || 1, h = mount.clientHeight || 420;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    refit();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(mount);

  // Focus animation (postal-code / selection events). Drift continues around
  // the focused view so the camera never snaps back mid-session.
  const focus = { active: false, target: new THREE.Vector3(), from: new THREE.Vector3(), t: 1 };
  const applyFocus = (lat, lng, instant = false) => {
    const p = pt(lat, lng);
    focus.target.set(p.x, 0, -p.y);
    focus.from.copy(camera.position);
    lookAtPoint.copy(focus.target);
    fit.dest.copy(focus.target).addScaledVector(CAM_DIR, fit.dist * 0.55);
    if (instant || reduced) {
      camera.position.copy(fit.dest);
      camera.lookAt(lookAtPoint);
      focus.active = false; focus.t = 1;
    } else {
      focus.active = true; focus.t = 0;
    }
  };
  if (focusRef?.current) applyFocus(focusRef.current.lat, focusRef.current.lng, true);

  const onContextLost = (event) => { event.preventDefault(); failed = true; onFailure?.(); };
  renderer.domElement.addEventListener("webglcontextlost", onContextLost);
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; dirty = true; });
  observer.observe(mount);
  const clock = new THREE.Clock();
  const tick = () => {
    raf = requestAnimationFrame(tick);
    const dt = clock.getDelta();
    if (document.hidden || !visible || failed) return;
    if (mobile && performance.now() - lastFrame < 32) return;
    if (reduced && !dirty && !focus.active) return;
    lastFrame = performance.now();
    dirty = false;
    const t = clock.elapsedTime;
    if (focus.active && focus.t < 1) {
      focus.t = Math.min(1, focus.t + dt);
      const k = focus.t < 0.5 ? 2 * focus.t * focus.t : 1 - Math.pow(-2 * focus.t + 2, 2) / 2;
      camera.position.lerpVectors(focus.from, fit.dest, k);
      camera.lookAt(lookAtPoint);
      if (focus.t >= 1) focus.active = false;
    } else if (!reduced) {
      // Gentle ambient drift around the current base view
      camera.position.copy(fit.dest).add(new THREE.Vector3(Math.sin(t * 0.1) * 1.6, Math.sin(t * 0.23) * 0.5, 0));
      camera.lookAt(lookAtPoint);
    }
    if (!reduced) {
      nodeMap.forEach((n) => { n.halo.material.opacity = 0.55 + 0.3 * Math.sin(t * 1.6 + n.node.lat); });

      if (ring.visible) ring.scale.setScalar(1 + 0.1 * Math.sin(t * 3));
    }
    renderer.render(scene, camera);
  };
  tick();

  return {
    dispose: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      observer.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener("pointerup", onPointer);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      scene.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
      glowTexture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    },
    highlight: (key) => {
      dirty = true;
      const n = nodeMap.get(key);
      if (n) {
        ring.visible = true;
        ring.position.copy(n.mesh.position);
        ring.position.y = 1.2;
      } else {
        ring.visible = false;
      }
    },
    focusOn: (lat, lng, instant) => { dirty = true; applyFocus(lat, lng, instant); },
    resetFocus: () => { dirty = true; focus.active = false; lookAtPoint.copy(MAP_CENTER); refit(); },
  };
}