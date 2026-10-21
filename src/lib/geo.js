// National geographic engine — scaled from the Canada Post FSA standard,
// not hand-invented municipality records. Any valid Canadian postal code
// maps to its province/territory, so every municipality can be served.
import { REGIONS, regionByCode } from "@/lib/regions";

export { REGIONS, regionByCode };

// FSA (first 3 postal characters) first letter → province/territory.
// X spans both the Northwest Territories and Nunavut — the customer must pick.
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

export const isValidPostal = (raw) => normalizePostal(raw) !== "";

export const provinceFromFsa = (fsa) => FSA_TO_PROVINCE[String(fsa || "").charAt(0)] ?? "";

export const territoryNeeded = (fsa) => String(fsa || "").charAt(0) === "X";

export const provinceName = (code) => regionByCode(code)?.name || "";

export const SERVICE_TYPES = [
  { value: "junk_removal", label: "Junk removal / general pickup" },
  { value: "furniture", label: "Furniture removal" },
  { value: "appliances", label: "Appliance removal" },
  { value: "electronics", label: "Electronics recycling" },
  { value: "metal_pickup", label: "Free metal pickup" },
  { value: "cleanouts", label: "Estate / property cleanout" },
  { value: "other", label: "Other material pickup" },
];