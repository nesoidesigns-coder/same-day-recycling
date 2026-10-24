import * as THREE from "three";
import { CANADA_OUTLINES, LAYER_COLORS } from "@/lib/canadaOutline";

// Google-Earth-style globe of Canada. Pure rendering + picking; data and UI
// live in the wrapper. Longitude -96 sits at the view centre, camera is tilted
// to frame the populated south, and selection rotates the globe (never the
// camera) so the chosen municipality faces the viewer.
const R = 10;
const DEG = Math.PI / 180;
const VIEW_LAT = 58; // latitude framed at screen centre in the default view

const spherePoint = (lat, lng, radius = R) => {
  const phi = (90 - lat) * DEG, theta = (lng + 96) * DEG;
  return new THREE.Vector3(
    radius * Math.cos(phi) * Math.sin(theta),
    radius * Math.sin(phi),
    radius * Math.cos(phi) * Math.cos(theta)
  );
};

const targetQuaternion = (lat, lng) => {
  const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -(lng + 96) * DEG);
  const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), ((90 - lat) - (90 - VIEW_LAT)) * DEG);
  return qx.multiply(qy);
};

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

// Territory arcs: spherical interpolation lifted off the surface.
const arcPoints = (a, b) => {
  const start = spherePoint(a[0], a[1]), end = spherePoint(b[0], b[1]);
  const angle = start.angleTo(end);
  const lift = 0.3 + angle * 0.8;
  const points = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    points.push(start.clone().lerp(end, t).normalize().multiplyScalar(R + Math.sin(Math.PI * t) * lift));
  }
  return { points };
};

export default function mountHeroCanadaGlobe(mount, { nodes = [], links = [], onSelect, onHover, onFailure, mobile = false }) {
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
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 8.5, 15.5);
  camera.lookAt(0, 0.5, 0);

  scene.add(new THREE.HemisphereLight(0xd8fff2, 0x081c26, 1.35));
  const dir = new THREE.DirectionalLight(0xffffff, 1.1);
  dir.position.set(6, 10, 12);
  scene.add(dir);

  // Ocean sphere + subtle graticule for geographic depth
  const globeGroup = new THREE.Group();
  scene.add(globeGroup);
  const ocean = new THREE.Mesh(
    new THREE.SphereGeometry(R, 48, 32),
    new THREE.MeshStandardMaterial({ color: 0x0d2a33, roughness: 0.9, metalness: 0.1 })
  );
  globeGroup.add(ocean);
  const graticuleMat = new THREE.LineBasicMaterial({ color: 0x3b6a72, transparent: true, opacity: 0.45 });
  const graticulePos = [];
  for (let lat = -60; lat <= 75; lat += 15) {
    for (let lng = -180; lng < 180; lng += 5) {
      graticulePos.push(spherePoint(lat, lng, R * 1.001), spherePoint(lat, lng + 5, R * 1.001));
    }
  }
  for (let lng = -180; lng < 180; lng += 15) {
    for (let lat = -85; lat < 85; lat += 5) {
      graticulePos.push(spherePoint(lat, lng, R * 1.001), spherePoint(lat + 5, lng, R * 1.001));
    }
  }
  const graticuleGeo = new THREE.BufferGeometry().setFromPoints(graticulePos);
  globeGroup.add(new THREE.LineSegments(graticuleGeo, graticuleMat));

  // Coastline glow: verified Natural Earth geometry lifted just off the surface
  const coastGroup = new THREE.Group();
  globeGroup.add(coastGroup);
  const coastMat = new THREE.LineBasicMaterial({ color: 0x8fe6cd, transparent: true, opacity: 0.95 });
  CANADA_OUTLINES.forEach((poly) => {
    const points = poly.map(([lat, lng]) => spherePoint(lat, lng, R * 1.004));
    coastGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([...points, points[0]]), coastMat));
  });

  // Nodes, halos and invisible pick targets
  const world = new THREE.Group();
  globeGroup.add(world);
  const nodeGeo = new THREE.SphereGeometry(0.14, 12, 12);
  const pickGeo = new THREE.SphereGeometry(mobile ? 0.85 : 0.62, 8, 8);
  const pickMat = new THREE.MeshBasicMaterial({ visible: false });
  const picks = [];
  const nodeMap = new Map();
  const addNode = (node) => {
    const position = spherePoint(node.lat, node.lng, R * 1.015);
    const mesh = new THREE.Mesh(nodeGeo, new THREE.MeshBasicMaterial({ color: LAYER_COLORS[node.layer] || 0x2fd4a0 }));
    mesh.position.copy(position);
    world.add(mesh);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, transparent: true, opacity: 0.75, depthWrite: false }));
    halo.scale.setScalar(0.85);
    halo.material.color.setHex(LAYER_COLORS[node.layer] || 0x2fd4a0);
    halo.position.copy(position);
    world.add(halo);
    const pick = new THREE.Mesh(pickGeo, pickMat);
    pick.position.copy(position);
    pick.userData = node;
    world.add(pick);
    picks.push(pick);
    nodeMap.set(node.key, { mesh, halo, position, node });
  };
  nodes.forEach(addNode);

  // Territory arcs: only explicitly confirmed shared contractor territories
  const arcMat = new THREE.LineBasicMaterial({ color: 0x54d9ae, transparent: true, opacity: 0.7 });
  links.forEach((link) => {
    const { points } = arcPoints(link.a, link.b);
    world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), arcMat));
  });

  // Selection ring, oriented along the node's surface normal
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.4, 0.035, 8, 40),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 })
  );
  ring.visible = false;
  globeGroup.add(ring);

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

  // Hover feedback
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
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(mount);

  // Focus: slerp the globe so the target municipality faces the camera
  const focus = { active: false, t: 1, from: new THREE.Quaternion(), to: new THREE.Quaternion() };
  let baseQuat = targetQuaternion(VIEW_LAT, 0);
  world.quaternion.copy(baseQuat);
  const applyFocus = (lat, lng, instant = false) => {
    baseQuat = targetQuaternion(lat, lng);
    if (instant || reduced) {
      world.quaternion.copy(baseQuat);
      focus.active = false; focus.t = 1;
    } else {
      focus.from.copy(world.quaternion);
      focus.to.copy(baseQuat);
      focus.active = true; focus.t = 0;
    }
  };

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
      world.quaternion.slerpQuaternions(focus.from, focus.to, k);
      if (focus.t >= 1) focus.active = false;
    } else if (!reduced) {
      // Gentle ambient sway around the current base view
      const sway = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(t * 0.1) * 0.02, Math.sin(t * 0.13) * 0.045, 0));
      world.quaternion.copy(baseQuat).multiply(sway);
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
        ring.position.copy(n.position.clone().multiplyScalar(1.005));
        ring.lookAt(n.position.clone().multiplyScalar(2));
      } else {
        ring.visible = false;
      }
    },
    focusOn: (lat, lng, instant) => { dirty = true; applyFocus(lat, lng, instant); },
    resetFocus: () => { dirty = true; focus.active = false; applyFocus(VIEW_LAT, 0, reduced); },
  };
}