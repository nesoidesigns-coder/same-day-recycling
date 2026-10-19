// Benchmarked against Vancouver competitors (Oct 2026): local minimums ~$200
// (1-800-GOT-JUNK), small loads (min-1/4 truck) $107-$396, full trucks $590-$1,099.
// We stay clearly under market on the low tiers to win same-day searches.
export const DEFAULT_PRICES = {
  minimum_pickup: 149,
  eighth_truck: 189,
  quarter_truck: 299,
  half_truck: 419,
  three_quarter_truck: 549,
  full_truck: 649,
};

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

export function computeQuote(eighths, prices) {
  const p = { ...DEFAULT_PRICES, ...(prices || {}) };
  const { key, label } = tierFor(eighths);
  const low = p[key];
  const nextKey = NEXT_KEY[key];
  const high = nextKey
    ? round5(low + 0.4 * (p[nextKey] - low))
    : round5(low + 0.4 * (p.full_truck - p.three_quarter_truck));
  return { label, low, high, range: "$" + low + " \u2013 $" + high };
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