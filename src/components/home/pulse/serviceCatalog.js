// Service catalog: maps consumer-facing service names to the eight-market
// demand taxonomy used by the liveIntelligence signal engine (shared by the
// public gauges and the admin views).
export const SERVICES = [
  { name: "Junk removal", cats: ["urgent_same_day", "furniture_appliance_removal", "renovation_construction_debris"], blurb: "Household and renovation junk, hauled away and sorted for recycling." },
  { name: "Furniture removal", cats: ["furniture_appliance_removal"], blurb: "Sofas, mattresses, dressers — removed and responsibly processed." },
  { name: "Appliance removal", cats: ["furniture_appliance_removal"], blurb: "Fridges, washers and stoves, safely disconnected and recycled." },
  { name: "Electronics recycling", cats: ["recycling_specialty_disposal"], blurb: "TVs, computers and electronics taken to certified recyclers." },
  { name: "Metal pickup", cats: ["recycling_specialty_disposal"], blurb: "Scrap metal collected — often free, depending on the load." },
  { name: "Moving cleanouts", cats: ["moving_downsizing"], blurb: "Clear out what is left behind before or after a move." },
  { name: "Estate cleanouts", cats: ["property_management_turnover", "moving_downsizing"], blurb: "Full-property clearouts handled with care and documentation." },
  { name: "Property turnover", cats: ["property_management_turnover"], blurb: "Between-tenant cleanouts for managers and owners." },
  { name: "Commercial cleanouts", cats: ["commercial_office_cleanouts"], blurb: "Office, retail and commercial waste on your schedule." },
  { name: "Donation & reuse", cats: ["donation_reuse_circular"], blurb: "Reusable goods routed to donation channels where possible." },
];

// Actionable signal types: real intent or completed activity.
export const ACTIONABLE_TYPES = ["observed_public_request", "platform_inquiry", "confirmed_booking", "qualified_opportunity"];

export const TYPE_LABELS = {
  observed_public_request: "Observed public requests",
  search_interest: "Search interest",
  platform_inquiry: "Platform inquiries",
  confirmed_booking: "Confirmed bookings",
  qualified_opportunity: "Qualified opportunities",
  market_indicator: "Market indicators",
};

export const CATEGORY_LABELS = {
  furniture_appliance_removal: "Furniture & appliances",
  moving_downsizing: "Moving & downsizing",
  renovation_construction_debris: "Renovation & construction",
  property_management_turnover: "Property turnover",
  recycling_specialty_disposal: "Recycling & specialty",
  commercial_office_cleanouts: "Commercial",
  urgent_same_day: "Urgent same-day",
  donation_reuse_circular: "Donation & reuse",
};

// Normalized 0-100 activity index: last-7-day signals divided by the average
// weekly volume over the trailing 90 days, capped at 100. Documented in the
// gauges' info panel. Returns null when there is nothing to normalize.
export function pulseIndex(recent7, baseline90) {
  const weekly = baseline90 / (90 / 7);
  if (!recent7 && !weekly) return null;
  if (!weekly) return 100;
  return Math.min(100, Math.round((recent7 / weekly) * 100));
}

// Trend: compare the last week against the average week of the last 30 days.
export function trendDirection(recent7, baseline30) {
  const weekly = baseline30 / (30 / 7);
  if (!recent7 && !weekly) return null;
  if (!weekly) return "up";
  const diff = (recent7 - weekly) / weekly;
  if (diff > 0.1) return "up";
  if (diff < -0.1) return "down";
  return "flat";
}

export function freshness(iso) {
  if (!iso) return "";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins || 1} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
  return `${Math.round(mins / 1440)} d ago`;
}