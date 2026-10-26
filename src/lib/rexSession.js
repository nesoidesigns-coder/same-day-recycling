// Shared Rex session context — one small, non-sensitive snapshot of the
// customer's current interface state (page, service, city, items, estimate).
// It is passed to Rex as a separate internal application-context payload with
// every message — never appended to the customer's typed text and never
// rendered in the chat. Sensitive details (addresses, phone numbers, contact
// fields) are never stored here — those belong to the booking flow only.
const KEY = "sdr-rex-context";

export function setRexContext(patch) {
  try {
    const current = getRexContext();
    sessionStorage.setItem(KEY, JSON.stringify({ ...current, ...patch, updated_at: new Date().toISOString() }));
    window.dispatchEvent(new CustomEvent("rex:context"));
  } catch {
    /* storage unavailable — context is optional, never blocking */
  }
}

export function getRexContext() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "") || {};
  } catch {
    return {};
  }
}

// APPLICATION CONTEXT layer (structured): the interface snapshot Rex receives
// alongside each message. The customer's typed words stay untouched; this is
// metadata only. Pickup-address state is contributed by pickupRexContext() in
// pickupLocationStore.js — including an explicit null when no address is
// selected, so a previous address is never assumed to remain valid.
export function rexAppContext() {
  const c = getRexContext();
  const ctx = {};
  if (c.page) ctx.page = c.page;
  if (c.service_type) ctx.service = c.service_type;
  if (c.city) ctx.city = c.city;
  if (c.intent) ctx.customer_need = c.intent;
  if (c.items_description) ctx.items = c.items_description;
  if (c.estimate_range) ctx.estimate_shown = `${c.estimate_range} (${c.load_eighths || "?"}/8 of a truck)`;
  return ctx;
}