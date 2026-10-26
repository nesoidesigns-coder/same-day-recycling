// Recycling OS — master gauge system core.
// Shared geometry, the master colour palette and the five size variants.
// Every gauge on the platform (public, contractor, admin) is built from
// these primitives so ring thickness, ticks, spacing, typography and motion
// stay identical everywhere.

// Master palette (hex for SVG rendering; the same values exist as HSL
// tokens in src/index.css / tailwind.config.js for Tailwind classes).
export const OS_COLORS = {
  core: "#081421",      // Midnight Core — main intelligence background
  deep: "#0E2030",      // Deep Ocean — secondary background
  surface: "#142B3D",   // Elevated Surface — raised panels
  ink: "#EAF3F8",       // Arctic White — primary text on dark
  silver: "#9FB5C4",    // Mist Silver — secondary text
  cyan: "#32C7D5",      // Signal Cyan — observed activity & instrumentation
  blue: "#6C9DF1",      // Intelligence Blue — analytical information
  violet: "#9A82E6",    // Forecast Violet — forecasts & modeled info ONLY
  green: "#55C7A1",     // Verified Green — verified availability & success
  amber: "#E8B66A",     // Amber — caution & pending states
  coral: "#E77B83",     // Coral — critical conditions & errors
  line: "#3D5A73",      // hairline strokes on midnight
  hairline: "#4A76A5",  // dial hairlines
};

// Categorical sector palette: tints of the four semantic accents, ordered so
// adjacent sectors stay distinguishable. Never repurposed for statuses.
export const CATEGORY_PALETTE = ["#32C7D5", "#6C9DF1", "#9A82E6", "#55C7A1", "#67B8DC", "#8FB6F4", "#C0A9F0", "#7ED4BC"];

// Record-type colours — semantic: cyan = observed public activity,
// green = confirmed/verified, amber = qualified/pending, violet = modeled.
export const TYPE_COLORS = {
  observed_public_request: "#32C7D5",
  platform_inquiry: "#6C9DF1",
  confirmed_booking: "#55C7A1",
  qualified_opportunity: "#E8B66A",
  search_interest: "#9A82E6",
  market_indicator: "#67B8DC",
  unknown: "#5C7391",
};

// Five size variants (design targets — adapt to the container).
// All non-micro gauges share one 520-unit viewBox and scale by CSS width;
// radii inside layers are expressed as fractions of R so every variant has
// identical proportions.
export const GAUGE_SIZES = {
  hero: { max: 540, viewBox: 520, R: 246 },
  feature: { max: 340, viewBox: 520, R: 246 },
  standard: { max: 240, viewBox: 520, R: 246 },
  compact: { max: 150, viewBox: 520, R: 246 },
  micro: { max: 60, viewBox: 60, R: 26 },
};

// Centralized motion tokens (mirrored as CSS vars in src/index.css).
export const MOTION = {
  micro: 150,        // micro feedback
  standard: 280,     // standard transitions
  gauge: 600,        // complex gauge transitions
  reveal: 1200,      // initial cinematic reveal
  ease: "cubic-bezier(0.22, 1, 0.36, 1)",
};

const C = 260; // centre of the shared 520-unit viewBox

export const polar = (r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};

export const ringSector = (r0, r1, a0, a1) => {
  const [x0, y0] = polar(r1, a0);
  const [x1, y1] = polar(r1, a1);
  const [x2, y2] = polar(r0, a1);
  const [x3, y3] = polar(r0, a0);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r1} ${r1} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} A ${r0} ${r0} 0 0 0 ${x3.toFixed(2)} ${y3.toFixed(2)} Z`;
};

// Open arc (stroke path) for proportional metrics with a defined share.
export const arcPath = (r, a0, a1, cx = C, cy = C) => {
  const p = (rr, deg) => {
    const a = (deg * Math.PI) / 180;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  };
  const [x0, y0] = p(r, a0);
  const [x1, y1] = p(r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};