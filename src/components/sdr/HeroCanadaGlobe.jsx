import * as THREE from "three";
import { WORLD_OUTLINES } from "@/lib/worldOutline";

// Google-Earth-style globe of Canada. Pure rendering, picking and gestures;
// data and UI live in the wrapper. Longitude -96 sits at the view centre.
// Interactions: drag to spin (with inertia), wheel/pinch to zoom, tap a city
// to select it — selection rotates the globe so the municipality faces you.
const R = 10;
const DEG = Math.PI / 180;
const VIEW_LAT = 58, VIEW_LNG = -96;
const ROT = 0.0055;
const CAM_MIN = 14, FOCUS_DIST = 18;

const spherePoint = (lat, lng, radius = R) => {
  const phi = (90 - lat) * DEG, theta = (lng + 96) * DEG;
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.cos(theta)
  );
};

const targetQuaternion = (lat, lng) => {
  // Rotate the location onto the meridian facing the straight-on camera.
  const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -(lng + 96) * DEG);
  const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), lat * DEG);
  return qx.multiply(qy);
};



export default function mountHeroCanadaGlobe(mount, { nodes = [], links = [], onSelect, onHover, onFailure, mobile = false }) {
  if (!mount) return null;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.5));
  renderer.domElement.style.display = "block";
  renderer.domElement.style.cursor = "grab";
  renderer.domElement.style.touchAction = "none";
  mount.appendChild(renderer.domElement);

  let raf = 0, visible = true, failed = false, dirty = true, lastFrame = 0;
  const scene = new THREE.Scene();
  const TARGET = new THREE.Vector3(0, 0, 0);
  const camDir = new THREE.Vector3(0, 0, 1);
  // Fit the whole Earth inside the viewport, rather than cropping its edges.
  let homeDist = 34, camDist = homeDist, camTarget = homeDist;
  const setCamDist = (d) => {
    camTarget = Math.min(homeDist * 2.2, Math.max(CAM_MIN, d));
    if (reduced) camDist = camTarget;
    dirty = true;
  };
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

  // Ocean sphere + subtle graticule for geographic depth
  const globeGroup = new THREE.Group();
  scene.add(globeGroup);
  const ocean = new THREE.Mesh(
    new THREE.SphereGeometry(R, 48, 32),
    new THREE.MeshStandardMaterial({ color: 0x0d2a33, roughness: 0.9, metalness: 0.1 })
  );
  // Align the equirectangular texture with the data layer's longitude origin
  ocean.rotation.y = THREE.MathUtils.degToRad(6);
  globeGroup.add(ocean);
  // Google-Earth-style surface: a self-hosted NASA Blue Marble texture
  // (public domain). Falls back to the stylized matte globe if it can't load.
  new THREE.TextureLoader().load(
    "/earth-blue-marble.jpg",
    (tex) => {
      if (failed) return;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy?.() || 1;
      ocean.material = new THREE.MeshPhongMaterial({ map: tex, specular: new THREE.Color(0x16333c), shininess: 14 });
      graticule.visible = false;
      worldLines.visible = false;
      dirty = true;
    },
    undefined,
    () => { /* stylized matte globe stays */ }
  );
  const graticuleMat = new THREE.LineBasicMaterial({ color: 0x3b6a72, transparent: true, opacity: 0.45 });
  const graticulePos = [];
  for (let lat = -60; lat <= 75; lat += 15) {
    for (let lng = -180; lng < 180; lng += 5) graticulePos.push(spherePoint(lat, lng, R * 1.001), spherePoint(lat, lng + 5, R * 1.001));
  }
  for (let lng = -180; lng < 180; lng += 15) {
    for (let lat = -85; lat < 85; lat += 5) graticulePos.push(spherePoint(lat, lng, R * 1.001), spherePoint(lat + 5, lng, R * 1.001));
  }
  const graticule = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(graticulePos), graticuleMat);
  globeGroup.add(graticule);

  // Whole-world land silhouette (Natural Earth 110m) — fallback only; hidden
  // once the photorealistic Earth texture loads.
  const worldMat = new THREE.LineBasicMaterial({ color: 0x5b8d84, transparent: true, opacity: 0.65 });
  const worldLines = new THREE.Group();
  globeGroup.add(worldLines);
  WORLD_OUTLINES.forEach((poly) => {
    const points = poly.map(([lat, lng]) => spherePoint(lat, lng, R * 1.002));
    worldLines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), worldMat));
  });

  // City hit targets stay interactive without drawing dots, glows or arcs.
  // Surface, targets and selection all rotate together in globeGroup.
  const dataGroup = new THREE.Group();
  globeGroup.add(dataGroup);
  const pickGeo = new THREE.SphereGeometry(mobile ? 0.9 : 0.65, 8, 8);
  const pickMat = new THREE.MeshBasicMaterial({ visible: false });
  let picks = [];
  const nodeMap = new Map();
  const setData = (nextNodes = []) => {
    dataGroup.clear();
    picks = [];
    nodeMap.clear();
    nextNodes.forEach((node) => {
      const position = spherePoint(node.lat, node.lng, R * 1.015);
      const pick = new THREE.Mesh(pickGeo, pickMat);
      pick.position.copy(position);
      pick.userData = node;
      dataGroup.add(pick);
      picks.push(pick);
      nodeMap.set(node.key, { position, node });
    });
    dirty = true;
  };
  setData(nodes);

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
  const baseQuat = targetQuaternion(VIEW_LAT, VIEW_LNG);
  globeGroup.quaternion.copy(baseQuat);

  // Drag rotation in camera-relative axes: fully free 360° spin in every
  // direction. Far-side cities stay unreachable via the ocean occluder.
  const applyDrag = (dxPx, dyPx) => {
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(dyPx * ROT, dxPx * ROT, 0));
    globeGroup.quaternion.premultiply(q);
    dirty = true;
  };

  let hovered = null;
  const setHovered = (node) => {
    if (hovered === node) return;
    dirty = true;
    hovered = node;
    if (hovered) {
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
      baseQuat.copy(globeGroup.quaternion);
      renderer.domElement.style.cursor = "grabbing";
    } else if (pointers.size === 2) {
      dragging = false;
      moved = Infinity;
      velX = velY = 0;
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
        setCamDist(camTarget * (pinchDist / dist));
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
      if (e.type === "pointerup" && wasDragging && moved < 8) {
        const hit = pickAt(e.clientX, e.clientY);
        if (hit) onSelect?.(hit);
      }
      baseQuat.copy(globeGroup.quaternion);
      if (reduced || performance.now() - lastT > 100) velX = velY = 0;
    } else if (pointers.size === 1) {
      const remaining = [...pointers.values()][0];
      dragging = true;
      lastX = remaining.x; lastY = remaining.y; lastT = performance.now();
      moved = Infinity;
      velX = velY = pinchDist = 0;
    }
  };
  const onPointerLeave = () => setHovered(null);
  const onWheel = (e) => {
    e.preventDefault();
    setCamDist(camTarget * (1 + e.deltaY * 0.0012));
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
    const atHome = Math.abs(camTarget - homeDist) < 0.01;
    const halfFov = Math.atan(Math.tan(camera.fov * DEG / 2) * Math.min(1, camera.aspect));
    homeDist = R / Math.sin(halfFov) * 1.14;
    if (atHome) { camDist = camTarget = homeDist; updateCamera(); }
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
      globeGroup.quaternion.copy(baseQuat);
      focus.active = false; focus.t = 1;
    } else {
      focus.from.copy(globeGroup.quaternion);
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
    // Smooth cinematic camera glide toward the target distance
    if (Math.abs(camDist - camTarget) > 0.02) {
      camDist += (camTarget - camDist) * Math.min(1, dt * 4);
      updateCamera();
      dirty = true;
    }
    if (focus.active && focus.t < 1) {
      focus.t = Math.min(1, focus.t + dt);
      const k = focus.t < 0.5 ? 2 * focus.t * focus.t : 1 - Math.pow(-2 * focus.t + 2, 2) / 2;
      globeGroup.quaternion.slerpQuaternions(focus.from, focus.to, k);
      if (focus.t >= 1) focus.active = false;
    } else if (dragging) {
      // rotation applied directly by the gesture handlers
    } else if (!reduced && (Math.abs(velX) > 0.02 || Math.abs(velY) > 0.02)) {
      // Fling inertia with exponential damping, then settle into the new view
      applyDrag(velX * dt * 1000, velY * dt * 1000);
      const damping = Math.exp(-dt * 4.5);
      velX *= damping; velY *= damping;
      if (Math.abs(velX) <= 0.02 && Math.abs(velY) <= 0.02) { velX = velY = 0; baseQuat.copy(globeGroup.quaternion); }
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
    focusOn: (lat, lng, instant) => {
      dirty = true;
      setCamDist(FOCUS_DIST); // glide in to the selected region
      applyFocus(lat, lng, instant);
    },
    resetFocus: () => {
      dirty = true;
      setCamDist(homeDist);
      focus.active = false;
      applyFocus(VIEW_LAT, VIEW_LNG, reduced);
    },
    updateData: (nextNodes) => setData(nextNodes),
    zoomBy: (factor) => {
      dirty = true;
      setCamDist(camTarget * factor);
      updateCamera();
    },
  };
}