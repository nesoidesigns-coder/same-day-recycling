// Single source of truth for the national coverage model.
//
// FOUR SEPARATE LAYERS, never merged:
//   1. Service Territory  — cities where customers can submit requests.
//   2. Contractor Capacity — verified partners, loaded LIVE from the
//      coverageStatus endpoint (src/hooks/useCoverageStatus.js). Never
//      hardcoded and never derived from facility counts.
//   3. Facility Directory — independent drop-off facilities (Provider
//      entity); listed ≠ partnered, and directory counts never imply
//      pickup capacity.
//   4. Booking Confirmation — per-job state on each request
//      (DISPATCH_STATUS_LABELS): a status exists only when a specific
//      contractor has accepted a specific job and window.
//
// Public status labels (applied identically on every surface):
//   same_day    → "Provider Confirmed"         (legacy key; a verified contractor exists on file — never proof of today's capacity or job acceptance)
//   matching    → "Provider Matching"          (requests open, dispatch arranging a contractor)
//   recruiting  → "Recruitment Open"           (no contractor on file yet; requests still accepted nationwide)
//   per-job     → "Booking Confirmed"          (contractor accepted a specific job)
// "Service Unavailable" is never shown for intake — requests stay open in every
// Canadian municipality; only guaranteed same-day pickup is unavailable, which
// the matching/recruiting states above already express.

const FULL_CAPABILITIES = ["junk_removal", "furniture", "appliances", "electronics", "metal_pickup", "cleanouts"];

// Service Territory registry: every listed city accepts service requests.
// `status: "requests_open"` describes TERRITORY availability only —
// contractor capacity is layered on live by useCoverageStatus().
export const COVERAGE = [
  { name: "Vancouver", province: "BC", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "North Vancouver", province: "BC", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Burnaby", province: "BC", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Surrey", province: "BC", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Richmond", province: "BC", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Coquitlam", province: "BC", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Victoria", province: "BC", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Kamloops", province: "BC", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Kelowna", province: "BC", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Maple Ridge", province: "BC", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Pitt Meadows", province: "BC", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Calgary", province: "AB", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Edmonton", province: "AB", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Saskatoon", province: "SK", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Regina", province: "SK", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Winnipeg", province: "MB", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Toronto", province: "ON", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Ottawa", province: "ON", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Hamilton", province: "ON", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Mississauga", province: "ON", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Montreal", province: "QC", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Quebec City", province: "QC", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Moncton", province: "NB", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Saint John", province: "NB", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Halifax", province: "NS", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Charlottetown", province: "PE", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "St. John's", province: "NL", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Whitehorse", province: "YT", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Yellowknife", province: "NT", status: "requests_open", capabilities: FULL_CAPABILITIES },
  { name: "Iqaluit", province: "NU", status: "requests_open", capabilities: FULL_CAPABILITIES },
];

// City-level public status labels — one wording everywhere.
export const STATUS_LABELS = {
  same_day: "Provider Confirmed",
  matching: "Provider Matching",
  recruiting: "Recruitment Open",
  requests_open: "Provider Matching",
};

// Dispatch fulfillment status — tracked per JOB on each request, never per
// city. "Booking Confirmed" exists only when a specific contractor has
// accepted a specific job and appointment window.
export const DISPATCH_STATUS_LABELS = {
  awaiting_contractor: "Requests open — contractor matching",
  contractor_contacted: "Contractor contacted",
  contractor_accepted: "Booking confirmed",
  pickup_scheduled: "Pickup scheduled — booking confirmed",
  job_completed: "Job completed",
  unable_to_fulfill: "Unable to fulfill",
};

export const coverageByStatus = (status) => COVERAGE.filter((c) => c.status === status);
export const activeCitiesByProvince = (province) => COVERAGE.filter((c) => c.province === province).map((c) => c.name);

// Legacy helpers kept for compatibility: onboarding/coming-soon buckets no
// longer exist in the registry (capacity is derived live, not hardcoded).
export const onboardingCitiesByProvince = () => [];
export const comingSoonCitiesByProvince = () => [];

// Cities with LIVE verified contractor capacity — pass the capacity set from
// useCoverageStatus(). Never assumed from the registry alone.
export const sameDayCities = (verifiedCitySet) =>
  COVERAGE.filter((c) => verifiedCitySet && verifiedCitySet.has(c.name.toLowerCase())).map((c) => c.name);

// True when the city is in the service-territory registry (direct request
// intake open). This means REQUESTS ARE ACCEPTED — it never means same-day
// service is confirmed; fulfillment always depends on contractor acceptance.
export const isCityActive = (name) => !!cityByName(name);

export const cityByName = (name) =>
  COVERAGE.find((c) => c.name.toLowerCase() === String(name || "").toLowerCase()) || null;

// Independent per-city market profile. Contractor fields come from the live
// capacity layer (verifiedCitySet); when unknown they are false, never true.
export const marketProfile = (name, verifiedCitySet) => {
  const c = cityByName(name);
  const verified = !!(c && verifiedCitySet && verifiedCitySet.has(c.name.toLowerCase()));
  return {
    market_active: !!c,                // registry city accepts requests
    inquiries_enabled: true,           // always — never restricted by contractor state
    contractor_assigned: verified,
    contractor_verified: verified,
    immediate_booking: verified,       // same-day availability, subject to booking confirmation
  };
};

// Full service profile for a city — the shape every surface consumes.
// verifiedCitySet: from useCoverageStatus(). "matching" state comes from
// open requests data (matchingCitySet) where provided.
export const cityServiceProfile = (name, verifiedCitySet, matchingCitySet) => {
  const c = cityByName(name);
  if (!c) return null;
  const profile = marketProfile(name, verifiedCitySet);
  let status = profile.contractor_verified ? "same_day" : "recruiting";
  if (!profile.contractor_verified && matchingCitySet && matchingCitySet.has(c.name.toLowerCase())) {
    status = "matching";
  }
  return {
    ...c,
    ...profile,
    status,                             // same_day | matching | recruiting
    status_label: STATUS_LABELS[status],
    bookingEligible: profile.contractor_verified,
    capabilities: c.capabilities || [],
  };
};