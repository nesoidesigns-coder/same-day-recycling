// Single source of truth for service coverage. Never advertise a city as live
// unless its status here is "active" (confirmed operator coverage or a verified partner).
// status values:
//   "active"             — Active & Verified: operational same-day service with confirmed coverage.
//   "partner_onboarding" — Partner Onboarding: a partner is being recruited or verified. No confirmed service yet.
//   "coming_soon"        — Coming Soon: expansion is planned. Service is not yet available.
// Province labels are part of the record — a city must never be shown with the wrong province.

export const COVERAGE = [
  // Operator-run service (Lower Mainland, BC) — confirmed by the company's own service terms.
  // capabilities = verified service capabilities; last_verified = last operational verification date.
  // Partner assignment lives in the Partner entity — never inferred from directory listings.
  { name: "Vancouver", province: "BC", status: "active", capabilities: ["junk_removal", "furniture", "appliances", "electronics", "metal_pickup", "cleanouts"], last_verified: "2026-10-20" },
  { name: "Burnaby", province: "BC", status: "active", capabilities: ["junk_removal", "furniture", "appliances", "electronics", "metal_pickup", "cleanouts"], last_verified: "2026-10-20" },
  { name: "Surrey", province: "BC", status: "active", capabilities: ["junk_removal", "furniture", "appliances", "electronics", "metal_pickup", "cleanouts"], last_verified: "2026-10-20" },
  { name: "Richmond", province: "BC", status: "active", capabilities: ["junk_removal", "furniture", "appliances", "electronics", "metal_pickup", "cleanouts"], last_verified: "2026-10-20" },
  { name: "Coquitlam", province: "BC", status: "active", capabilities: ["junk_removal", "furniture", "appliances", "electronics", "metal_pickup", "cleanouts"], last_verified: "2026-10-20" },

  // Partner onboarding — recruitment or verification underway.
  { name: "Victoria", province: "BC", status: "partner_onboarding" },
  { name: "Calgary", province: "AB", status: "partner_onboarding" },
  { name: "Edmonton", province: "AB", status: "partner_onboarding" },
  { name: "Saskatoon", province: "SK", status: "partner_onboarding" },
  { name: "Regina", province: "SK", status: "partner_onboarding" },
  { name: "Winnipeg", province: "MB", status: "partner_onboarding" },
  { name: "Toronto", province: "ON", status: "partner_onboarding" },
  { name: "Ottawa", province: "ON", status: "partner_onboarding" },
  { name: "Hamilton", province: "ON", status: "partner_onboarding" },
  { name: "Mississauga", province: "ON", status: "partner_onboarding" },
  { name: "Montreal", province: "QC", status: "partner_onboarding" },
  { name: "Quebec City", province: "QC", status: "partner_onboarding" },
  { name: "Moncton", province: "NB", status: "partner_onboarding" },
  { name: "Saint John", province: "NB", status: "partner_onboarding" },
  { name: "Halifax", province: "NS", status: "partner_onboarding" },
  { name: "St. John's", province: "NL", status: "partner_onboarding" },

  // Coming soon — planned expansion, no service yet.
  { name: "Kamloops", province: "BC", status: "coming_soon" },
  { name: "Kelowna", province: "BC", status: "coming_soon" },
  { name: "Maple Ridge", province: "BC", status: "coming_soon" },
  { name: "Pitt Meadows", province: "BC", status: "coming_soon" },
  { name: "Charlottetown", province: "PE", status: "coming_soon" },
  { name: "Whitehorse", province: "YT", status: "coming_soon" },
  { name: "Yellowknife", province: "NT", status: "coming_soon" },
  { name: "Iqaluit", province: "NU", status: "coming_soon" },
];

export const STATUS_LABELS = {
  active: "Active & Verified",
  partner_onboarding: "Partner Onboarding",
  coming_soon: "Coming Soon",
};

export const coverageByStatus = (status) => COVERAGE.filter((c) => c.status === status);

export const activeCitiesByProvince = (province) =>
  COVERAGE.filter((c) => c.province === province && c.status === "active").map((c) => c.name);

export const onboardingCitiesByProvince = (province) =>
  COVERAGE.filter((c) => c.province === province && c.status === "partner_onboarding").map((c) => c.name);

export const comingSoonCitiesByProvince = (province) =>
  COVERAGE.filter((c) => c.province === province && c.status === "coming_soon").map((c) => c.name);

export const cityByName = (name) => COVERAGE.find((c) => c.name === name) || null;

// True only for cities with confirmed, bookable service. The single
// availability rule every booking, subscription, quote and metal-pickup
// form must use — non-active cities get the waitlist flow instead.
export const isCityActive = (name) => cityByName(name)?.status === "active";

// Full service profile for a city: status, verified capabilities, booking
// eligibility and last verification date — the shape every surface
// (region pages, AI assistants, city cards) should consume.
export const cityServiceProfile = (name) => {
  const c = cityByName(name);
  if (!c) return null;
  return {
    ...c,
    bookingEligible: c.status === "active",
    capabilities: c.capabilities || [],
    last_verified: c.last_verified || null,
  };
};