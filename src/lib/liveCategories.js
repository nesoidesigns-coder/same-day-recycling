// Shared labels for the LIVE intelligence experience. Keys mirror the
// DemandSignal market_categories enum so UI labels and stored data can never
// drift apart.
export const LIVE_CATEGORIES = {
  furniture_appliance_removal: "Furniture & Appliance Removal",
  moving_downsizing: "Moving Cleanouts",
  renovation_construction_debris: "Construction Debris",
  property_management_turnover: "Property Management",
  recycling_specialty_disposal: "Recycling & Specialty Disposal",
  commercial_office_cleanouts: "Commercial Services",
  urgent_same_day: "Urgent / Same-Day",
  donation_reuse_circular: "Donation & Reuse",
};

// Short console labels — the radar strip has room for one word per market.
export const LIVE_CATEGORY_SHORT = {
  furniture_appliance_removal: "Furniture",
  moving_downsizing: "Moving",
  renovation_construction_debris: "Construction",
  property_management_turnover: "Property",
  recycling_specialty_disposal: "Recycling",
  commercial_office_cleanouts: "Commercial",
  urgent_same_day: "Same-Day",
  donation_reuse_circular: "Donation",
};

export const DEMAND_TYPE_LABELS = {
  observed_public_request: "Observed public requests",
  platform_inquiry: "Platform inquiries",
  confirmed_booking: "Confirmed bookings",
  search_interest: "Search interest",
  qualified_opportunity: "Qualified opportunities",
  market_indicator: "Market indicators",
};