// Single source of truth for the national dispatch model.
//
// Two independent operational statuses, never merged:
//   1. Customer request availability — OPEN NATIONWIDE. Every Canadian
//      municipality can submit a same-day service request, always. The
//      absence of a registered contractor never blocks an inquiry.
//   2. Dispatch fulfillment status — per JOB, not per city (see
//      DISPATCH_STATUS_LABELS below): awaiting_contractor, contractor_contacted,
//      contractor_accepted, pickup_scheduled, job_completed, unable_to_fulfill.
//
// The per-city registry below marks markets with confirmed same-day dispatch
// capacity (operator-run or a verified contractor) — these get the fastest
// fulfillment. Requests in every other municipality are still accepted and
// dispatched via dynamically sourced local contractors.
// Province labels are part of the record — a city must never be shown with the wrong province.

const FULL_CAPABILITIES = ["junk_removal", "furniture", "appliances", "electronics", "metal_pickup", "cleanouts"];

export const COVERAGE = [
  { name: "Vancouver", province: "BC", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Burnaby", province: "BC", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Surrey", province: "BC", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Richmond", province: "BC", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Coquitlam", province: "BC", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Victoria", province: "BC", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Kamloops", province: "BC", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Kelowna", province: "BC", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Maple Ridge", province: "BC", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Pitt Meadows", province: "BC", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Calgary", province: "AB", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Edmonton", province: "AB", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Saskatoon", province: "SK", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Regina", province: "SK", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Winnipeg", province: "MB", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Toronto", province: "ON", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Ottawa", province: "ON", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Hamilton", province: "ON", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Mississauga", province: "ON", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Montreal", province: "QC", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Quebec City", province: "QC", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Moncton", province: "NB", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Saint John", province: "NB", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Halifax", province: "NS", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Charlottetown", province: "PE", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "St. John's", province: "NL", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Whitehorse", province: "YT", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Yellowknife", province: "NT", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
  { name: "Iqaluit", province: "NU", status: "active", capabilities: FULL_CAPABILITIES, last_verified: "2026-10-21" },
];

export const STATUS_LABELS = {
  active: "Same-Day Confirmed",
  partner_onboarding: "Inquiries Open — Matching Provider",
  coming_soon: "Inquiries Open — Recruiting Provider",
};

// Dispatch fulfillment status — tracked per job on each request, never per
// city. Sourcing a contractor is the dispatch team's job; a market never
// blocks a customer request.
export const DISPATCH_STATUS_LABELS = {
  awaiting_contractor: "Awaiting contractor",
  contractor_contacted: "Contractor contacted",
  contractor_accepted: "Contractor accepted",
  pickup_scheduled: "Pickup scheduled",
  job_completed: "Job completed",
  unable_to_fulfill: "Unable to fulfill",
};

export const coverageByStatus = (status) => COVERAGE.filter((c) => c.status === status);

export const activeCitiesByProvince = (province) =>
  COVERAGE.filter((c) => c.province === province && c.status === "active").map((c) => c.name);

export const onboardingCitiesByProvince = (province) =>
  COVERAGE.filter((c) => c.province === province && c.status === "partner_onboarding").map((c) => c.name);

export const comingSoonCitiesByProvince = (province) =>
  COVERAGE.filter((c) => c.province === province && c.status === "coming_soon").map((c) => c.name);

export const cityByName = (name) => COVERAGE.find((c) => c.name === name) || null;

// Cities with confirmed operational capacity — same-day booking everywhere.
export const SAME_DAY_CITIES = COVERAGE.filter((c) => c.status === "active").map((c) => c.name);

// True for cities with confirmed, bookable same-day service. The single
// rule every direct-booking form uses.
export const isCityActive = (name) => cityByName(name)?.status === "active";

// Independent per-city market profile — market activation and provider
// verification are separate fields, never merged.
export const marketProfile = (name) => {
  const c = cityByName(name);
  const verified = c?.status === "active";
  return {
    market_active: true,               // every Canadian municipality
    inquiries_enabled: true,           // always — never restricted by contractor state
    contractor_assigned: c ? verified : false,
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