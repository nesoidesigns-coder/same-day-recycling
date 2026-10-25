// One tab-scoped booking location. Maps, the form and Rex read this same snapshot.
const KEY = "recycling-os:pickup-location:v1";
const listeners = new Set();
export const validPickupPoint = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && lat >= 41 && lat <= 84 && lng >= -142 && lng <= -52;
const emptyImagery = () => ({ status: "unchecked", provider: null });
function restore() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
    return saved?.version === 1 && validPickupPoint(saved.lat, saved.lng) ? { ...saved, imagery: emptyImagery() } : null;
  } catch { return null; } // Storage can be disabled by the customer's browser.
}
let location = restore();
function publish(next) {
  location = next;
  try { if (next) sessionStorage.setItem(KEY, JSON.stringify(next)); else sessionStorage.removeItem(KEY); } catch { /* In-memory booking still works. */ }
  listeners.forEach((notify) => notify());
}
const formatted = (p) => [p.addressLine, p.unit ? `Unit ${p.unit}` : "", p.city, p.province, p.postal_code].filter(Boolean).join(", ");
export const getPickupLocation = () => location;
export const subscribePickupLocation = (notify) => { listeners.add(notify); return () => listeners.delete(notify); };
export const pickupLocationActions = {
  select(candidate) {
    if (!validPickupPoint(candidate?.lat, candidate?.lng) || !candidate.city || !candidate.province) return;
    const next = { ...candidate, version: 1, selectionId: crypto.randomUUID(), unit: "", addressLine: candidate.street_level ? candidate.entered_address || candidate.label : candidate.label,
      confidence: candidate.confidence || (candidate.street_level ? "street" : "address"), adjusted: false, pinConfirmed: false,
      confirmedPin: null, imagery: emptyImagery(), preparation: { tags: [], note: "" }, instant: false,
      camera: { active: "globe", globe: null, local: { lat: candidate.lat, lng: candidate.lng, zoom: 17, mode: "satellite" }, street: null } };
    publish({ ...next, formattedAddress: formatted(next) });
  },
  clear() { publish(null); },
  updateUnit(unit) { if (location) { const next = { ...location, unit: unit.slice(0, 40) }; publish({ ...next, formattedAddress: formatted(next) }); } },
  adjustPin(lat, lng) {
    if (!location || !validPickupPoint(lat, lng)) return;
    publish({ ...location, lat, lng, adjusted: true, pinConfirmed: false, confirmedPin: null, imagery: emptyImagery(),
      camera: { ...location.camera, active: "local", local: { ...location.camera.local, lat, lng, mode: "satellite" } } });
  },
  confirmPin() { if (location) publish({ ...location, pinConfirmed: true, confirmedPin: { lat: location.lat, lng: location.lng, confirmedAt: new Date().toISOString() } }); },
  setImagery(selectionId, lat, lng, imagery) {
    if (location?.selectionId === selectionId && location.lat === lat && location.lng === lng) publish({ ...location, imagery });
  },
  setCamera(surface, camera) {
    if (!location) return;
    const next = { ...location.camera, [surface]: { ...location.camera[surface], ...camera } };
    if (surface !== "globe" || !camera.settled) next.active = surface;
    publish({ ...location, camera: next });
  },
  skipAnimation() { if (location) publish({ ...location, instant: true }); },
  setPreparation(preparation) { if (location) publish({ ...location, preparation }); },
};
export function pickupBookingFields(p = location) {
  if (!p?.pinConfirmed || !validPickupPoint(p.lat, p.lng)) return {};
  return { address: p.formattedAddress, pickup_lat: p.lat, pickup_lng: p.lng, pickup_unit: p.unit,
    pickup_location_source: p.adjusted || p.confidence !== "address" ? "customer_adjusted" : "verified_geocode" };
}
export function pickupRexContext(p = location) {
  if (!p) return "No pickup address is selected in the booking form. Do not assume a previous address is still current.";
  return `Current pickup session: ${JSON.stringify({ address: p.formattedAddress, city: p.city, province_code: p.province, lat: p.lat, lng: p.lng, confidence: p.confidence, pin_confirmed: p.pinConfirmed, ...pickupBookingFields(p), access_notes: p.preparation, street_imagery: p.imagery.status })}. This replaces all earlier pickup-location context. If I mention a different address, ask me to select a validated result in address search; do not invent or substitute coordinates. Never infer parking, access restrictions or property conditions from imagery. Ask the customer about inside/outside items, stairs, elevator, loading entrance and heavy items, one question at a time. Do not create a booking until the customer explicitly requests submission; never duplicate a request already submitted in the form.`;
}