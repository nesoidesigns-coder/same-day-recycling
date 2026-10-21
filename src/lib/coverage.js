// Single source of truth for service coverage.
//
// TWO INDEPENDENT AXES — never merged into one "live/not-live" switch:
//   1. Market activation: EVERY Canadian municipality is active for customer
//      inquiries, always. Inquiries are never restricted to registered
//      contractors — customer demand drives contractor recruitment.
//   2. Service verification: guaranteed same-day pickup is advertised ONLY in
//      cities with confirmed operational capacity (operator-run or a verified
//      partner). Everywhere else, local availability and scheduling are
//      confirmed AFTER a request is submitted.
//
// status values (per-city service-verification state):
//   "active"             — Same-Day Confirmed: operational same-day service with confirmed coverage.
//   "partner_onboarding" — Inquiries Open, Matching Provider: inquiries accepted now; a partner is being matched/verified.
//   "coming_soon"        — Inquiries Open, Recruiting Provider: inquiries accepted now; recruitment underway (often demand-driven).
// Province labels are part of the record — a city must never be shown with the wrong province.

export const COVERAGE = [
  // Operator-run service (Lower Mainland, BC) — guaranteed same-day capacity.
  // capabilities = verified service capabilities; last_verified = last operational verification date.
  // Partner assignment lives in the Partner entity — never inferred from directory listings.
  { name: "Vancouver", province: "BC", status: "active", capabilities: ["junk_removal", "furniture", "appliances", "electronics", "metal_pickup", "cleanouts"], last_verified: "2026-10-20" },
  { name: "Burnaby", province: "BC", status: "active", capabilities: ["junk_removal", "furniture", "appliances", "electronics", "metal_pickup", "cleanouts"], last_verified: "2026-10-20" },
  { name: "Surrey", province: "BC", status: "active", capabilities: ["junk_removal", "furniture", "appliances", "electronics", "metal_pickup", "cleanouts"], last_verified: "2026-10-20" },
  { name: "Richmond", province: "BC", status: "active", capabilities: ["junk_removal", "furniture", "appliances", "electronics", "metal_pickup", "cleanouts"], last_verified: "2026-10-20" },
  { name: "Coquitlam", province: "BC", status: "active", capabilities: ["junk_removal", "furniture", "appliances", "electronics", "metal_pickup", "cleanouts"], last_verified: "2026-10-20" },

  // Inquiries open — provider matching / recruitment underway.
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

  // Inquiries open — demand-driven recruitment in progress.
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
  active: "Same-Day Confirmed",
  partner_onboarding: "Inquiries Open — Matching Provider",
  coming_soon: "Inquiries Open — Recruiting Provider",
};

export const coverageByStatus = (status) => COVERAGE.filter((c) => c.status === status);

export const activeCitiesByProvince = (province) =>
  COVERAGE.filter((c) => c.province === province && c.status === "active").map((c) => c.name);

export const onboardingCitiesByProvince = (province) =>
  COVERAGE.filter((c) => c.province === province && c.status === "partner_onboarding").map((c) => c.name);

export const comingSoonCitiesByProvince = (province) =>
  COVERAGE.filter((c) => c.province === province && c.status === "coming_soon").map((c) => c.name);

export const cityByName = (name) => COVERAGE.find((c) => c.name === name) || null;

// Cities with confirmed operational capacity — the ONLY markets where
// guaranteed same-day booking is offered. Inquiries are open everywhere.
export const SAME_DAY_CITIES = COVERAGE.filter((c) => c.status === "active").map((c) => c.name);

// True only for cities with confirmed, bookable same-day service. The single
// rule every direct-booking form uses — all other markets submit inquiries.
export const isCityActive = (name) => cityByName(name)?.status === "active";

// Independent per-city market profile — market activation and provider
// verification are separate fields, never merged. Contractor assignment is
// data-driven (Partner / verified ProviderRecruit records); static entries
// reflect only the listed recruitment state.
export const marketProfile = (name) => {
  const c = cityByName(name);
  const verified = c?.status === "active";
  return {
    market_active: true,               // every Canadian municipality
    inquiries_enabled: true,           // always — never restricted by contractor state
    contractor_assigned: c ? c.status !== "coming_soon" : false,
    contractor_verified: verified,
    immediate_booking: verified,
  };
};

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
    ...marketProfile(name),
  };
};