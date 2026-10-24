import geography from "@/components/sdr/canadaGeography.json";

// Natural Earth 1:110m country boundaries, public domain. Includes 30
// Canadian land polygons, including the Arctic islands. Both renderers use
// this exact geometry; markers never imply province-wide service coverage.
export const CANADA_OUTLINES = geography.geometry.coordinates.map((polygon) =>
  polygon[0].map(([lng, lat]) => [lat, lng])
);
export const MAINLAND = CANADA_OUTLINES[0];
export const VANCOUVER_ISLAND = CANADA_OUTLINES[17];
export const NEWFOUNDLAND = CANADA_OUTLINES[10];
export const GEOGRAPHY_SOURCE = "https://www.naturalearthdata.com/about/terms-of-use/";

// Equirectangular projection shared by both renderers.
export const PROJ = { lng0: -96, lat0: 62, s: 0.5 };
export const pt = (lat, lng) => ({ x: (lng - PROJ.lng0) * PROJ.s, y: (lat - PROJ.lat0) * PROJ.s });

export const LAYER_COLORS = {
  verified: 0x2fd4a0,  // emerald — verified coverage
  demand: 0x22d3ee,    // cyan — verified customer demand signals
  ai: 0xa78bfa,        // violet — AI intelligence findings
  matching: 0xfbbf24,  // amber — contractor matching underway
  selected: 0xffffff,  // white — selected location
  recruiting: 0x94a3b8,
  unknown: 0x94a3b8,
};
export const LAYER_HEX = {
  verified: "#2fd4a0", demand: "#22d3ee", ai: "#a78bfa", matching: "#fbbf24", selected: "#ffffff", recruiting: "#94a3b8", unknown: "#94a3b8",
};
const projected = CANADA_OUTLINES.flat().map(([lat, lng]) => pt(lat, lng));
export const MAP_BOUNDS = {
  minX: Math.min(...projected.map((p) => p.x)), maxX: Math.max(...projected.map((p) => p.x)),
  minY: Math.min(...projected.map((p) => p.y)), maxY: Math.max(...projected.map((p) => p.y)),
};