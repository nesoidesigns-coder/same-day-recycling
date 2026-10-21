// National geographic engine (server side) — mirrors src/lib/geo.js.
// Scaled from the Canada Post FSA standard, not hand-invented municipality
// records: any valid Canadian postal code maps to its province/territory.
export const REGIONS = [
  { code: "BC", name: "British Columbia", type: "province" },
  { code: "AB", name: "Alberta", type: "province" },
  { code: "SK", name: "Saskatchewan", type: "province" },
  { code: "MB", name: "Manitoba", type: "province" },
  { code: "ON", name: "Ontario", type: "province" },
  { code: "QC", name: "Quebec", type: "province" },
  { code: "NB", name: "New Brunswick", type: "province" },
  { code: "NS", name: "Nova Scotia", type: "province" },
  { code: "PE", name: "Prince Edward Island", type: "province" },
  { code: "NL", name: "Newfoundland and Labrador", type: "province" },
  { code: "YT", name: "Yukon", type: "territory" },
  { code: "NT", name: "Northwest Territories", type: "territory" },
  { code: "NU", name: "Nunavut", type: "territory" },
];

const FSA_TO_PROVINCE = {
  A: "NL", B: "NS", C: "PE", E: "NB",
  G: "QC", H: "QC", J: "QC",
  K: "ON", L: "ON", M: "ON", N: "ON", P: "ON",
  R: "MB", S: "SK", T: "AB", V: "BC",
  X: "",
  Y: "YT",
};

export const normalizePostal = (raw) => {
  const s = String(raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (/^[A-Z]\d[A-Z]$/.test(s)) return s;
  if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(s)) return s.slice(0, 3);
  return "";
};

export const provinceFromFsa = (fsa) => FSA_TO_PROVINCE[String(fsa || "").charAt(0)] ?? "";

export const regionByCode = (code) => REGIONS.find((r) => r.code === code) || null;