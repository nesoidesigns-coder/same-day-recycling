// Shared Rex session context — one small, non-sensitive snapshot of the
// customer's current interface state (page, service, city, items, estimate).
// Rex receives it automatically with every message, so the customer never
// repeats themselves. Sensitive details (addresses, phone numbers, contact
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

// Compact plain-language line Rex receives alongside each message.
export function rexContextText() {
  const c = getRexContext();
  const parts = [];
  if (c.page) parts.push(`page: ${c.page}`);
  if (c.service_type) parts.push(`service: ${c.service_type}`);
  if (c.city) parts.push(`city: ${c.city}`);
  if (c.intent) parts.push(`customer need: ${c.intent}`);
  if (c.items_description) parts.push(`items: ${c.items_description}`);
  if (c.estimate_range) parts.push(`preliminary estimate shown: ${c.estimate_range} (${c.load_eighths || "?"}/8 of a truck)`);
  return parts.join("; ");
}