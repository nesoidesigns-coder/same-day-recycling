// Tier prices are the platform's own defaults, editable per city in Admin > Pricing.
// They were set after a one-time review of publicly listed competitor rates (Oct 2026),
// which varied widely by city and load. They are NOT a live market benchmark and the
// public site must not claim to be "under market". Quotes are preliminary estimates;
// the final price is approved by the customer before any work or payment.
export const DEFAULT_PRICES = {
  minimum_pickup: 139,
  eighth_truck: 189,
  quarter_truck: 269,
  half_truck: 419,
  three_quarter_truck: 549,
  full_truck: 649,
};

// THE one merge rule for city pricing rows — used by quoteEstimate,
// cityPricing and every other consumer. Only finite, POSITIVE stored rates
// override the defaults: an unset or zero tier falls back to the national
// rate, so calculators, booking forms and Rex can never disagree.
export function resolveCityPrices(row) {
  if (!row) return { ...DEFAULT_PRICES };
  const picks = {};
  for (const k of Object.keys(DEFAULT_PRICES)) {
    const v = Number(row[k]);
    if (Number.isFinite(v) && v > 0) picks[k] = v;
  }
  return { ...DEFAULT_PRICES, ...picks };
}

// Truck space per unit, measured in eighths of a full truck.
export const ITEM_WEIGHTS = {
  sofa: 1.2,
  loveseat: 0.8,
  mattress: 0.8,
  "box spring": 0.8,
  "dining table": 0.7,
  dresser: 0.7,
  fridge: 1.0,
  washer: 0.8,
  dryer: 0.7,
  stove: 0.7,
  dishwasher: 0.5,
  treadmill: 0.8,
  tv: 0.3,
  "bags/boxes of junk": 0.15,
};

// Advertised curbside discount: customer stages items curbside, $25 off.
export const CURBSIDE_DISCOUNT = 25;

// Travel: a base distance from the job's city centre is included in every
// quote; beyond it a flat per-km surcharge applies. These are rough-quote
// estimates — the final price is approved by the customer before any work.
export const INCLUDED_TRAVEL_KM = 30;
export const TRAVEL_RATE_PER_KM = 2;

export function travelSurcharge(travel_km) {
  const km = Math.max(0, Number(travel_km) || 0);
  return Math.round(Math.max(0, km - INCLUDED_TRAVEL_KM) * TRAVEL_RATE_PER_KM);
}

const round5 = (n) => Math.round(n / 5) * 5;

export function tierFor(eighths) {
  if (eighths <= 0.5) return { key: "minimum_pickup", label: "Minimum pickup" };
  if (eighths <= 1.5) return { key: "eighth_truck", label: "1/8 truck" };
  if (eighths <= 3) return { key: "quarter_truck", label: "1/4 truck" };
  if (eighths <= 4.5) return { key: "half_truck", label: "1/2 truck" };
  if (eighths <= 6) return { key: "three_quarter_truck", label: "3/4 truck" };
  return { key: "full_truck", label: "Full truck" };
}

const NEXT_KEY = {
  minimum_pickup: "eighth_truck",
  eighth_truck: "quarter_truck",
  quarter_truck: "half_truck",
  half_truck: "three_quarter_truck",
  three_quarter_truck: "full_truck",
};

export function computeQuote(eighths, prices, opts) {
  const p = { ...DEFAULT_PRICES, ...(prices || {}) };
  const { key, label } = tierFor(eighths);
  let low = p[key];
  const nextKey = NEXT_KEY[key];
  let high = nextKey
    ? round5(low + 0.4 * (p[nextKey] - low))
    : round5(low + 0.4 * (p.full_truck - p.three_quarter_truck));
  // Curbside discount: $25 off the range, applied once per job. The low
  // bound never drops below $50 so tiny loads stay viable to serve.
  let discount = 0;
  if (opts && opts.curbside) {
    discount = CURBSIDE_DISCOUNT;
    low = Math.max(50, low - discount);
    high = Math.max(low + 5, high - discount);
  }
  // Travel surcharge beyond the included base distance (rough estimate).
  const travel_fee = travelSurcharge(opts && opts.travel_km);
  if (travel_fee) {
    low += travel_fee;
    high += travel_fee;
  }
  const range = "$" + low + " \u2013 $" + high +
    (discount ? " ($" + discount + " curbside discount applied)" : "") +
    (travel_fee ? " (includes $" + travel_fee + " travel)" : "");
  return { label, low, high, discount, travel_fee, range };
}

export function itemsToEighths(items) {
  let e = 0;
  for (const it of items || []) {
    const w = ITEM_WEIGHTS[String(it.name || "").toLowerCase()];
    const q = Math.max(0, Math.min(50, Number(it.quantity) || 1));
    if (w) e += w * q;
  }
  return Math.min(8, e);
}