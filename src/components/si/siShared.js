import { base44 } from "@/api/base44Client";

// Shared helpers for the Service Intelligence homepage prototype.
// Every public number traces to one of these sources:
//  - liveIntelligence  → labelled demand records (DemandSignal)
//  - coverageStatus    → verified partner coverage records
//  - cityPricing       → platform published rates (Admin > Pricing)
//  - recyclingCenters  → public recycling facility directory

export const keyOf = (v) =>
  String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export const money = (n) =>
  Number.isFinite(n)
    ? new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n)
    : null;

export const timestamp = (v) =>
  v ? new Date(v).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

export async function invoke(name, params) {
  const { data } = await base44.functions.invoke(name, params);
  if (data?.error) throw new Error(data.error);
  return data;
}

// Six consumer shortcuts → market-category filter + destination page.
export const SERVICE_SHORTCUTS = [
  { key: "furniture", label: "Furniture Removal", category: "furniture_appliance_removal", to: "/furniture-removal" },
  { key: "appliance", label: "Appliance Removal", category: "furniture_appliance_removal", to: "/appliance-removal" },
  { key: "junk", label: "Junk Removal", category: "", to: "/request-service" },
  { key: "moving", label: "Moving Cleanouts", category: "moving_downsizing", to: "/move-assist" },
  { key: "estate", label: "Estate Cleanouts", category: "property_management_turnover", to: "/request-service?service=cleanouts" },
  { key: "commercial", label: "Commercial Removal", category: "commercial_office_cleanouts", to: "/commercial-recycling" },
];

export const shortcutForCategory = (category) => SERVICE_SHORTCUTS.find((s) => s.category === category);

// Segment palette (inline SVG hex — data-driven colors, not class names).
export const SI_COLORS = {
  forest: "#123D32",
  mint: "#22CFA7",
  mint2: "#8DDFCA",
  blue: "#4F9EC4",
  amber: "#F6A000",
  other: "#9CB4AA",
};

// Demand types that are recorded customer activity vs. market context.
// Search-interest indices are never counted as activity — they are relative
// indices, not request counts.
const CONTEXT_TYPES = new Set(["search_interest", "market_indicator"]);

function activityCount(row) {
  const dt = row.demand_types || {};
  const context = Object.keys(dt)
    .filter((k) => CONTEXT_TYPES.has(k))
    .reduce((s, k) => s + (dt[k] || 0), 0);
  return Math.max(0, row.count - context);
}

// Gauge A composition: real recorded activity by market category, from the
// liveIntelligence feed. Small categories fold into one honest "Other" bucket.
const ACTIVITY_BUCKETS = [
  { key: "furniture_appliance_removal", label: "Furniture & appliances", color: SI_COLORS.forest },
  { key: "moving_downsizing", label: "Moving & downsizing", color: SI_COLORS.mint },
  { key: "renovation_construction_debris", label: "Renovation debris", color: SI_COLORS.mint2 },
  { key: "property_management_turnover", label: "Property & estate", color: SI_COLORS.blue },
  { key: "commercial_office_cleanouts", label: "Commercial", color: SI_COLORS.amber },
];

export function buildActivitySegments(data) {
  const rows = data?.rows || [];
  const totals = new Map(ACTIVITY_BUCKETS.map((b) => [b.key, 0]));
  let other = 0;
  rows.forEach((row) => {
    const v = activityCount(row);
    if (!v) return;
    if (totals.has(row.key)) totals.set(row.key, totals.get(row.key) + v);
    else other += v;
  });
  const segments = ACTIVITY_BUCKETS.filter((b) => totals.get(b.key) > 0).map((b) => ({
    key: b.key,
    label: b.label,
    value: totals.get(b.key),
    color: b.color,
  }));
  if (other > 0) segments.push({ key: "other", label: "Other recorded", value: other, color: SI_COLORS.other });
  return segments;
}

export const totalActivity = (segments) => (segments || []).reduce((s, x) => s + x.value, 0);

// Gauge B: distribution of verified coverage statuses across monitored cities.
export const COVERAGE_STATUS = {
  same_day: { label: "Provider available", color: SI_COLORS.mint, note: "A verified provider serves this city. The exact job, price and time window are still confirmed per request." },
  matching: { label: "Contractor matching", color: SI_COLORS.amber, note: "An open request is being matched with a provider. No provider is confirmed yet." },
  recruiting: { label: "Provider Matching Available", color: SI_COLORS.blue, note: "Requests are accepted here; a provider is sourced for each request. Fulfillment is confirmed after matching." },
  currently_unavailable: { label: "Request Service", color: SI_COLORS.other, note: "No provider on file for this location yet — submit your request and provider sourcing starts immediately." },
};

export function buildCoverageSegments(coverage) {
  if (!coverage?.loaded || !coverage?.locations) return [];
  const counts = { same_day: 0, matching: 0, recruiting: 0, currently_unavailable: 0 };
  coverage.locations.forEach((loc) => {
    const s = coverage.statusFor(loc.name) || "currently_unavailable";
    counts[s] = (counts[s] || 0) + 1;
  });
  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ key: k, label: COVERAGE_STATUS[k].label, value: v, color: COVERAGE_STATUS[k].color }));
}