import * as THREE from "three";
import { CANADA_OUTLINES, LAYER_COLORS } from "@/lib/canadaOutline";

// Google-Earth-style globe of Canada. Pure rendering, picking and gestures;
// data and UI live in the wrapper. Longitude -96 sits at the view centre.
// Interactions: drag to spin (with inertia), wheel/pinch to zoom, tap a city
// to select it — selection rotates the globe so the municipality faces you.
const R = 10;
const DEG = Math.PI / 180;
const VIEW_LAT = 58; // latitude framed at screen centre in the default view
const ROT = 0.0055; // radians of globe rotation per dragged pixel
const CAM_MIN = 13, CAM_MAX = 21;

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
  renderer.domElement.style.cursor = "grab";
  renderer.domElement.style.touchAction = "pan-y";
  mount.appendChild(renderer.domElement);

  let raf = 0, visible = true, failed = false, dirty = true, lastFrame = 0;
  const scene = new THREE.Scene();
  const TARGET = new THREE.Vector3(0, 0.5, 0);
  const camDir = new THREE.Vector3(0, 8, 15).normalize();
  let camDist = 17;
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  const updateCamera = () => {
    camera.position.copy(camDir).multiplyScalar(camDist);
    camera.lookAt(TARGET);
  };
  updateCamera();

  scene.add(new THREE.HemisphereLight(0xd8fff2, 0x081c26, 1.35));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
  dirLight.position.set(6, 10, 12);
  scene.add(dirLight);

  // Atmosphere rim: soft fresnel halo only visible at the sphere's edge
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.18, 48, 32),
    new THREE.ShaderMaterial({
      transparent: true, side: THREE.BackSide, depthWrite: false,
      vertexShader: "varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "varying vec3 vN; void main(){ float i = pow(0.72 - dot(vN, vec3(0.0, 0.0, 1.0)), 3.0); gl_FragColor = vec4(0.28, 0.78, 0.63, 1.0) * clamp(i, 0.0, 1.0) * 0.9; }",
    })
  );
  scene.add(atmosphere);

  // Faint star field behind the globe
  const starPositions = [];
  for (let i = 0; i < 260; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(38 + Math.random() * 16);
    starPositions.push(v.x, v.y, v.z);
  }
  const stars = new THREE.Points(
    new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3)),
    new THREE.PointsMaterial({ color: 0x9fd8cc, size: 0.09, transparent: true, opacity: 0.55, sizeAttenuation: true })
  );
  scene.add(stars);

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
    for (let lng = -180; lng < 180; lng += 5) graticulePos.push(spherePoint(lat, lng, R * 1.001), spherePoint(lat, lng + 5, R * 1.001));
  }
  for (let lng = -180; lng < 180; lng += 15) {
    for (let lat = -85; lat < 85; lat += 5) graticulePos.push(spherePoint(lat, lng, R * 1.001), spherePoint(lat + 5, lng, R * 1.001));
  }
  globeGroup.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(graticulePos), graticuleMat));

  // Coastline glow: verified Natural Earth geometry lifted just off the surface
  const coastMat = new THREE.LineBasicMaterial({ color: 0x8fe6cd, transparent: true, opacity: 0.95 });
  CANADA_OUTLINES.forEach((poly) => {
    const points = poly.map(([lat, lng]) => spherePoint(lat, lng, R * 1.004));
    globeGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([...points, points[0]]), coastMat));
  });

  // Nodes, halos and invisible pick targets (in the rotating group)
  const world = new THREE.Group();
  globeGroup.add(world);
  const nodeGeo = new THREE.SphereGeometry(0.14, 12, 12);
  const pickGeo = new THREE.SphereGeometry(mobile ? 0.9 : 0.65, 8, 8);
  const pickMat = new THREE.MeshBasicMaterial({ visible: false });
  const picks = [];
  const nodeMap = new Map();
  nodes.forEach((node) => {
    const position = spherePoint(node.lat, node.lng, R * 1.015);
    const color = LAYER_COLORS[node.layer] || 0x2fd4a0;
    const mesh = new THREE.Mesh(nodeGeo, new THREE.MeshBasicMaterial({ color }));
    mesh.position.copy(position);
    world.add(mesh);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color, transparent: true, opacity: 0.75, depthWrite: false }));
    halo.scale.setScalar(0.85);
    halo.position.copy(position);
    world.add(halo);
    const pick = new THREE.Mesh(pickGeo, pickMat);
    pick.position.copy(position);
    pick.userData = node;
    world.add(pick);
    picks.push(pick);
    nodeMap.set(node.key, { mesh, halo, position, node });
  });

  // Territory arcs: only explicitly confirmed shared contractor territories
  const arcMat = new THREE.LineBasicMaterial({ color: 0x54d9ae, transparent: true, opacity: 0.7 });
  links.forEach((link) => {
    const { points } = arcPoints(link.a, link.b);
    world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), arcMat));
  });

  // Selection ring, oriented along the node's surface normal
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.035, 8, 40),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 })
  );
  ring.visible = false;
  globeGroup.add(ring);

  // ---- Gestures: drag to spin, pinch/wheel to zoom, tap to select ----
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pickAt = (x, y) => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects([ocean, ...picks], false)[0];
    // The ocean sphere occludes far-side picks, so only front-facing cities respond.
    return hit && hit.object !== ocean ? hit.object.userData : null;
  };

  const pointers = new Map();
  let dragging = false, moved = 0, lastX = 0, lastY = 0, lastT = 0, velX = 0, velY = 0, pinchDist = 0;
  const baseQuat = targetQuaternion(VIEW_LAT, 0);
  world.quaternion.copy(baseQuat);

  // Drag rotation in camera-relative axes, with a pitch clamp so the globe
  // never flips over. Far-side cities stay unreachable via the ocean occluder.
  const prevQuat = new THREE.Quaternion();
  const inverted = new THREE.Quaternion();
  const facing = new THREE.Vector3();
  const applyDrag = (dxPx, dyPx) => {
    prevQuat.copy(world.quaternion);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(dyPx * ROT, dxPx * ROT, 0));
    world.quaternion.premultiply(q);
    inverted.copy(world.quaternion).invert();
    facing.copy(camDir).applyQuaternion(inverted);
    if (facing.y > 0.95 || facing.y < -0.25) world.quaternion.copy(prevQuat);
    dirty = true;
  };

  let hovered = null;
  const setHovered = (node) => {
    if (hovered === node) return;
    dirty = true;
    if (hovered) { const n = nodeMap.get(hovered.key); n?.mesh.scale.setScalar(1); n?.halo.scale.setScalar(0.85); }
    hovered = node;
    if (hovered) {
      const n = nodeMap.get(hovered.key);
      n?.mesh.scale.setScalar(1.35);
      n?.halo.scale.setScalar(1.1);
      if (!dragging) renderer.domElement.style.cursor = "pointer";
    } else if (!dragging) {
      renderer.domElement.style.cursor = "grab";
    }
    onHover?.(hovered);
  };

  const onPointerDown = (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { renderer.domElement.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    if (pointers.size === 1) {
      dragging = true; moved = 0;
      lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
      velX = velY = 0;
      focus.active = false;
      baseQuat.copy(world.quaternion);
      renderer.domElement.style.cursor = "grabbing";
    } else if (pointers.size === 2) {
      dragging = false;
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const onPointerMove = (e) => {
    const p = pointers.get(e.pointerId);
    if (!p) { if (!dragging) setHovered(pickAt(e.clientX, e.clientY)); return; }
    p.x = e.clientX; p.y = e.clientY;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist > 0 && dist > 0) {
        camDist = Math.min(CAM_MAX, Math.max(CAM_MIN, camDist * (pinchDist / dist)));
        updateCamera(); dirty = true;
      }
      pinchDist = dist;
      return;
    }
    if (!dragging) return;
    const now = performance.now();
    const dt = Math.max(now - lastT, 1);
    moved += Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY);
    velX = (e.clientX - lastX) / dt;
    velY = (e.clientY - lastY) / dt;
    applyDrag(e.clientX - lastX, e.clientY - lastY);
    lastX = e.clientX; lastY = e.clientY; lastT = now;
  };

  const endPointer = (e) => {
    const wasDragging = dragging;
    pointers.delete(e.pointerId);
    if (pointers.size === 0) {
      dragging = false;
      renderer.domElement.style.cursor = hovered ? "pointer" : "grab";
      // A tiny movement is a tap, not a drag: select the city under it.
      if (wasDragging && moved < 8) {
        const hit = pickAt(e.clientX, e.clientY);
        if (hit) onSelect?.(hit);
      }
      if (reduced || moved === 0) baseQuat.copy(world.quaternion);
    } else {
      pinchDist = 0;
    }
  };
  const onPointerLeave = () => setHovered(null);
  const onWheel = (e) => {
    e.preventDefault();
    camDist = Math.min(CAM_MAX, Math.max(CAM_MIN, camDist * (1 + e.deltaY * 0.0012)));
    updateCamera(); dirty = true;
  };

  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerup", endPointer);
  renderer.domElement.addEventListener("pointercancel", endPointer);
  renderer.domElement.addEventListener("pointerleave", onPointerLeave);
  renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

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
  const applyFocus = (lat, lng, instant = false) => {
    baseQuat.copy(targetQuaternion(lat, lng));
    velX = velY = 0;
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
    const dt = Math.min(clock.getDelta(), 0.05);
    if (document.hidden || !visible || failed) return;
    if (mobile && performance.now() - lastFrame < 32) return;
    if (reduced && !dirty && !focus.active && !dragging) return;
    lastFrame = performance.now();
    dirty = false;
    const t = clock.elapsedTime;
    if (focus.active && focus.t < 1) {
      focus.t = Math.min(1, focus.t + dt);
      const k = focus.t < 0.5 ? 2 * focus.t * focus.t : 1 - Math.pow(-2 * focus.t + 2, 2) / 2;
      world.quaternion.slerpQuaternions(focus.from, focus.to, k);
      if (focus.t >= 1) focus.active = false;
    } else if (dragging) {
      // rotation applied directly by the gesture handlers
    } else if (!reduced && (Math.abs(velX) > 0.02 || Math.abs(velY) > 0.02)) {
      // Fling inertia with exponential damping, then settle into the new view
      applyDrag(velX * dt * 1000, velY * dt * 1000);
      const damping = Math.exp(-dt * 4.5);
      velX *= damping; velY *= damping;
      if (Math.abs(velX) <= 0.02 && Math.abs(velY) <= 0.02) { velX = velY = 0; baseQuat.copy(world.quaternion); }
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
      const el = renderer.domElement;
      el.removeEventListener("webglcontextlost", onContextLost);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endPointer);
      el.removeEventListener("pointercancel", endPointer);
      el.removeEventListener("pointerleave", onPointerLeave);
      el.removeEventListener("wheel", onWheel);
      scene.traverse((o) => { o.geometry?.dispose?.(); o.material?.dispose?.(); });
      glowTexture.dispose();
      renderer.dispose();
      if (el.parentNode === mount) mount.removeChild(el);
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